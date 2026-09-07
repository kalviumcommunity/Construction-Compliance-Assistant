# SiteSafe Token-Aware Chunker & Sliding Overlap Architecture Report

## Systems Architecture Overview

In regulatory compliance RAG applications ("SiteSafe"), character-based chunking creates two severe engineering risks:
1. **Unpredictable Token Expansion**: Character counts do not track BPE tokens linearly, causing sudden embedding batch cost spikes and context window overflow.
2. **Severed Rule-Exception Boundaries**: When a legal prohibition (e.g., *"0% unprotected openings allowed"*) falls on a chunk split boundary without overlap, it is severed from its prerequisite exception clause (*"EXCEPT WHERE equipped with NFPA 13 sprinklers..."*), creating misleading answers and false-positive non-compliance flags.

This report details the implementation, boundary demonstration, and mathematical parameter justification for [`backend/token_chunker.py`](file:///f:/desk/RAG/backend/token_chunker.py) and [`backend/test_token_chunker.py`](file:///f:/desk/RAG/backend/test_token_chunker.py).

---

## 1. Sliding Token Window Engine & Architecture (Task 1 & Task 2)

```
  +-----------------------------------------------------------------------------+
  |                           Raw Input Document                                |
  +-----------------------------------------------------------------------------+
                                         |
                                         v
  +-----------------------------------------------------------------------------+
  |                   BPE Tokenization (tiktoken o200k_base)                    |
  |                        Tokens: [T_0, T_1, T_2, ... T_N]                      |
  +-----------------------------------------------------------------------------+
                                         |
                                         v
  +-----------------------------------------------------------------------------+
  |                 Sliding Token Window (Step Size = 250 Tokens)               |
  |                                                                             |
  |   Chunk 0:  [ T_0  -----------------------------> T_299 ]                   |
  |                                                                             |
  |   Chunk 1:                [ T_250 -------------> T_549 ]                    |
  |                             |<-- 50 Token Overlap -->|                      |
  +-----------------------------------------------------------------------------+
                                         |
                                         v
  +-----------------------------------------------------------------------------+
  |                  BPE Token Decoding -> Structured Chunks                    |
  |   {"chunk_index": int, "token_count": int, "text": str, "overlap": 50}      |
  +-----------------------------------------------------------------------------+
```

---

## 2. Boundary Preservation Demonstration Logs (Task 3)

### Scenario A: Fixed-Size Splitting WITHOUT Overlap (`chunk_size=35`, `overlap=0`)
```text
--- Chunk [1] (35 Tokens) ---
"IBC Section 705.8.2: Exterior openings in Type V buildings facing an interior lot line less than 5 feet away are strictly prohibited from having unprotected glazing,"
[WARNING]: Prohibition rule is presented as an absolute ban, missing the sprinkler exception!

--- Chunk [2] (35 Tokens) ---
"EXCEPT WHERE the building is fully equipped with an automatic fire sprinkler system complying with NFPA 13, in which case a maximum of 15% protected openings shall be permitted"
[WARNING]: Exception clause 'EXCEPT WHERE' is orphaned without the prohibition rule!
```
> ⚠️ **Failure Analysis**: In Scenario A, Chunk 1 presents a 100% absolute ban without mentioning NFPA 13 sprinklers. Chunk 2 starts abruptly with `"EXCEPT WHERE"`, losing the context of what building type or setback distance it applies to.

---

### Scenario B: Token-Aware Splitting WITH Overlap (`chunk_size=35`, `overlap=12`)
```text
--- Chunk [1] (35 Tokens, 0 Overlap) ---
"IBC Section 705.8.2: Exterior openings in Type V buildings facing an interior lot line less than 5 feet away are strictly prohibited from having unprotected glazing,"

--- Chunk [2] (35 Tokens, 12 Overlap) ---
"5 feet away are strictly prohibited from having unprotected glazing, EXCEPT WHERE the building is fully equipped with an automatic fire sprinkler system complying with NFPA 13, in which"
[SUCCESS]: Overlap preserves BOTH the prohibition rule and the 'EXCEPT WHERE' sprinkler condition!
```
> ✅ **Success Analysis**: In Scenario B, Chunk 2 includes the 12 trailing tokens from Chunk 1. As a result, Chunk 2 contains **both** the prohibition requirement (*"strictly prohibited from having unprotected glazing"*) AND the prerequisite relief condition (*"EXCEPT WHERE equipped with NFPA 13 sprinklers"*).

---

## 3. Mathematical Parameter Justification & Model Sizing (Task 4)

### Target Model Specifications

| Parameter | `text-embedding-3-small` (Vector Search) | `gpt-4o-mini` (LLM Inference) |
| :--- | :--- | :--- |
| **Max Token Capacity** | 8,191 tokens | 128,000 tokens |
| **Optimal Single Chunk Size** | **300 tokens** (~1,350 characters) | **300 tokens** |
| **Retrieved Top-K Load** | 4 chunks = **1,200 tokens** | 4 chunks = **1,200 tokens** |
| **Context Consumption %** | 14.6% of vector limit | 0.93% of LLM limit |

---

### Mathematical Rationale for Selected Parameters

#### 1. `chunk_size_tokens = 300` (~1,350 Characters)
* **Granularity & Density**: 300 tokens comfortably accommodates a full statutory building code section (typically 150–250 tokens) without diluting vector embedding density with unrelated articles.
* **Retrieval Cost Optimization**: Returning 4 retrieved chunks (totaling ~1,200 input tokens) incurs an input cost of **$0.00018 per query** on `gpt-4o-mini`, leaving over 99% of the LLM context window reserved for multi-turn chat history.

#### 2. `chunk_overlap_tokens = 50` (~16.6% Overlap Ratio)
* **Preservation of Legal Conditionals**: 50 tokens (approx. 35–40 words) is the exact length required to capture complex legal subclauses (*"provided that the fire separation distance is not less than..."*).
* **Prevention of Duplicate Explosion**: Overlap ratios above 25% inflate total index vector storage unnecessarily. A 16.6% ratio (50/300) achieves optimal continuity without exploding storage costs.

---

## 4. Unit Test Execution Log (Task 5)

Executing `python backend/test_token_chunker.py`:

```text
....
----------------------------------------------------------------------
Ran 4 tests in 0.477s

OK
```

### Verified Assertions:
1. **`test_1_token_bounds`**: Confirms no generated chunk exceeds `chunk_size_tokens`.
2. **`test_2_overlap_verification`**: Asserts that the first $N$ tokens of Chunk $i+1$ match the last $N$ tokens of Chunk $i$ using `token_ids`.
3. **`test_3_short_text_passthrough`**: Confirms short input texts return 1 chunk with 0 overlap.
4. **`test_4_boundary_continuity`**: Asserts key legal phrases exist continuously across generated chunks.

---

## 5. Standardized Git Commit Message (Task 5)

```text
feat(chunking): implement token-aware chunker with sliding token overlap

- Add `backend/token_chunker.py` with `TokenAwareChunker` class using `tiktoken` (`o200k_base`/`cl100k_base`)
- Implement sliding token window with configurable `chunk_size_tokens` and `chunk_overlap_tokens`
- Add comparative boundary preservation demo proving overlap prevents rule-exception severance
- Add unit test suite `test_token_chunker.py` verifying token bounds and exact overlap alignment
- Document model sizing analysis and mathematical justifications in `TOKEN_CHUNKER_REPORT.md`
```
