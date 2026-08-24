<<<<<<< HEAD
# SiteShield AI — On-Site Construction Compliance Verification Assistant

A full-stack, hybrid RAG prototype designed for on-site construction and field quality assurance engineers. It enables instant, strictly-grounded compliance cross-referencing against statutory Building Codes (IBC, NEC, UPC, California CBC Title 24, NYC Codes), Project Specifications (CSI MasterFormat Divisions 03, 21, 22, 26), and Historical Field Inspection Logs.

---

## 🏗️ Architectural Overview

```mermaid
graph TD
    User([Field Engineer / Tablet UI]) -->|1. Field Observation & Filters| Frontend[Next.js 14+ App Router]
    Frontend -->|2. POST /api/verify-compliance| FastAPI[FastAPI Backend Server]
    FastAPI -->|3. Extract Query & Scopes| FilterEngine[Metadata Filter Engine]
    FilterEngine -->|Trade: Electrical, Structural, etc.<br/>Jurisdiction: CA, NYC, National<br/>DocType: Code, Spec, Inspection| Qdrant[(Qdrant Hybrid Vector Store)]
    Qdrant -->|Dense Vector: text-embedding-3-small| DenseSearch[Dense Vector Search]
    Qdrant -->|Sparse Vector: FastEmbed BM25| SparseSearch[BM25 Lexical Search]
    DenseSearch -->|Ranked Dense Hits| Fusion[Reciprocal Rank Fusion - RRF]
    SparseSearch -->|Ranked Sparse Hits| Fusion
    Fusion -->|4. Top-K Grounded Chunks| Synthesizer[Grounded Compliance Reasoner]
    Synthesizer -->|5. Zero-Hallucination Strict Prompt| LLM[GPT-4o-mini Structured Output]
    LLM -->|Verdict, Confidence, Direct Quotes, Actions| FastAPI
    FastAPI -->|6. JSON Response| Frontend
    Frontend -->|7. Visual Verdict Badges & Citations| User
=======
# 🏗️ Construction Compliance Assistant
### Regulation & Inspection Support System

> A Retrieval-Augmented Generation (RAG) application that helps site engineers instantly identify applicable regulations, verify project specifications, and review inspection findings — with grounded answers and source citations.

---

## 📌 Project Information

| Field | Detail |
|-------|--------|
| **Version** | 1.0.0 |
| **Status** | In Development |
| **Created** | August 2026 |
| **Team** | Team 04 |
| **Sprint** | Sprint 2 |

---

## 🚨 Problem Statement

Construction firms maintain large volumes of technical and regulatory documentation — building codes, project specifications, and inspection reports. However, site engineers often cannot quickly confirm which regulation applies to a specific construction situation.

This forces engineers to manually search through multiple lengthy documents, increasing the risk of:

- Relying on incorrect or outdated regulatory information
- Missing applicable compliance requirements
- Costly compliance errors and failed inspections
- Project delays caused by slow verification workflows

**There is no centralized AI-powered assistant that connects these construction documents and allows engineers to ask natural-language questions about applicable regulations and receive grounded answers with source references.**

---

## 💡 Solution

The **Construction Compliance Assistant** transforms a static document corpus into an intelligent, searchable knowledge system using a RAG pipeline. Engineers can ask compliance questions in plain English and receive fast, grounded answers backed by source citations.

The platform answers three critical questions:

1. **Which regulation applies** to this construction situation?
2. **What do the building codes, project specifications, or inspection reports require?**
3. **What source supports the answer** — and when should the system say "I don't know"?

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | Python |
| **Document Processing** | Text extraction, cleaning, chunking |
| **Embeddings** | Embeddings API |
| **Vector Database** | Vector DB (similarity-based retrieval) |
| **AI / LLM** | Large Language Model for grounded answer generation |
| **Frontend** | Next.js / Streamlit |
| **Version Control** | Git & GitHub |
| **CI/CD** | GitHub Actions |
| **IDE** | Visual Studio Code |

---

## 🔁 RAG Pipeline

```
Building Codes
      +
