# SiteSafe Document Upload & Indexing API Documentation (`POST /api/upload`)

The `POST /api/upload` endpoint provides runtime document upload, text extraction, cleaning, chunking, embedding generation, and vector database indexing. Content uploaded via this endpoint becomes **immediately searchable** by the RAG query engine (`POST /api/query`) without restarting the server.

---

## Endpoint Specification

- **URL**: `/api/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Supported File Formats**: `.pdf`, `.html`, `.htm`, `.md`, `.txt`
- **Maximum File Size**: `10 MB`

---

## 1. Successful Upload & Indexing Request (`200 OK`)

### Request Example (`curl`)

```bash
curl -X POST "http://127.0.0.1:8000/api/upload" \
  -F "file=@/path/to/Jobsite_Inspection_Audit_IR_2026_098.txt"
```

### Response Body

```json
{
  "status": "success",
  "message": "Document 'Jobsite_Inspection_Audit_IR_2026_098.txt' successfully uploaded, processed, and indexed.",
  "filename": "Jobsite_Inspection_Audit_IR_2026_098.txt",
  "documents_ingested": 1,
  "chunks_indexed": 3,
  "errors": []
}
```

---

## 2. Immediate Searchability Verification (`POST /api/query`)

Submitting a follow-up query to `/api/query` immediately after uploading the document demonstrates that the new document content is searchable and cited.

### Request Payload (`POST /api/query`)

```json
{
  "question": "What issues were found during Inspection Audit IR-2026-098 regarding electrical plenum cables?",
  "trade": "Electrical"
}
```

### Grounded Response Body (`200 OK`)

```json
{
  "status": "success",
  "answer": "Non-Compliant [1]: Inspection Audit IR-2026-098 identified nonmetallic Schedule 40 PVC conduit improperly installed in the return air plenum of Tower B Level 4...",
  "verdict": "Non-Compliant",
  "confidence_score": 0.98,
  "summary": "Non-Compliant [1]: Inspection Audit IR-2026-098 identified nonmetallic Schedule 40 PVC conduit improperly installed in the return air plenum of Tower B Level 4.",
  "technical_analysis": "...",
  "sources": [
    {
      "document": "Jobsite Inspection Audit Ir 2026 098 Electrical Plenum Cables",
      "document_filename": "Jobsite_Inspection_Audit_IR_2026_098_Electrical_Plenum_Cables.txt",
      "chunk_id": "doc_ir_2026_098_c0",
      "chunk_index": 0,
      "clause_number": "Inspection Audit IR-2026-098",
      "page": "Page 1",
      "trade": "Electrical",
      "direct_quote": "Inspection Audit IR-2026-098: Subcontractor routed Schedule 40 PVC conduit for low-voltage sensor cables inside return air plenum above ceiling grid."
    }
  ],
  "citations": [
    {
      "citation_index": 1,
      "clause_number": "Inspection Audit IR-2026-098",
      "document_title": "Jobsite Inspection Audit Ir 2026 098 Electrical Plenum Cables",
      "document_type": "Inspection Log",
      "jurisdiction": "National",
      "trade": "Electrical",
      "page_or_section": "Page 1",
      "direct_quote": "Inspection Audit IR-2026-098: Subcontractor routed Schedule 40 PVC conduit for low-voltage sensor cables inside return air plenum above ceiling grid.",
      "relevance_explanation": "Identifies plenum raceway non-compliance reported in Inspection Audit IR-2026-098.",
      "document_filename": "Jobsite_Inspection_Audit_IR_2026_098_Electrical_Plenum_Cables.txt",
      "chunk_id": "doc_ir_2026_098_c0",
      "chunk_index": 0
    }
  ],
  "recommended_actions": [
    "Issue immediate Non-Conformance Report (NCR) for IR-2026-098.",
    "Replace nonmetallic PVC conduit with steel EMT."
  ],
  "metadata": {
    "query": "What issues were found during Inspection Audit IR-2026-098 regarding electrical plenum cables?",
    "elapsed_time_ms": 28.15,
    "chunks_retrieved": 5
  }
}
```

---

## 3. Upload Validation & Error Responses

### A. Missing File (`400 Bad Request`)

Triggered when no file is included in the multipart request.

```json
{
  "detail": "Missing file in upload request."
}
```

### B. Empty 0-Byte File (`400 Bad Request`)

Triggered when the uploaded file contains zero bytes.

```json
{
  "detail": "Empty file uploaded. Please provide a valid non-empty document."
}
```

### C. Path Traversal Attempt (`400 Bad Request`)

Triggered when the filename contains path traversal sequences (`../` or `\`).

```json
{
  "detail": "Invalid filename: Path traversal attempt rejected."
}
```

### D. Unsupported File Format (`415 Unsupported Media Type`)

Triggered when uploading unsupported extensions such as `.exe`, `.jpg`, `.zip`.

```json
{
  "detail": "Unsupported file format '.exe'. Supported formats are: .html, .htm, .md, .pdf, .txt"
}
```

### E. File Too Large (`413 Payload Too Large`)

Triggered when file size exceeds 10 MB limit (`MAX_UPLOAD_SIZE`).

```json
{
  "detail": "File exceeds maximum allowed size of 10MB."
}
```

### F. Internal Processing Failure (`500 Internal Server Error`)

Triggered when text extraction or vector DB indexing fails. Does not leak stack traces or API keys.

```json
{
  "detail": "Document parsing or vector indexing failed."
}
```
