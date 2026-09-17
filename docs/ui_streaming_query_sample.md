# SiteSafe RAG Compliance Assistant — Progressive Streaming & Citation Inspection

This document demonstrates the progressive Server-Sent Events (SSE) streaming response feature and interactive citation inspection metadata in SiteSafe.

---

## 1. Streaming API Protocol (`POST /api/query/stream`)

- **Endpoint**: `POST /api/query/stream` (or `POST /api/query` with `"stream": true`)
- **Headers**:
  ```http
  Content-Type: application/json
  Accept: text/event-stream
  ```
- **Payload**:
  ```json
  {
    "question": "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?",
    "trade": "Electrical",
    "jurisdiction": "National",
    "document_type": "Code",
    "top_k": 5,
    "stream": true
  }
  ```

---

## 2. Server-Sent Events (SSE) Stream Stream Flow

### Step A: Initial Metadata Event (`event: metadata`)
Delivers initial structured determination metadata, governing citations, and retrieved source chunks immediately after hybrid retrieval completes:

```http
event: metadata
data: {"status": "success", "verdict": "Non-Compliant", "confidence_score": 0.98, "summary": "Non-Compliant [1]: Installation of 1-inch Schedule 40 PVC conduit in ceiling return air plenums violates NEC Article 300.22(C) [1].", "technical_analysis": "Under NEC Article 300.22(C)...", "sources": [{"document": "National Electrical Code (NEC 2023)", "document_filename": "nec_2023_article_300_22.txt", "chunk_id": "nec-300-22-c1", "chunk_index": 0, "clause_number": "NEC Article 300.22(C)", "page": "Section 300.22", "trade": "Electrical", "direct_quote": "Rigid nonmetallic conduit (Schedule 40/80 PVC)... strictly PROHIBITED..."}], "citations": [{"citation_index": 1, "clause_number": "NEC Article 300.22(C)", "document_title": "National Electrical Code (NEC 2023)", "document_type": "Code", "jurisdiction": "National", "trade": "Electrical", "page_or_section": "Section 300.22", "direct_quote": "Rigid nonmetallic conduit...", "relevance_explanation": "Prohibits nonmetallic raceways in air plenums.", "document_filename": "nec_2023_article_300_22.txt", "chunk_id": "nec-300-22-c1", "chunk_index": 0}], "recommended_actions": ["Issue Non-Conformance Report (NCR)", "Replace PVC with EMT conduit"], "metadata": {"elapsed_time_ms": 310.2, "chunks_retrieved": 2, "retrieval_mode": "Hybrid (Dense + BM25 Sparse RRF)"}}
```

### Step B: Progressive Token Stream (`event: token`)
Delivers incremental text tokens sequentially to render the grounded answer progressively:

```http
event: token
data: {"token": "Non-Compliant ", "index": 0}

event: token
data: {"token": "[1]: ", "index": 1}

event: token
data: {"token": "Installation ", "index": 2}

event: token
data: {"token": "of ", "index": 3}

event: token
data: {"token": "1-inch ", "index": 4}

event: token
data: {"token": "Schedule ", "index": 5}

event: token
data: {"token": "40 ", "index": 6}

event: token
data: {"token": "PVC ", "index": 7}

...
```

### Step C: Completion Event (`event: done`)
Signals stream completion:

```http
event: done
data: {"status": "completed"}
```

---

## 3. UI Component Progressive Rendering & Citation Inspection

1. **Progressive Token Display**:
   - The UI listens to incoming `event: token` events via Web Streams API (`ReadableStream`).
   - Tokens accumulate in real-time in `streamedAnswer` state.
   - An animated pulse cursor (`▋`) signals incoming tokens.

2. **Interactive Citation Markers (`[1]`, `[2]`)**:
   - Citation markers like `[1]` render as interactive buttons.
   - Clicking `[1]` navigates directly to the cited source chunk and opens the **Original Chunk Text Verification** panel.

3. **Source Inspection Panel**:
   - Displays complete metadata:
     - **Document Filename**: `nec_2023_article_300_22.txt`
     - **Citation Number**: `[1]`
     - **Chunk ID**: `nec-300-22-c1`
     - **Chunk Index**: `#0`
     - **Location / Page**: `Section 300.22`
     - **Verbatim Extracted Quote**: *"Rigid nonmetallic conduit (Schedule 40/80 PVC)... strictly PROHIBITED from being installed in environmental air spaces or plenums."*

---

## 4. Error & Stream Interruption Handling

1. **User Stream Cancellation**:
   - Triggering the cancel button invokes `abortController.abort()`.
   - The UI halts incoming token processing immediately and retains all tokens received up to cancellation.

2. **Network Dropout / Stream Error (`event: error`)**:
   - If stream connection is interrupted or malformed, the UI catches the exception and displays:
     > *"Stream interrupted while retrieving compliance rules. Retrying will resume retrieval."*
   - Prevents UI state corruption or duplicate text append.
