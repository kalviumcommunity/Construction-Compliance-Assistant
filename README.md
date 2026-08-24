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
```

---

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
