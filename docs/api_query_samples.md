# SiteSafe RAG Query API Documentation (`POST /api/query`)

The `POST /api/query` endpoint exposes the SiteSafe Construction Compliance Assistant RAG pipeline as a clean REST API. It accepts natural language field questions or observations, executes hybrid retrieval and grounded synthesis, and returns structured JSON responses complete with grounded answers, source metadata, citation details, and refusal guardrail status.

---

## Endpoint Specification

- **URL**: `/api/query`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Authentication**: None required for query endpoint (Rate limited per client IP).

---

## 1. Successful Grounded Response (`200 OK`)

### Request Payload

```json
{
  "question": "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?",
  "trade": "Electrical",
  "jurisdiction": "National",
  "document_type": "Code",
  "top_k": 5
}
```

### Response Body (`status: "success"`)

```json
{
  "status": "success",
  "answer": "Non-Compliant [1]: Installation of 1-inch Schedule 40 PVC conduit in ceiling return air plenums violates NEC Article 300.22(C) [1].\n\nField Observation Evaluation: Regarding 'Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum': Under NEC Article 300.22(C) [1] (National Electrical Code 2023) and Project Specification 26 05 33 §2.01.B [1], spaces used for environmental air handling strictly prohibit nonmetallic combustible raceways (including Schedule 40/80 PVC). In the event of a fire, PVC decomposes to release hydrogen chloride gas and dense toxic smoke. All raceways routed within drop-ceiling return air plenums must be noncombustible metallic wiring methods (EMT, IMC, or RMC) with steel compression fittings.",
  "verdict": "Non-Compliant",
  "confidence_score": 0.98,
  "summary": "Non-Compliant [1]: Installation of 1-inch Schedule 40 PVC conduit in ceiling return air plenums violates NEC Article 300.22(C) [1].",
  "technical_analysis": "Field Observation Evaluation: Regarding 'Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum': Under NEC Article 300.22(C) [1] (National Electrical Code 2023) and Project Specification 26 05 33 §2.01.B [1], spaces used for environmental air handling strictly prohibit nonmetallic combustible raceways (including Schedule 40/80 PVC). In the event of a fire, PVC decomposes to release hydrogen chloride gas and dense toxic smoke. All raceways routed within drop-ceiling return air plenums must be noncombustible metallic wiring methods (EMT, IMC, or RMC) with steel compression fittings.",
  "sources": [
    {
      "document": "National Electrical Code (NEC 2023)",
      "document_filename": "nec_2023_plenum.txt",
      "chunk_id": "nec_300_22_c0",
      "chunk_index": 0,
      "clause_number": "NEC Article 300.22",
      "page": "Article 300.22(C)",
      "trade": "Electrical",
      "direct_quote": "Rigid nonmetallic conduit (Schedule 40/80 PVC), Electrical Nonmetallic Tubing (ENT), and general nonmetallic raceways are strictly PROHIBITED from being installed in environmental air spaces or plenums."
    }
  ],
  "citations": [
    {
      "citation_index": 1,
      "clause_number": "NEC Article 300.22",
      "document_title": "National Electrical Code (NEC 2023)",
      "document_type": "Code",
      "jurisdiction": "National",
      "trade": "Electrical",
      "page_or_section": "Article 300.22(C)",
      "direct_quote": "Rigid nonmetallic conduit (Schedule 40/80 PVC), Electrical Nonmetallic Tubing (ENT), and general nonmetallic raceways are strictly PROHIBITED from being installed in environmental air spaces or plenums.",
      "relevance_explanation": "Prohibits nonmetallic raceways (1-inch Schedule 40 PVC conduit) in environmental air plenums.",
      "document_filename": "nec_2023_plenum.txt",
      "chunk_id": "nec_300_22_c0",
      "chunk_index": 0
    }
  ],
  "recommended_actions": [
    "Immediately issue a Non-Conformance Report (NCR) for 1-inch Schedule 40 PVC conduit in the plenum.",
    "Replace non-compliant PVC runs with Electrical Metallic Tubing (EMT) using steel compression fittings.",
    "Inspect raceway routing prior to ceiling closure."
  ],
  "metadata": {
    "query": "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?",
    "elapsed_time_ms": 35.42,
    "chunks_retrieved": 5,
    "filters_applied": {
      "trade": "Electrical",
      "jurisdiction": "National",
      "document_type": "Code",
      "top_k": 5
    },
    "retrieval_mode": "Hybrid (Dense + BM25 Sparse RRF)"
  }
}
```

