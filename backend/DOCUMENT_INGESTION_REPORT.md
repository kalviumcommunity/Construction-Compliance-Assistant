# SiteSafe Multi-Format Document Ingestion Engine Report

## Systems Architecture Overview

In regulatory compliance RAG applications ("SiteSafe"), source documents originate from diverse formats: statutory building codes (PDFs), project specifications (Markdown/TXT), and municipal zoning bylaws (HTML exports). Before chunking or vector embedding, documents must be parsed into a unified, machine-readable data model while retaining strict **source identity tracking** for legal citations.

This report details the architectural design, format parsers, defensive error handling matrix, and intake confirmation results implemented in [`backend/document_loader.py`](file:///f:/desk/RAG/backend/document_loader.py).

---

## 1. Unified Data Model & Source Identity (Task 1 & Task 3)

```python
@dataclass
class LoadedDocument:
    doc_id: str             # Unique SHA-256 hash derived from relative path & file size
    content: str            # Normalized plain text / markdown content
    source: str             # Relative file path (e.g., "sample_corpus/ibc_2021_sec705.pdf")
    file_type: str          # File format ("pdf", "html", "md", "txt")
    metadata: Dict[str, Any]# Extracted metadata (page count, byte size, title, filename)
```

### Format Parsers:
1. **PDF Loader (`pypdf`)**: Extracts text page-by-page, strips empty streams, and logs total page count metadata.
2. **HTML Loader (`BeautifulSoup`)**: Decomposes `<script>`, `<style>`, `<nav>`, `<header>`, and `<head>` tags to extract clean semantic body text without raw HTML markup.
3. **Markdown / Text Loader**: Built-in file I/O enforcing UTF-8 encoding normalization with fallback to `latin-1`.

---

## 2. Error Handling & Graceful Degradation Matrix (Task 2)

The loader module is engineered to process dirty real-world file directories without crashing the batch pipeline:

| Error / Failure Condition | Catch Mechanism | Operational Action | Log Message |
| :--- | :--- | :--- | :--- |
| **Corrupt / Zero-Byte PDF** | `pypdf.errors.PdfReadError` / `ValueError` | Skip file, continue batch | `[SKIPPED - PARSE FAILURE]: sample_corpus/corrupt_spec.pdf - Unable to extract page stream` |
| **Unsupported File Format** | File extension check against `SUPPORTED_EXTENSIONS` | Skip file, continue batch | `[SKIPPED - UNSUPPORTED FORMAT]: sample_corpus/unsupported_cad.dwg - Extension '.dwg' not in supported list` |
| **Encoding Error** | Catch `UnicodeDecodeError` | Fallback to `latin-1` with `replace` errors | Processed successfully without data loss |
| **Missing / Unreadable File** | `FileNotFoundError` / `PermissionError` | Catch exception, log warning | `[SKIPPED - PARSE FAILURE]: path/to/file - File not found` |

---

## 3. Console Execution Log & Intake Confirmation (Task 4 & Task 5)

Executing `python backend/document_loader.py` against `sample_corpus/` yields the following verified terminal output:

```text
Initializing Document Loader for directory: sample_corpus
2026-09-07 11:06:41 [WARNING] [SKIPPED - PARSE FAILURE]: sample_corpus/corrupt_spec.pdf - Unable to extract page stream: Stream has ended unexpectedly
2026-09-07 11:06:41 [INFO] [SUCCESSFUL INTAKE]: sample_corpus/ibc_2021_sec705.pdf (PDF, 32 words)
2026-09-07 11:06:41 [INFO] [SUCCESSFUL INTAKE]: sample_corpus/project_spec_concrete.md (MD, 59 words)
2026-09-07 11:06:41 [WARNING] [SKIPPED - UNSUPPORTED FORMAT]: sample_corpus/unsupported_cad.dwg - Extension '.dwg' not in supported list
2026-09-07 11:06:41 [INFO] [SUCCESSFUL INTAKE]: sample_corpus/zoning_bylaws.html (HTML, 49 words)

=========================================================================================================
SITESAFE DOCUMENT INTAKE CONFIRMATION & INSPECTION REPORT
=========================================================================================================
Document Source Path                | Format   | Chars   | Words   | Text Snippet Preview (First 100 Chars)  
-------------------------------------------------------------------------------------------------------------------
sample_corpus/ibc_2021_sec705.pdf   | PDF      | 187     | 32      | IBC 2021 Section 705.8: Exterior walls o
sample_corpus/project_spec_concrete | MD       | 367     | 59      | # SECTION 03 30 00 - CAST-IN-PLACE CONCR
sample_corpus/zoning_bylaws.html    | HTML     | 292     | 49      | Municipal Zoning Setback & Height Restri
=========================================================================================================
Total Successfully Ingested Documents: 3
=========================================================================================================
```

---

## 4. Standardized Git Commit Message (Task 5)

```text
feat(ingestion): implement multi-format document loader and error handling engine

- Add `backend/document_loader.py` with `LoadedDocument` data model and PDF, HTML, MD, TXT parsers
- Implement `load_directory` with defensive exception handling for corrupt files and unsupported formats
- Retain exact relative source paths for downstream RAG citation tracking
- Add `setup_sample_corpus.py` generating 5 test fixtures under `sample_corpus/`
- Document architecture and intake logs in `DOCUMENT_INGESTION_REPORT.md`
```
