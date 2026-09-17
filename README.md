# 🏗️ SiteSafe: Construction Regulatory Compliance Assistant
### Production-Grade Hybrid RAG Engine for Building Codes, Project Specifications, and Inspection Verification

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Qdrant](https://img.shields.io/badge/Qdrant-Hybrid_Vector_Store-dc2626.svg?logo=qdrant&logoColor=white)](https://qdrant.tech)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab.svg?logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **SiteSafe** transforms dense, fragmented construction regulatory libraries into an authoritative, grounded decision engine. Site engineers, QA/QC inspectors, and superintendents ask natural-language questions regarding on-site field conditions and receive instant, source-cited compliance determinations (**Compliant**, **Non-Compliant**, or **Ambiguous/Insufficient Data**) backed by exact verbatim quotes from governing codes, specifications, and inspection logs.

---

## 📌 Table of Contents
- [Systems Architecture](#-systems-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Local Setup](#-installation--local-setup)
- [Environment Variables & Configuration](#-environment-variables--configuration)
- [Starting Services](#-starting-services)
- [API Endpoints & Usage Examples](#-api-endpoints--usage-examples)
- [Document Upload & Indexing Workflow](#-document-upload--indexing-workflow)
- [Query & Answer Generation Workflow](#-query--answer-generation-workflow)
- [Progressive Answer Streaming](#-progressive-answer-streaming)
- [Citations & Source Verification](#-citations--source-verification)
- [Conversational RAG](#-conversational-rag)
- [Zero-Hallucination Guardrails & Refusals](#-zero-hallucination-guardrails--refusals)
- [Query Caching & Performance](#-query-caching--performance)
- [Structured Logging & Cost Monitoring](#-structured-logging--cost-monitoring)
- [Evaluation Framework](#-evaluation-framework)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Troubleshooting](#-troubleshooting)
- [Deployment Instructions](#-deployment-instructions)

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
                                 | (Gemini 1.5/3.6 / GPT-4o-mini /   |
                                 |  Expert Offline Rule Engine)      |
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

## 🚀 Key Features

1. **Hybrid Dense + Sparse Retrieval (RRF)**:
   Combines dense semantic embeddings (`BAAI/bge-small-en-v1.5` or `text-embedding-3-small`) with sparse lexical BM25 embeddings (`Qdrant/bm25`) fused via Reciprocal Rank Fusion for pinpoint accuracy on clause numbers and technical terms.
2. **Runtime Document Upload & Indexing (`POST /api/upload`)**:
   Dynamic multipart upload for PDF, HTML, Markdown, and TXT specifications. Automatically validates, cleans, chunks, embeds, and indexes new documents into live vector storage without server restarts.
3. **Progressive Answer Streaming (SSE)**:
   Supports Server-Sent Events delivering token-by-token real-time streaming answers with pre-emitted metadata, citations, and source references.
4. **Deterministic Query Caching**:
   SHA-256 query caching with TTL expiration prevents redundant LLM calls for identical queries while preserving parameter sensitivity.
5. **Structured Audit Logging & Usage Monitoring (`GET /api/metrics`)**:
   Outputs machine-readable JSON logs for every query (`sitesafe.audit`) with token estimation, latency tracking, USD cost accounting, and aggregate metrics.
6. **Zero Hallucination & Safe Refusals**:
   Enforces strict relevance scoring thresholds (`RAG_RELEVANCE_THRESHOLD`). Out-of-scope or ungrounded queries deterministically trigger safe refusals (`Ambiguous/Insufficient Data`).
7. **Conversational Multi-Turn RAG**:
   Query rewriting resolves coreferences and contextual follow-ups against prior dialogue turns before executing vector retrieval.

---

## 🛠️ Tech Stack

- **Backend Framework**: Python 3.11+, FastAPI, Uvicorn, Pydantic v2
- **Frontend UI**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Vector Database**: Qdrant (Embedded or Remote hybrid dense + BM25 sparse)
- **Embeddings & LLM**: FastEmbed (ONNX offline), Google Gemini API, OpenAI API
- **Text Processing & Chunking**: `tiktoken`, `pypdf`, `beautifulsoup4`, NFKC text cleaner
- **Testing**: `pytest`, `httpx` / Starlette `TestClient`

---

## 📋 Prerequisites

- **Python**: 3.10+ (Python 3.11 or 3.12 recommended)
- **Node.js**: 18.0+ & npm 9+
- **Git**: Installed and configured
- *(Optional)* **Gemini or OpenAI API Key**: For cloud LLM inference. (SiteSafe includes an offline fallback rule engine for 100% local operation without API keys).

---

## ⚙️ Installation & Local Setup

### 1. Repository Setup
```bash
git clone https://github.com/kalviumcommunity/Construction-Compliance-Assistant.git
cd Construction-Compliance-Assistant
```

### 2. Backend Environment & Dependencies
```powershell
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\activate
# (On Linux/macOS: source .venv/bin/activate)

# Install production dependencies
pip install -r requirements.txt
```

### 3. Frontend Dependencies
```powershell
# Navigate to frontend directory
cd ../frontend

# Install Node modules
npm install
```

---

## 🔐 Environment Variables & Configuration

Copy `.env.example` to `.env` in the root (or `backend/.env`):

```bash
cp .env.example .env
```

### `.env.example` Reference:
```env
# Server Settings
HOST=127.0.0.1
PORT=8000
DEBUG=false
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Security
INGEST_API_KEY=sitesafe-admin-key-2026
RATE_LIMIT_UPLOAD_PER_MINUTE=15
RATE_LIMIT_VERIFY_PER_MINUTE=60

# Vector Database (Qdrant)
QDRANT_COLLECTION=construction_compliance
QDRANT_PATH=backend/qdrant_storage
QDRANT_URL=
QDRANT_API_KEY=

# LLM & Embedding Settings
EMBEDDING_PROVIDER=fastembed
FASTEMBED_DENSE_MODEL=BAAI/bge-small-en-v1.5
FASTEMBED_SPARSE_MODEL=Qdrant/bm25

GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL_NAME=gemini-3.6-flash
OPENAI_API_KEY=
OPENAI_MODEL_NAME=gpt-4o-mini

# Guardrails & Caching
RAG_RELEVANCE_THRESHOLD=0.01
RAG_CACHE_ENABLED=true
RAG_CACHE_TTL=3600
RAG_LOG_FORMAT=json
COST_PER_1K_INPUT_TOKENS=0.00015
COST_PER_1K_OUTPUT_TOKENS=0.00060

# Frontend Settings
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_INGEST_API_KEY=sitesafe-admin-key-2026
```

---

## 🚀 Starting Services

### 1. Start Backend API Server
```powershell
cd backend
.\.venv\Scripts\activate
python main.py
```
- API Server: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 2. Start Frontend Next.js UI
```powershell
cd frontend
npm run dev
```
- Web Interface: `http://localhost:3000`

---

## 📡 API Endpoints & Usage Examples

### 1. `POST /api/query` — Single-Turn or Streamed Compliance Query
**Request**:
```json
{
  "question": "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?",
  "trade": "Electrical",
  "jurisdiction": "National",
  "top_k": 5
}
```

**Response (`200 OK`)**:
```json
{
  "status": "success",
  "answer": "Rigid nonmetallic conduit (Schedule 40 PVC) is PROHIBITED in environmental air spaces/plenums per NEC 300.22(C).",
  "verdict": "Non-Compliant",
  "confidence_score": 0.98,
  "summary": "Non-compliant installation of PVC conduit in return air plenum.",
  "technical_analysis": "NEC 300.22(C) restricts materials in plenums to metallic raceways to prevent toxic smoke spread.",
  "sources": [
    {
      "document": "National Electrical Code (NFPA 70)",
      "document_filename": "nec_2020_code_excerpt.txt",
      "chunk_id": "nec_2020_code_excerpt_txt_chunk_3",
      "clause_number": "NEC 300.22(C)",
      "page": "Page 142",
      "trade": "Electrical",
      "direct_quote": "Rigid nonmetallic conduit (Schedule 40/80 PVC) shall NOT be installed in environmental air spaces..."
    }
  ],
  "citations": [
    {
      "citation_index": 1,
      "clause_number": "NEC 300.22(C)",
      "document_title": "National Electrical Code",
      "document_type": "Code",
      "jurisdiction": "National",
      "trade": "Electrical",
      "page_or_section": "Section 300.22(C)",
      "direct_quote": "Rigid nonmetallic conduit (Schedule 40/80 PVC) shall NOT be installed in environmental air spaces...",
      "relevance_explanation": "Directly prohibits nonmetallic PVC conduit in return air plenums."
    }
  ],
  "recommended_actions": [
    "Issue Non-Conformance Notice (NCR).",
    "Replace PVC with Electrical Metallic Tubing (EMT) and steel fittings."
  ],
  "metadata": {
    "cache_hit": false,
    "elapsed_time_ms": 142.5
  }
}
```

---

### 2. `POST /api/upload` — Runtime Document Upload & Indexing
**cURL Command**:
```bash
curl -X POST "http://127.0.0.1:8000/api/upload" \
  -H "X-API-Key: sitesafe-admin-key-2026" \
  -F "file=@spec_div_26_50_00_emergency_inverter.txt"
```

**Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Successfully processed and indexed document 'spec_div_26_50_00_emergency_inverter.txt'.",
  "document_id": "spec_div_26_50_00_emergency_inverter_txt",
  "filename": "spec_div_26_50_00_emergency_inverter.txt",
  "chunks_indexed": 4,
  "trade": "Electrical",
  "jurisdiction": "National"
}
```

---

### 3. `GET /api/metrics` — Usage Summary & Cost Tracking
**Response (`200 OK`)**:
```json
{
  "total_requests": 42,
  "successful_requests": 40,
  "failed_requests": 2,
  "cache_hits": 12,
  "cache_misses": 30,
  "cache_hit_rate": 0.2857,
  "total_input_tokens": 14500,
  "total_output_tokens": 8200,
  "total_tokens": 22700,
  "estimated_total_cost_usd": 0.007095,
  "average_latency_ms": 185.4
}
```

---

## 🧪 Testing & Quality Assurance

Run the complete 49-test verification suite covering document parsing, table preservation, multi-trade evaluations, security, streaming, query caching, and E2E verification:

```powershell
cd backend
.\.venv\Scripts\pytest.exe backend/tests/
```

### Expected Output:
```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\megha\Downloads\Implement Feature (1)\Construction-Compliance-Assistant
plugins: anyio-4.15.1, langsmith-0.12.6
collected 49 items

backend\tests\test_e2e_verification.py .                                 [  2%]
backend\tests\test_projects_api.py ..                                    [  6%]
backend\tests\test_rag_pipeline.py ..................................... [ 81%]
.........                                                                [100%]

======================= 49 passed, 2 warnings in 13.25s =======================
```

---

## 🔧 Troubleshooting

1. **`401 Unauthorized` on Upload**:
   Ensure your request headers include `X-API-Key` matching `INGEST_API_KEY` in `.env`.
2. **`415 Unsupported Media Type`**:
   Verify file extension is `.pdf`, `.html`, `.md`, or `.txt`.
3. **Qdrant Storage Lock Issue**:
   If running multiple workers, point `QDRANT_URL` to a standalone Qdrant container (`qdrant/qdrant:latest`) instead of local embedded path.

---

## 👥 License & Credits

Developed as a production-grade regulatory compliance assistant for the Kalvium Software Product Engineering Program.
Licensed under MIT.