Project Specifications  →  Document Processing  →  Chunking  →  Embeddings
      +
Inspection Reports
                                                                      ↓
                                                            Vector Database
                                                                      ↓
                                               User Query  →  Relevant Chunk Retrieval
                                                                      ↓
                                                          LLM + Retrieved Context
                                                                      ↓
                                                  Grounded Answer + Source Citation
                                               (or "I don't know" if unsupported)
>>>>>>> 0dfa0881a157243bf02aa48cb1d7118d9295b574
```

---

<<<<<<< HEAD
## ✨ Key Features

1. **Hybrid Retrieval (Dense + BM25 Sparse Vector)**: Combines semantic concept matching with exact technical code reference precision (e.g. `300.22(C)`, `4,500 psi`, `ASTM E814`) via Qdrant and FastEmbed BM25.
2. **Multi-Tenant Scoped Filtering**: Dynamic payload filtering by:
   - **Trade**: *Electrical, Fire Safety, Structural, Plumbing*
   - **Jurisdiction**: *National (Model Codes), California (CBC Title 24), NYC (NYC Codes)*
   - **Document Type**: *Statutory Building Code, Project Spec, Inspection Log / NCR*
3. **Strict Zero-Hallucination Grounding**:
   - Every compliance assertion is accompanied by exact clause citations and verbatim excerpts.
   - If the retrieved context lacks governing rules, it explicitly issues an `Ambiguous/Insufficient Data` verdict and specifies missing submittals.
4. **Interactive Industrial UI**:
   - High-contrast titanium/slate aesthetic built with Tailwind CSS and Lucide React.
   - Real-time Verdict Badges (**Compliant**, **Non-Compliant**, **Ambiguous**).
   - Expandable Citation Explorer with verbatim quote copying.
   - Raw Evidence Inspector for vector search transparency.
   - One-click field scenario presets.
   - One-click export of formatted markdown field reports for site logs.

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.10+** (Tested on Python 3.11)
- **Node.js 18+** & `npm`
- (Optional) **OpenAI API Key** (A built-in expert rule engine provides offline fallback if no API key is supplied)

---

### Step 1: Set Up Backend (`backend/`)

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your environment:
   ```bash
   # Copy sample environment configuration
   cp .env.example .env
   ```
   *(Optional: Edit `.env` and set your `OPENAI_API_KEY=sk-...`)*

5. (Optional) Run the standalone ingestion script:
   ```bash
   python ingest.py
   ```

6. Start the FastAPI backend server:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The backend will be available at `http://127.0.0.1:8000` (Swagger UI at `http://127.0.0.1:8000/docs`).*

---

### Step 2: Set Up Frontend (`frontend/`)

1. In a new terminal window, navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend will be running at `http://localhost:3000`.*

---

## 🧪 Interactive Preset Test Scenarios

