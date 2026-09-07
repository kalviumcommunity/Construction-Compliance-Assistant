# SiteSafe Embedding & Vector Storage Pipeline Report

## Executive Summary
This report documents the implementation, validation, and storage structure of the OpenAI-compatible embedding pipeline (`corpus_embedder.py`) for the **SiteSafe** Construction Regulatory Compliance RAG system.

---

## 1. Environment Variable Configuration & Instructions

The pipeline uses environment-driven configuration supporting official OpenAI models, local vLLM/Ollama endpoints, or self-hosted proxy layers.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `EMBEDDING_API_KEY` | String | *Required for live API* | OpenAI or custom API key. If missing, a deterministic offline engine generates normalized mock vectors for offline testing. |
| `EMBEDDING_MODEL_NAME` | String | `text-embedding-3-small` | Target embedding model name. |
| `EMBEDDING_API_BASE_URL` | String | `None` (Official OpenAI) | Optional custom endpoint URL (e.g., `http://localhost:8000/v1`). |
| `EMBEDDING_DIMENSION` | Integer | `1536` | Expected vector dimension length for validation checks. |

### Running the Script

```bash
# Set environment variables (Linux/macOS)
export EMBEDDING_API_KEY="sk-..."
export EMBEDDING_MODEL_NAME="text-embedding-3-small"
export EMBEDDING_DIMENSION=1536

# Execute pipeline
python backend/corpus_embedder.py
```

---

## 2. Sample Console Execution Log

```text
================================================================================
SITESAFE CORPUS EMBEDDER & UNIFIED VECTOR STORAGE VERIFICATION
================================================================================
Model Name:       text-embedding-3-small
Expected Dim:     1536
API Base URL:     Official OpenAI API
API Key Status:   MISSING (Using Offline Engine)
--------------------------------------------------------------------------------

Generating batch embeddings...
[INFO] EMBEDDING_API_KEY missing. Using deterministic offline vector simulation engine...

================================================================================
EMBEDDING VERIFICATION TABLE
================================================================================
RECORD ID       | SOURCE DOC                   | SECTION            | PAGE  | DIM   | VECTOR PREVIEW
--------------------------------------------------------------------------------
doc_chunk_001   | IBC_2021_Fire_Safety.pdf     | Section 705.8      | 142   | 1536  | [0.0462, 0.0249, -0.0192, -0.0457 ... 0.0078, 0.0169, 0.0105, -0.0055]
doc_chunk_002   | Tower_B_Concrete_Specs.pdf   | Section 26.5.3     | 88    | 1536  | [0.0512, 0.0277, -0.0213, -0.0507 ... -0.0226, -0.0492, -0.0306, 0.0161]
doc_chunk_003   | OSHA_Construction_Electrical.pdf | 1926.404(b)(1)(ii) | 315   | 1536  | [0.0400, 0.0216, -0.0166, -0.0396 ... 0.0130, 0.0283, 0.0176, -0.0093]
--------------------------------------------------------------------------------
[SUCCESS] Persisted 3 records to 'embedded_corpus.json' (File size: 81818 bytes).
```

---

## 3. Verbatim JSON Record Structure (`embedded_corpus.json`)

Below is the verbatim JSON schema representation for `doc_chunk_001` with trimmed vector coordinates:

```json
{
  "id": "doc_chunk_001",
  "vector": [
    0.046227,
    0.024911,
    -0.019183,
    -0.04566,
    "...",
    0.007823,
    0.016892,
    0.010461,
    -0.00548
  ],
  "text": "IBC Section 705.8: Exterior wall openings shall comply with Table 705.8 based on fire separation distance. Projections extending beyond the exterior wall shall not extend beyond a point 1/3 the distance to the lot line.",
  "metadata": {
    "source_doc": "IBC_2021_Fire_Safety.pdf",
    "doc_type": "building_code",
    "section": "Section 705.8",
    "page": 142,
    "trade": "Fire Safety",
    "jurisdiction": "National"
  }
}
```

---

## 4. Git Commit Message

```text
feat(embedding): implement OpenAI-compatible corpus embedder & unified vector storage

- Add backend/corpus_embedder.py with pydantic data modeling for EmbeddedRecord and RecordMetadata.
- Configure environment loading for EMBEDDING_API_KEY, EMBEDDING_MODEL_NAME, EMBEDDING_API_BASE_URL, and EMBEDDING_DIMENSION.
- Implement OpenAI client batching with deterministic offline simulation fallback when API key is unconfigured.
- Implement vector dimension and output count validations.
- Serialize embedded records to embedded_corpus.json ready for Qdrant/Chroma ingestion.
- Create EMBEDDING_STORAGE_REPORT.md documenting configuration, execution logs, and sample payload.
```
