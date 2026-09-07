# SiteSafe Filtered & Hybrid Retrieval Demonstration Report

## Executive Summary
This report details the implementation, comparison, and precision evaluation of metadata-filtered vector search and exact term hybrid retrieval ([`filtered_retriever.py`](file:///f:/desk/RAG/backend/filtered_retriever.py)) for the **SiteSafe** Construction Regulatory Compliance RAG assistant.

---

## 1. Filtered vs Unfiltered Vector Search Comparison (Tasks 1 & 2)

### Test Query
> *"What are the fire safety requirements for construction site building codes?"*

### Unfiltered Vector Search (Baseline)
In unfiltered vector search, candidate chunks from unrelated trades (such as `Structural` - `doc_chunk_002`) appear in Rank #1 due to broad semantic term overlap.

| Rank | Score | Record ID | Source Document | Trade | Jurisdiction |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | `0.1650` | `doc_chunk_002` | `Tower_B_Concrete_Specs.pdf` | **Structural** | `California` |
| **2** | `0.1481` | `doc_chunk_005` | `CBC_2022_Title24.pdf` | **Fire Safety** | `California` |
| **3** | `-0.0119` | `doc_chunk_001` | `IBC_2021_Fire_Safety.pdf` | **Fire Safety** | `National` |

### Metadata Filtered Search (`trade == "Fire Safety"`)
Applying a Qdrant `FieldCondition` metadata filter strictly restricts retrieval to `Fire Safety` documents, completely eliminating out-of-scope structural specifications.

| Rank | Score | Record ID | Source Document | Trade | Jurisdiction |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | `0.1481` | `doc_chunk_005` | `CBC_2022_Title24.pdf` | **Fire Safety** | `California` |
| **2** | `-0.0119` | `doc_chunk_001` | `IBC_2021_Fire_Safety.pdf` | **Fire Safety** | `National` |

---

## 2. Hybrid Keyword-Boosted Search (Task 3 & 4)

### Problem
When searching for specific legal clauses (e.g. `Section 705.8`), pure dense vector embeddings may prioritize generic fire safety descriptions over the exact target clause.

### Hybrid Solution & Precision Boosting
Combining dense vector scores with exact keyword term presence (`boost = 0.30` per matching keyword `['705.8', 'unprotected']`) re-ranks the exact clause `IBC_2021_Fire_Safety.pdf` (`Section 705.8`) from Rank #3 to **Rank #1**.

| Rank | Dense Score | Keyword Boost | Hybrid Score | Record ID | Document / Section | Trade |
| :---: | :---: | :---: | :---: | :--- | :--- | :--- |
| **1** | `-0.0119` | `+0.60` (`705.8`, `unprotected`) | **`0.2881`** | `doc_chunk_001` | `IBC_2021_Fire_Safety.pdf` (`705.8`) | **Fire Safety** |
| **2** | `0.1650` | `+0.00` | **`0.1650`** | `doc_chunk_002` | `Tower_B_Concrete_Specs.pdf` (`26.5.3`) | **Structural** |
| **3** | `0.1481` | `+0.00` | **`0.1481`** | `doc_chunk_005` | `CBC_2022_Title24.pdf` (`11B`) | **Fire Safety** |

---

## 3. Verification Assertions
All programmatic safety assertions passed during execution:
- `[PASS]` Trade metadata filter strictly scoped results to `Fire Safety`.
- `[PASS]` Jurisdiction metadata filter strictly scoped results to `California`.
- `[PASS]` Hybrid search successfully boosted exact clause `'705.8'` to **Rank #1**.

---

## 4. Git Commit Message (Task 5)

```text
feat(retrieval): implement metadata filtering & hybrid keyword-vector search

- Add backend/filtered_retriever.py supporting Qdrant FieldCondition metadata filtering (trade, jurisdiction, doc_type).
- Implement hybrid search scoring combining dense vector cosine similarity with exact keyword presence boosting.
- Demonstrate precision improvement: trade filter eliminates irrelevant structural chunks, and keyword boost elevates exact section 705.8 to Rank #1.
- Export backend/filtered_retrieval_results.json and author backend/FILTERED_RETRIEVAL_REPORT.md.
```