| Scenario | Query Summary | Scope Filters | Expected Verdict | Governing Citation |
|---|---|---|---|---|
| **⚡ Plenum PVC** | "Can we run Schedule 40 PVC conduit in ceiling plenum?" | Electrical / National / Code | ❌ **Non-Compliant** | NEC Article 300.22(C) |
| **🏢 Concrete PSI** | "Cylinder break test achieved 4,850 psi for PT slab" | Structural / National / Spec | ✅ **Compliant** | Spec Div 03 30 00 §2.03.A |
| **🔥 Firestop Seal** | "Annular space packed with bare ceramic wool only" | Fire Safety / National / Code | ❌ **Non-Compliant** | IBC Section 714.4.1.2 |
| **💧 DWV Water Test** | "30-min hydrostatic test with 42-ft static head" | Plumbing / National / Code | ✅ **Compliant** | UPC Section 312.2 |
| **📐 Egress Width** | "Stairway serving 120 occupants has 40-inch width" | Structural / National / Code | ❌ **Non-Compliant** | IBC Section 1011.2 (Min 44 in) |
| **❓ Ambiguous Query** | "Acoustic wrap thickness for office panels" | All / All / All | ⚠️ **Ambiguous** | Missing Project Submittals |

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── .env.example          # Environment variable template
│   ├── ingest.py             # Qdrant Hybrid collection setup & chunk ingestion
│   ├── main.py               # FastAPI server with CORS and /api/verify-compliance
│   ├── mock_data.py          # Realistic statutory codes (IBC, NEC, UPC, CBC) & specs
│   ├── requirements.txt      # Python dependencies (FastAPI, Qdrant, FastEmbed, LangChain)
│   └── schemas.py            # Pydantic models for queries, citations, and responses
├── frontend/
│   ├── app/
│   │   ├── globals.css       # Custom industrial styling & glassmorphism
│   │   ├── layout.js         # Root layout with Inter / JetBrains Mono fonts
│   │   └── page.js           # Client component with verification UI & citations
│   ├── package.json          # Next.js 14, React 18, Tailwind CSS, Lucide icons
│   ├── postcss.config.js     # PostCSS configuration
│   └── tailwind.config.js    # Tailwind configuration & custom palette tokens
├── implementation_plan.md    # Initial technical specification
└── README.md                 # Complete documentation & usage guide
```
=======
## ✨ Features

### Core (MVP)
- 🔍 **Natural-language compliance search** across building codes, project specifications, and inspection reports
- 📄 **Source-cited answers** — every response includes the document and section that supports it
- 🚫 **"I don't know" handling** — the system refuses to guess when the corpus lacks sufficient information
- 🗂️ **Metadata-based filtering** — retrieval scoped by document type, project, and section
- 💬 **Conversational interface** — ask follow-up questions in a simple chat-style UI
- ✅ **Grounded responses only** — answers are strictly based on retrieved document content; no hallucination

### Document Sources
| Source | What It Provides |
|--------|-----------------|
| Building Codes | Regulations, safety requirements, construction standards |
| Project Specifications | Project-specific technical requirements and materials |
| Inspection Reports | Previous findings, observations, and compliance-related information |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js (for Next.js frontend, if applicable)
- Access to an Embeddings API
- Access to a Vector Database
- Access to an LLM API
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/construction-compliance-assistant.git
cd construction-compliance-assistant

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt
```

### Environment Configuration

Create a `.env` file in the project root (never commit this file):

```env
EMBEDDINGS_API_KEY=your_embeddings_api_key
LLM_API_KEY=your_llm_api_key
VECTOR_DB_URL=your_vector_database_url
VECTOR_DB_API_KEY=your_vector_db_api_key
```

> ⚠️ Never hard-code API keys. The `.env` file is excluded from version control via `.gitignore`.

### Document Ingestion

```bash
# Place your documents in the /data directory:
# data/building_codes/
# data/project_specifications/
# data/inspection_reports/

# Run the ingestion pipeline
python pipeline/ingest.py
```

This will:
1. Validate and clean all documents
2. Chunk documents into retrievable sections
3. Generate embeddings for each chunk
4. Index chunks and metadata in the vector database

### Running the Application

