# 🏗️ SiteSafe: Construction Regulatory Compliance Assistant
### Production-Grade Hybrid RAG Engine for Building Codes, Project Specifications, and Inspection Verification

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Qdrant](https://img.shields.io/badge/Qdrant-Hybrid_Vector_Store-dc2626.svg?logo=qdrant&logoColor=white)](https://qdrant.tech)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab.svg?logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg?logo=typescript&logoColor=white)](https://typescriptlang.org)

> **SiteSafe** transforms dense, fragmented construction regulatory libraries into an authoritative, grounded decision engine. Site engineers, QA/QC inspectors, and superintendents ask natural-language questions regarding on-site field conditions and receive instant, source-cited compliance determinations (**Compliant**, **Non-Compliant**, or **Ambiguous/Insufficient Data**) backed by exact verbatim quotes from governing codes, specifications, and inspection logs.

---

## 📌 Systems Architecture

SiteSafe utilizes a **Hybrid Dense + Sparse BM25 Retrieval-Augmented Generation (RAG)** architecture with strict zero-hallucination guardrails:

```
                                  [ On-Site Field Condition / Query ]
                                                   |
                                                   v
                         +---------------------------------------------------+
                         |         Metadata Pre-Filtering Engine            |
                         |  (Trade: Electrical | Structural | Fire | Plumb)  |
                         |  (Jurisdiction: National | California | NYC)      |
                         |  (Document Scope: Code | Project Spec | Inspect)  |
                         +---------------------------------------------------+
                                                   |
                         +-------------------------+-------------------------+
                         |                                                   |
                         v                                                   v
            [ Dense Semantic Embedder ]                         [ Sparse BM25 Lexical Embedder ]
           OpenAI text-embedding-3-small                              FastEmbed Qdrant/bm25
               / FastEmbed BGE-small                                (Exact Clause/Section Matching)
                         |                                                   |
                         +-------------------------+-------------------------+
                                                   |
                                                   v
                                 +-----------------------------------+
                                 |       Qdrant Vector Database      |
                                 |  Dual Vectors (Dense + BM25)      |
                                 |  Payload Inverted Indexes         |
                                 +-----------------------------------+
                                                   |
                                                   v
                                 +-----------------------------------+
                                 |   Reciprocal Rank Fusion (RRF)    |
                                 |   Fused Top-K Candidate Chunks    |
                                 +-----------------------------------+
                                                   |
                                                   v
                                 +-----------------------------------+
                                 | Grounded Compliance Reasoner      |
                                 | (GPT-4o-mini / Expert Rule Engine)|
                                 | - Strict Context Grounding        |
                                 | - Verbatim Direct Quotes          |
                                 | - Deterministic Safe Refusal      |
                                 +-----------------------------------+
                                                   |
                                                   v
                                  [ Structured Compliance Response ]
                                  - Verdict (Compliant / Non-Compliant)
                                  - Technical Regulatory Analysis
                                  - Direct Quote Citations
                                  - Recommended Field Actions
```

---

## 🚀 Key Engineering Capabilities

1. **Defensive Ingestion & Multi-Format Support**:
   - Heterogeneous document parser supporting **PDF** (`pypdf`), **HTML** (`BeautifulSoup4`), **Markdown**, and **Plain Text**.
   - Strict integrity validation: zero-byte and corrupted files are caught and logged without aborting batch ingestion.
2. **Text Cleaning & Legal Preservation**:
   - Strips running headers, footers, pagination artifacts, and confidentiality disclaimers.
   - Heals line-wrap broken hyphenations (`fire-re-\nsistance` -> `fire-resistance`).
   - Normalizes Unicode NFKC and typographic quotes while strictly preserving legal indentations and numbered clauses.
3. **Table-Preserving Token Chunker**:
   - Token-aware sliding window chunker (`tiktoken` `o200k_base` with fallback to `cl100k_base`).
   - **Atomic Table Preservation**: Detects Markdown and ASCII tables (e.g. setback distance tables, fire rating schedules) and keeps them intact, preventing splits across rows or columns.
   - Overlap preserves boundary-straddling conditional clauses (*Prohibitions linked to "EXCEPT WHERE" exceptions*).
4. **Hybrid Retrieval with Reciprocal Rank Fusion (RRF)**:
   - Dense embeddings capture conceptual meaning; sparse BM25 embeddings guarantee precision on exact clause numbers (e.g., `IBC 705.8`, `NEC 300.22`, `UPC 312.2`).
   - Metadata pre-filtering prevents cross-project or wrong-jurisdiction contamination.
5. **Zero Hallucination & Deterministic Safe Refusal**:
   - Enforces context-grounded reasoning. Every finding requires verbatim direct quotes.
   - **Safe Response Handling**: When retrieved context is missing, ambiguous, or out-of-scope, the model deterministically responds with `Ambiguous/Insufficient Data` ("I don't know"), explains missing parameters, and issues Request for Information (RFI) recommendations.
6. **API Security & Rate Limiting**:
   - Ingestion and reindexing endpoints (`POST /api/ingest/upload`, `POST /api/reindex`) are protected by `X-API-Key` authentication and sliding-window rate limiting.
7. **Resilient Next.js Frontend**:
   - Real-time compliance assistant with 45-second timeout protection and graceful error handling.
   - Document Knowledge Base explorer with dynamic file upload modal.
   - RAG Search Explorer inspecting raw chunk retrieval, RRF scores, and metadata.
   - Automated Evaluation Dashboard running live benchmarks across disciplinary test matrices.

---

## 📁 Repository Layout

```
RAG/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py              # Pydantic settings, environment configs, thresholds
│   │   ├── main.py                # FastAPI application, lifespan, CORS configuration
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py          # REST endpoints (/health, /documents, /verify-compliance, /ingest/upload, /stats)
│   │   │   └── security.py        # X-API-Key verification & upload rate limiter
│   │   ├── data/
│   │   │   ├── __init__.py
│   │   │   └── regulatory_corpus.py # Authoritative construction codes, specs, and reports
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py         # Pydantic v2 schemas for requests, responses, and citations
│   │   └── rag/
│   │       ├── __init__.py
│   │       ├── document_loader.py # Multi-format loader with corruption handling
│   │       ├── text_cleaner.py    # Boilerplate stripping, unicode NFKC, hyphen healing
│   │       ├── chunker.py         # Token-aware sliding chunker with table preservation
│   │       ├── metadata_tagger.py # Regex legal clause extraction & uniform metadata tagging
│   │       ├── embeddings.py      # Dense (OpenAI / FastEmbed) & BM25 sparse embedders
│   │       ├── vector_store.py    # Qdrant client, hybrid collection, payload indexes
│   │       ├── retriever.py       # Hybrid RRF search & metadata pre-filtering
│   │       ├── generator.py       # Grounded compliance generation & safe refusal
│   │       └── pipeline.py        # Master coordinator orchestrating ingestion & retrieval
│   ├── corpus/                    # File-based construction document storage (PDF, HTML, MD, TXT)
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_rag_pipeline.py   # 14 automated unit & integration tests
│   ├── main.py                    # Top-level server entry point
│   ├── test_api.py                # Standalone API verification script
│   ├── requirements.txt           # Production Python dependencies
│   └── .env.example               # Environment variable template
│
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js 14 App Router pages
│   │   ├── components/
│   │   │   ├── assistant/         # Compliance assistant UI, QueryForm, ResultsView, Toolbar
│   │   │   ├── pages/             # DashboardPage, DocumentsPage, SearchPage, EvaluationPage
│   │   │   └── layout/            # Sidebar, Topbar navigation
│   │   ├── lib/
│   │   │   └── api.ts             # Production API client with timeout protection & types
│   │   └── types/                 # Shared TypeScript interfaces
│   ├── package.json
│   └── tailwind.config.js
│
├── docs/
│   └── reports/                   # Archived historical milestone reports & evaluation logs
├── README.md                      # Production system documentation
└── WORKFLOW.md                    # Git collaboration & team branching guidelines
```

---

## 🛠️ Quickstart Guide

### Prerequisites
- Python 3.10+ (Python 3.11 recommended)
- Node.js 18+ & npm
- (Optional) OpenAI API Key for GPT-4o-mini generation. *SiteSafe includes a high-fidelity local deterministic rule engine and FastEmbed ONNX models for 100% offline operation without API keys.*

---

### 1. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create and activate virtual environment (Windows PowerShell)
python -m venv venv
.\venv\Scripts\activate

# Install production dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Launch the FastAPI backend server
uvicorn main:app --port 8000 --reload
```

The backend server will start at `http://127.0.0.1:8000`.
Interactive OpenAPI docs are available at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup

```powershell
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```

The frontend application will start at `http://localhost:3000`.

---

### 3. Automated Test Suite

Run the comprehensive 14-test verification suite covering document parsing, table-preserving chunking, multi-trade evaluations, safe refusal, and API security:

```powershell
cd backend
.\venv\Scripts\python.exe tests/test_rag_pipeline.py
```

Expected output:
```text
================================================================================
SITESAFE RAG PIPELINE & API AUTOMATED TEST SUITE
================================================================================
 [PASS] Document Loading & Corruption Checks
 [PASS] Text Normalization & Hyphen Healing
 [PASS] Table-Preserving Chunking (Never Splits Tables)
 [PASS] Metadata Tagging & Clause Extraction
 [PASS] Health & Status Endpoint
 [PASS] Knowledge Base Documents Endpoint
 [PASS] Electrical Trade (NEC 300.22 PVC in Plenum)
 [PASS] Structural Trade (Spec 03 30 00 Concrete PSI)
 [PASS] Fire Safety Trade (IBC 714.4 Firestop Sealant)
 [PASS] Plumbing Trade (UPC 312.2 Hydrostatic Test)
 [PASS] Strict Safe Refusal ('I Don't Know / Insufficient Data')
 [PASS] API Security: 401 on Unauthorized Upload
 [PASS] API Security: 200 on Authorized Upload
 [PASS] Corpus Statistics Endpoint
================================================================================
ALL 14/14 TESTS PASSED SUCCESSFULLY!
================================================================================
```

---

## 🔍 Verification Examples across Trades

### Example 1: Electrical Discipline (Violation Detected)
- **Field Query**: *"Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?"*
- **Verdict**: `Non-Compliant`
- **Governing Citation**: `NEC Article 300.22(C)` (NFPA 70: National Electrical Code)
- **Direct Quote**: *"Rigid nonmetallic conduit (Schedule 40/80 PVC), Electrical Nonmetallic Tubing (ENT), and general nonmetallic raceways are strictly PROHIBITED from being installed in environmental air spaces or plenums."*
- **Action**: Issue Non-Conformance Notice (NCR); replace with Electrical Metallic Tubing (EMT) and steel compression fittings.

### Example 2: Structural Discipline (Approved Condition)
- **Field Query**: *"Cylinder break tests achieved 4,850 psi at 28 days for elevated post-tensioned deck slab. Is this compliant?"*
- **Verdict**: `Compliant`
- **Governing Citation**: `Project Spec Div 03 30 00 §2.03.A` (Cast-in-Place Structural Concrete)
- **Direct Quote**: *"Elevated Post-Tensioned Slabs & Shear Walls: Minimum 28-day compressive strength (f'c) shall be 4,500 psi (31.0 MPa)."*
- **Action**: Submit official test cylinder certificates to Structural Engineer of Record (EOR) and authorize tendon stressing operations.

### Example 3: Out-of-Scope / Safe Refusal (Refusal to Hallucinate)
- **Field Query**: *"What is the allowable paint hue for the janitor closet door hinges under city guidelines?"*
- **Verdict**: `Ambiguous/Insufficient Data`
- **Technical Analysis**: *"A hybrid search returned zero governing statutory code or specification references for this observation. Per strict zero-hallucination compliance rules, the system strictly refuses to speculate or issue an ungrounded determination."*
- **Action**: Submit formal Request for Information (RFI) to project architect.

---

## 🛡️ API Endpoints Reference

| Method | Path | Description | Security |
|--------|------|-------------|----------|
| `GET` | `/api/health` | Service status, vector store health, trade taxonomy | Public |
| `GET` | `/api/documents` | List of indexed codes, specifications, and reports | Public |
| `POST` | `/api/verify-compliance` | Evaluates field observations against regulatory chunks | Public |
| `POST` | `/api/ingest/upload` | Securely upload and index PDF/MD/HTML/TXT documents | `X-API-Key` + Rate Limiter |
| `POST` | `/api/reindex` | Force re-index of full knowledge base | `X-API-Key` |
| `GET` | `/api/stats` | Corpus analytics, chunk counts, trade breakdown | Public |

---

## 👥 Authors & License

Developed as a production-grade regulatory RAG system for the Kalvium Software Product Engineering Program.
Licensed under internal organizational use.