---

## 2. Safe Refusal Response (`200 OK`, `status: "refusal"`)

Triggered when the question is unsupported or context retrieval is below relevance threshold.

### Request Payload

```json
{
  "question": "What is the allowable paint hue for the janitor closet door hinges under city guidelines?"
}
```

### Response Body (`status: "refusal"`)

```json
{
  "status": "refusal",
  "answer": "I couldn't find enough supporting information in the retrieved sources to answer this question.\n\nHallucination Guardrail Triggered: Retrieval quality is below the required relevance threshold. Without governing statutory code or specification references meeting the required relevance threshold, the system strictly refuses to speculate or generate an ungrounded determination.",
  "verdict": "Ambiguous/Insufficient Data",
  "confidence_score": 0.98,
  "summary": "I couldn't find enough supporting information in the retrieved sources to answer this question.",
  "technical_analysis": "Hallucination Guardrail Triggered: Retrieval quality is below the required relevance threshold. Without governing statutory code or specification references meeting the required relevance threshold, the system strictly refuses to speculate or generate an ungrounded determination.",
  "sources": [],
  "citations": [],
  "recommended_actions": [
    "Broaden trade and jurisdiction filters to 'All'.",
    "Verify if project-specific submittals or architect directives govern this condition.",
    "Submit an official Request for Information (RFI) to the Structural/MEP Engineer of Record."
  ],
  "metadata": {
    "query": "What is the allowable paint hue for the janitor closet door hinges under city guidelines?",
    "elapsed_time_ms": 18.25,
    "chunks_retrieved": 1,
    "filters_applied": {
      "trade": "All",
      "jurisdiction": "All",
      "document_type": "All",
      "top_k": 5
    },
    "retrieval_mode": "Hybrid (Dense + BM25 Sparse RRF)"
  }
}
```

---

## 3. Conversational Multi-Turn Follow-Up Request (`200 OK`)

### Request Payload

```json
{
  "question": "What are its main prohibitions under NEC 300.22?",
  "trade": "Electrical",
  "conversation_history": [
    {
      "role": "user",
      "content": "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?"
    },
    {
      "role": "assistant",
      "content": "Non-Compliant [1]: Installation of 1-inch Schedule 40 PVC conduit in ceiling return air plenums violates NEC Article 300.22(C)."
    }
  ]
}
```

### Response Body (`status: "success"`)

```json
{
  "status": "success",
  "answer": "Non-Compliant [1]: Installation of PVC conduit in ceiling return air plenums violates NEC Article 300.22(C) [1].\n\nField Observation Evaluation...",
  "verdict": "Non-Compliant",
  "confidence_score": 0.98,
  "summary": "Non-Compliant [1]: Installation of PVC conduit in ceiling return air plenums violates NEC Article 300.22(C) [1].",
  "technical_analysis": "...",
  "sources": [...],
  "citations": [...],
  "recommended_actions": [...],
  "metadata": {
    "query": "What are its main prohibitions under NEC 300.22?",
    "rewritten_query": "What are PVC conduit for low-voltage controls in the drop-ceiling return air plenum's main prohibitions under NEC 300.22?",
    "was_rewritten": true,
    "elapsed_time_ms": 42.10,
    "chunks_retrieved": 5
  }
}
```

---

## 4. Input Validation Error Response (`400 Bad Request`)

Triggered when `question` is missing, empty, or whitespace-only.

### Request Payload

```json
{
  "question": "   "
}
```

### Response Body (`400 Bad Request`)

```json
{
  "detail": "Invalid request: 'question' must be a non-empty string."
}
```

---

## 5. Server Error Response (`500 Internal Server Error`)

Triggered on unhandled system failures. Does not leak stack traces or environment secrets.

### Response Body (`500 Internal Server Error`)

```json
{
  "detail": "An internal server error occurred while processing the query."
}
```
