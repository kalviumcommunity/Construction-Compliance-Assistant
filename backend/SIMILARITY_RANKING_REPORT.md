# SiteSafe Vector Similarity & Ranking Report

## Executive Summary
This report details the implementation, benchmarking, and architectural evaluation of the vector similarity retrieval module (`similarity_ranker.py`) for the **SiteSafe** Construction Regulatory Compliance RAG assistant.

---

## 1. Metric Implementation & Formulas

The module implements pure NumPy vector distance and similarity functions:

1. **Cosine Similarity**:
   $$\text{cos\_sim}(u, v) = \frac{u \cdot v}{\|u\|_2 \|v\|_2}$$
2. **Dot Product**:
   $$\text{dot\_prod}(u, v) = u \cdot v$$
3. **Euclidean Distance (L2)**:
   $$d_{L2}(u, v) = \|u - v\|_2$$

---

## 2. Test Query & Ranked Retrieval Leaderboard

### Test Query
> *"What are the fire rating requirements and allowable window openings for an exterior wall built 4 feet from a lot line?"*

### Retrieval Leaderboard

| Rank | Score (Cosine) | Document | Section | Trade | Chunk Summary |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | **0.8028** | `IBC_2021.pdf` | `705.8` | **Fire Safety** | *IBC 2021 Section 705.8: Exterior walls... less than 5 ft from lot line require 1-hr fire-rating...* |
| **2** | **0.5451** | `NEC_2023.pdf` | `210.8(B)` | **Electrical** | *NEC 2023 Article 210.8(B): GFCI protection for 125V-250V receptacles on temporary power...* |
| **3** | **0.5440** | `Tower_B_Specs.md` | `03 30 00` | **Structural** | *Division 03 30 00: Foundation footings require high-sulfate resistant concrete...* |
| **4** | **0.4750** | `Site_Admin_Policy.txt` | `Admin 1.2` | **Administrative** | *All site personnel must submit weekly safety sign-in sheets and daily shift log timesheets...* |

### Differential Score Metrics
- **Top Match (Rank #1)**: Score = `0.8028` (`Fire Safety` - `IBC 2021 Section 705.8`)
- **Lowest Match (Rank #4)**: Score = `0.4750` (`Administrative` - `Site Policy Admin 1.2`)
- **Delta Score ($\Delta$)**: `0.3278` (Clear margin prioritizing target regulatory clause over unrelated domain policies).

---

## 3. Metric Selection & Technical Justification

### Why Cosine Similarity Over Euclidean Distance
1. **Directional Semantics**: Neural language models encode semantic concepts along angular directions in high-dimensional vector spaces.
2. **Document Length Invariance**: Euclidean distance penalizes longer document chunks due to higher vector norms $\|v\|_2$. Cosine similarity normalizes vector lengths, ensuring short queries and long technical clauses are compared purely on conceptual alignment.

### Dot Product Equivalence for Unit Vectors
When vectors are pre-normalized to unit $L_2$ norm ($\|u\|_2 = 1, \|v\|_2 = 1$), cosine similarity simplifies to:
$$\text{cos\_sim}(u, v) = u \cdot v$$
Pre-normalizing candidate vectors enables vector search engines (Qdrant, Chroma, FAISS) to run ultra-fast BLAS matrix-vector dot products ($M \cdot q$) without real-time square-root overhead.

---

## 4. Programmatic Safety Assertions
The verification runner enforces three critical safety assertions during execution:
- `[PASS]` Target Match (`Fire Safety`) ranks **#1** with the highest score.
- `[PASS]` Administrative chunk ranks **#4** with the lowest score.
- `[PASS]` Strict monotonic score ordering (`score[i] >= score[i+1]`) verified across all ranks.

---

## 5. Git Commit Message

```text
feat(retrieval): implement vector similarity ranker & metric evaluation suite

- Add backend/similarity_ranker.py with cosine, dot product, and Euclidean vector metrics in pure NumPy.
- Implement vectorized batch similarity computation and zero-norm safeguards.
- Implement mini-corpus retrieval comparison ranking Target Match (Fire Safety) #1 vs. Structural, Electrical, and Administrative chunks.
- Add programmatic assertions verifying rank #1 target match, rank #4 administrative chunk, and monotonic score ordering.
- Add backend/SIMILARITY_METRIC_JUSTIFICATION.md explaining cosine similarity vs Euclidean distance and unit-norm dot product equivalence.
- Create backend/SIMILARITY_RANKING_REPORT.md with metric equations, leaderboard, and differential analysis.
```