```bash
# Option A — Streamlit
streamlit run app.py

# Option B — Next.js frontend (from /frontend directory)
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
construction-compliance-assistant/
├── data/
│   ├── building_codes/         # Building code documents
│   ├── project_specifications/ # Project specification documents
│   └── inspection_reports/     # Inspection report documents
│
├── pipeline/
│   ├── ingest.py               # Document ingestion entry point
│   ├── loader.py               # Document loading and format handling
│   ├── cleaner.py              # Text cleaning and normalization
│   ├── chunker.py              # Document chunking logic
│   ├── embedder.py             # Embedding generation
│   └── indexer.py              # Vector database indexing
│
├── retrieval/
│   ├── retriever.py            # Semantic search and top-k retrieval
│   └── metadata_filter.py      # Metadata-based filtering
│
├── generation/
│   ├── prompt_builder.py       # RAG prompt construction
│   ├── answer_generator.py     # LLM answer generation
│   └── citation_handler.py     # Source citation formatting
│
├── evaluation/
│   ├── test_questions.json     # Predefined evaluation questions
│   └── evaluator.py            # Retrieval and answer quality evaluation
│
├── frontend/                   # Next.js frontend (if applicable)
├── app.py                      # Streamlit application entry point
├── tests/                      # Unit tests (≥ 80% coverage target)
├── .env.example                # Environment variable template
├── .gitignore
├── requirements.txt
└── README.md
```

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Regulation Retrieval Accuracy | ≥ 90% |
| Relevant Document Retrieval | ≥ 90% |
| Grounded Answer Accuracy | ≥ 90% |
| Source Citation Accuracy | ≥ 95% |
| "I Don't Know" Accuracy | ≥ 95% |
| Answer Response Time | < 5 seconds |
| Document Processing Success Rate | ≥ 95% |
| Unit Test Coverage | ≥ 80% |

---

## 🧪 Evaluation

The system is evaluated using a predefined set of construction compliance questions:

```bash
# Run RAG evaluation
python evaluation/evaluator.py
```

Evaluation covers:
- **Retrieval accuracy** — are the correct document chunks retrieved?
- **Grounded answer accuracy** — does the answer align with retrieved content?
- **Citation accuracy** — do citations correctly support the generated answer?
- **"I don't know" accuracy** — does the system correctly refuse unsupported questions?

---

## 👥 Team

| Name | Role | Responsibilities |
|------|------|-----------------|
| **Megha R.** | UI/UX Designer | Interface design, user flows, chat UI, source/citation display, frontend collaboration |
| **A Balagiri** | RAG & Backend Developer | Document processing, chunking, embeddings, vector DB integration, retrieval logic |
| **Bhavendra Kumar Y** | Frontend Developer | Chat interface, responsive UI, answer/citation display, frontend integration |

---

## 📐 Architecture Notes

### Document Processing
- All documents are validated for format and completeness before ingestion
- Corrupted or unreadable documents are logged without interrupting the pipeline
- Documents are cleaned, normalized, and divided into meaningful chunks
- Each chunk retains metadata: `document_type`, `document_title`, `section`, `source`, `project_id`

### Retrieval
- User queries are converted to embeddings and matched against the vector index
- Top-k most semantically similar chunks are retrieved
- Metadata filters can scope results to a specific document type or project

### Answer Generation
- Retrieved chunks are injected into the LLM prompt as grounding context
- The LLM generates an answer strictly from the provided context
- Every answer includes source citations
- If no relevant chunks are retrieved, the system responds: **"I don't know"**

---

## 🔒 Security

- API keys and secrets are stored in `.env` files and excluded from version control
- Construction documents and confidential project data are not exposed in the repository
- Document content is not unintentionally leaked through application logs
- Access to the document corpus is restricted to authorized users

---

## 🛠️ Code Quality

- Python code follows **PEP 8** standards
- RAG components are modular and clearly separated
- All major functions and components include documentation
- Unit tests achieve ≥ 80% coverage for critical components
- **GitHub Actions** runs automated checks on every push and pull request

---

## 📄 License

This project is developed as part of the Kalvium UG Program — Software Product Engineering (Sprint 2). For internal use only.

---

> *"The Construction Compliance Assistant bridges the gap between a large construction document corpus and fast, reliable compliance verification — enabling engineers to ask questions in natural language and receive grounded, cited, and trustworthy answers."*
>>>>>>> 0dfa0881a157243bf02aa48cb1d7118d9295b574
