# SiteSafe Vector Retrieval & Top-k Search Report

## Executive Summary
This report documents the implementation, execution, and dynamic $k$-value benchmarking of the vector similarity retrieval step ([`vector_retriever.py`](file:///f:/desk/RAG/backend/vector_retriever.py)) for the **SiteSafe** Construction Regulatory Compliance RAG assistant.

---

## 1. Vector Search Pipeline Architecture (Tasks 1, 2, & 3)

1. **Query Vectorization (Task 1)**:
   - User input text is embedded using the exact same client configuration (`EMBEDDING_MODEL_NAME`, `EMBEDDING_DIMENSION`) as the indexed corpus chunks.
2. **Top-k Vector Search (Task 2)**:
   - Query vector is passed to Qdrant via `client.query_points()`, searching against the `sitesafe_corpus_chunks` collection using Cosine distance.
3. **Payload & Score Extraction (Task 3)**:
   - Extracted hits return Cosine similarity scores, raw text chunks for LLM context grounding, and structured metadata (`source_doc`, `chunk_index`, `section`, `page`, `trade`, `jurisdiction`).

---

## 2. Dynamic $k$-Value Comparison (Task 4)

### Sample Query
> *"IBC Section 705.8: Exterior wall openings fire separation distance."*

### Retrieval Output for $k = 2$

| Rank | Score | Record ID | Source Document | Section | Trade |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | `0.6334` | `doc_chunk_005` | `CBC_2022_Title24.pdf` | `Chapter 11B` | `Fire Safety` |
| **2** | `0.4343` | `doc_chunk_002` | `Tower_B_Concrete_Specs.pdf` | `Section 26.5.3` | `Structural` |

### Retrieval Output for $k = 4$

| Rank | Score | Record ID | Source Document | Section | Trade |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | `0.6334` | `doc_chunk_005` | `CBC_2022_Title24.pdf` | `Chapter 11B` | `Fire Safety` |
| **2** | `0.4343` | `doc_chunk_002` | `Tower_B_Concrete_Specs.pdf` | `Section 26.5.3` | `Structural` |
| **3** | `-0.2532` | `doc_chunk_004` | `IPC_2021_Plumbing.pdf` | `Section 604.4` | `Plumbing` |
| **4** | `-0.2898` | `doc_chunk_003` | `OSHA_Construction_Electrical.pdf` | `1926.404(b)(1)(ii)` | `Electrical` |

---

## 3. Key Observations & Findings

- **Rank #1 Consistency**: The top-ranked result (`doc_chunk_005` - `Fire Safety`) remains strictly identical regardless of whether $k=2$ or $k=4$.
- **Expanded Context**: Increasing $k$ from 2 to 4 retrieves additional lower-ranked candidates (`Plumbing`, `Electrical`), enabling multi-trade analysis or candidate threshold filtering ($\text{Score} > 0.40$).

---

## 4. Git Commit Message (Task 5)

```text
feat(retrieval): implement vector search retriever & dynamic k-value benchmarking

- Add backend/vector_retriever.py to embed user queries and run Qdrant vector similarity search.
- Extract relevance scores, raw text chunks, and structured metadata for prompt context injection.
- Demonstrate dynamic k-value behavior comparing k=2 vs k=4.
- Validate rank #1 stability across k-values and export backend/vector_retrieval_results.json.
- Author backend/VECTOR_RETRIEVAL_REPORT.md.
```
