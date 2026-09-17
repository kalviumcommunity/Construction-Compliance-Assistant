# SiteSafe RAG Compliance Assistant — UI Integration & Sample Interactions

This document demonstrates the frontend UI integration with the existing backend `POST /api/query` RAG API. It illustrates the UI states, request/response flow, source inspection metadata, loading state, refusal guardrail state, and error handling.

---

## 1. Environment Configuration

The frontend connects to the backend RAG API using the `NEXT_PUBLIC_API_BASE_URL` (or `NEXT_PUBLIC_API_URL`) environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

---

## 2. RAG Query API Payload & Endpoint

- **Endpoint**: `POST /api/query`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "question": "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?",
    "trade": "Electrical",
    "jurisdiction": "National",
    "document_type": "Code",
    "top_k": 5
  }
  ```

---

## 3. Sample Interaction 1: Successful Grounded Answer (`200 OK`, `status: "success"`)

### Backend JSON Response
```json
{
  "status": "success",
  "answer": "Non-Compliant [1]: Installation of 1-inch Schedule 40 PVC conduit in ceiling return air plenums violates NEC Article 300.22(C) [1].\n\nUnder NEC Article 300.22(C) (National Electrical Code 2023) and Project Specification 26 05 33 §2.01.B [1], spaces used for environmental air handling strictly prohibit nonmetallic combustible raceways (including Schedule 40/80 PVC). In the event of a fire, PVC decomposes to release hydrogen chloride gas and dense toxic smoke. All raceways routed within drop-ceiling return air plenums must be noncombustible metallic wiring methods (EMT, IMC, or RMC) with steel compression fittings.",
  "verdict": "Non-Compliant",
  "confidence_score": 0.98,
  "summary": "Non-Compliant [1]: Installation of 1-inch Schedule 40 PVC conduit in ceiling return air plenums violates NEC Article 300.22(C) [1].",
  "technical_analysis": "Under NEC Article 300.22(C) (National Electrical Code 2023) and Project Specification 26 05 33 §2.01.B [1], spaces used for environmental air handling strictly prohibit nonmetallic combustible raceways (including Schedule 40/80 PVC). In the event of a fire, PVC decomposes to release hydrogen chloride gas and dense toxic smoke. All raceways routed within drop-ceiling return air plenums must be noncombustible metallic wiring methods (EMT, IMC, or RMC) with steel compression fittings.",
  "sources": [
    {
      "document": "National Electrical Code (NEC 2023)",
      "document_filename": "nec_2023_article_300_22.txt",
      "chunk_id": "nec-300-22-c1",
      "chunk_index": 0,
      "clause_number": "NEC Article 300.22(C)",
      "page": "Section 300.22",
      "trade": "Electrical",
      "direct_quote": "Rigid nonmetallic conduit (Schedule 40/80 PVC), Electrical Nonmetallic Tubing (ENT), and general nonmetallic raceways are strictly PROHIBITED from being installed in environmental air spaces or plenums."
    },
    {
      "document": "Division 26 Electrical Project Specification",
      "document_filename": "spec_div_26_electrical.txt",
      "chunk_id": "spec-26-05-33-p2",
      "chunk_index": 1,
      "clause_number": "Project Spec 26 05 33 §2.01.B",
      "page": "Page 14",
      "trade": "Electrical",
      "direct_quote": "Plenum Wiring Methods: Only EMT, RMC, or IMC raceways with steel compression fittings are permitted in ceiling return air plenums."
    }
  ],
  "citations": [
    {
      "citation_index": 1,
      "clause_number": "NEC Article 300.22(C)",
      "document_title": "National Electrical Code (NEC 2023)",
      "document_type": "Code",
      "jurisdiction": "National",
      "trade": "Electrical",
      "page_or_section": "Section 300.22",
      "direct_quote": "Rigid nonmetallic conduit (Schedule 40/80 PVC), Electrical Nonmetallic Tubing (ENT), and general nonmetallic raceways are strictly PROHIBITED from being installed in environmental air spaces or plenums.",
      "relevance_explanation": "Prohibits nonmetallic raceways (Schedule 40 PVC) in environmental air plenums.",
      "document_filename": "nec_2023_article_300_22.txt",
      "chunk_id": "nec-300-22-c1",
      "chunk_index": 0
    }
  ],
  "recommended_actions": [
    "Immediately issue a Non-Conformance Report (NCR) for PVC conduit in the plenum.",
    "Replace non-compliant PVC runs with Electrical Metallic Tubing (EMT) using steel compression fittings.",
    "Inspect raceway routing prior to ceiling closure."
  ],
  "metadata": {
    "elapsed_time_ms": 340.5,
    "chunks_retrieved": 2,
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

### UI Component Rendered State
- **Question Banner**: "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?"
- **Verdict Badge**: `PROHIBITED • CODE VIOLATION` (Rose badge, 98% Confidence Match)
- **Grounded Answer Display**: Combines Plain-English Takeaway summary and Detailed Technical Analysis with interactive citation buttons (`[1]`).
- **Required Action Checklist**: Interactive checkboxes for field engineers.
- **Source Inspection Drawer/Tab**:
  - Displays referenced documents: `National Electrical Code (NEC 2023)` & `Division 26 Electrical Project Specification`.
  - Shows metadata fields:
    - **Document Filename**: `nec_2023_article_300_22.txt`
    - **Citation Badge**: `[1]`
    - **Chunk ID**: `nec-300-22-c1`
    - **Chunk Index**: `#0`
    - **Page / Section**: `Section 300.22`
    - **Direct Quote**: *"Rigid nonmetallic conduit (Schedule 40/80 PVC)... strictly PROHIBITED..."*

---

## 4. Sample Interaction 2: Safe Refusal / Insufficient Data (`status: "refusal"`)

### Question
"What is the allowable paint hue for closet door hinges under Division 09?"

### Backend Response
```json
{
  "status": "refusal",
  "answer": "I couldn't find enough supporting information in the retrieved sources to answer this question.\n\nHallucination Guardrail Triggered: No relevant statutory building code or specification rules were retrieved. The system strictly refuses to speculate.",
  "verdict": "Ambiguous/Insufficient Data",
  "confidence_score": 0.98,
  "summary": "I couldn't find enough supporting information in the retrieved sources to answer this question.",
  "technical_analysis": "Hallucination Guardrail Triggered: No relevant statutory building code or specification rules were retrieved. The system strictly refuses to speculate.",
  "sources": [],
  "citations": [],
  "recommended_actions": [
    "Broaden trade and jurisdiction filters to 'All'.",
    "Verify if project-specific submittals or architect directives govern this condition.",
    "Submit an official Request for Information (RFI) to the Engineer of Record."
  ],
  "metadata": {
    "elapsed_time_ms": 120.2,
    "chunks_retrieved": 0,
    "retrieval_mode": "Hybrid (Dense + BM25 Sparse RRF)"
  }
}
```

### UI Component Rendered State
- **Refusal Banner**: Amber alert badge `SAFE REFUSAL • INSUFFICIENT CONTEXT`.
- **User-Facing Refusal Message**: *"I couldn't find enough supporting information in the retrieved sources to answer this question."*
- **Guidance & Actions**: Provides recommended next steps (broaden filters, issue RFI).
- **Zero Hallucination Guarantee**: Prevents LLM fabrication when context is weak or out-of-scope.

---

## 5. Sample Interaction 3: Loading State

While awaiting the API response, the UI enforces:
1. **Input Locking**: Textarea and submit buttons are disabled (`disabled={loading}`).
2. **Button State**: Submit button text changes to *"Verifying..."* with an active loading spinner (`RefreshCw`).
3. **Step Indicator**: Animated progress indicator showing retrieval steps:
   - *Step 1*: Searching building code corpus and project specifications...
   - *Step 2*: Analyzing retrieved clauses and evaluating compliance...
   - *Step 3*: Synthesizing grounded verdict and extracting citations...

---

## 6. Sample Interaction 4: Error Handling

- **Invalid Empty Question (`400 Bad Request`)**: UI validates input locally before submission (`!query.trim()`) and disables the submission button.
- **Network Failure / Backend Down**: Displays a red error banner:
  > *"Compliance Verification Error: Cannot reach backend server at http://127.0.0.1:8000. Please verify that the FastAPI backend is running."*
  > Includes a **Retry Verification** button for immediate recovery.
