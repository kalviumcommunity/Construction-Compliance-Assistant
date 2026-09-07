# SiteSafe Retrieval Quality & Sanity Verification Report

## Executive Summary
This report presents the quality verification and sanity testing results produced by [`retrieval_sanity_checker.py`](file:///f:/desk/RAG/backend/retrieval_sanity_checker.py) for the **SiteSafe** Construction Regulatory Compliance RAG assistant.

---

## 1. Test Suite Overview & Known Relevance Pairs (Task 1 & 2)

A suite of known query-chunk pairs was constructed across technical building codes (`IBC`, `ACI`, `NEC`, `IPC`), administrative policies, and site safety procedures to confirm that semantic vector retrieval prioritizes domain-relevant clauses above unrelated texts.

### Summary Table

| Test ID | Category | Query Text | Top-Ranked Source | Score | Least-Ranked Source | Delta ($\Delta$) | Status |
| :---: | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| **TEST-01** | Standard Direct | *Fire rating and window openings 4ft from lot line* | `IBC_2021.pdf` (`705.8`) | `0.8028` | `Site_Admin_Policy.txt` | `0.3278` | **PASS** |
| **TEST-02** | Standard Direct | *Wet curing days for foundation footings* | `Tower_B_Specs.md` (`03 30 00`) | `0.8560` | `Site_Admin_Policy.txt` | `0.3624` | **PASS** |
| **TEST-03** | Standard Direct | *GFCI protection for temporary power* | `NEC_2023.pdf` (`210.8(B)`) | `0.8349` | `Site_Admin_Policy.txt` | `0.3218` | **PASS** |
| **TEST-04** | Borderline/Ambiguous | *Who reviews daily fire logs for site safety* | `Site_Safety_Manual.pdf` (`Section 4.1`) | `0.8293` | `IPC_2021.pdf` (`604.4`) | `0.3068` | **PASS** |

---

## 2. Analysis of Borderline / Surprising Edge Case (Task 3)

### TEST-04 Findings & Insights
- **Scenario**: Query asked *"Who must review daily fire logs for site safety approval?"*.
- **Candidate Competition**:
  - `chunk_fire_01` (Statutory Building Code - `IBC 2021 Section 705.8` Fire Rating Setbacks).
  - `chunk_fire_02_ambiguous` (Operational Site Safety - `Section 4.1` Hot Work & Fire Watch Sign-off Logs).
- **Observed Ranking & Pipeline Revelation**:
  `chunk_fire_02_ambiguous` achieved Rank #1 (`0.8293`) over statutory `IBC 2021 Section 705.8` (`0.6120`).
- **Architectural Insight**:
  Pure dense vector retrieval is highly sensitive to operational vocabulary ("logs", "safety trailer", "site safety approval") versus legal statutory terms ("fire-resistance rating", "lot line"). 
  - *Recommendation for SiteSafe Production*: Combine dense vector retrieval with **metadata filtering** (`doc_type == "building_code"`) or hybrid BM25 + dense ranking when users query specific code compliance requirements versus site management operations.

---

## 3. Sanity Report Totals (Task 4)

- **Total Test Cases Executed**: `4`
- **Tests Passed**: `4`
- **Tests Failed / Flagged**: `0`
- **Average Delta Margin**: `0.3297`

---

## 4. Git Commit Message (Task 5)

```text
test(retrieval): add retrieval quality sanity test suite & evaluation report

- Add backend/retrieval_sanity_checker.py to validate known query-chunk relevance pairs.
- Confirm relevant trade chunks rank consistently above unrelated administrative policies with >0.30 score delta.
- Identify edge case (TEST-04) demonstrating semantic sensitivity between operational fire logs vs statutory fire setback codes.
- Export retrieval_sanity_report.json and author backend/RETRIEVAL_SANITY_REPORT.md.
```
