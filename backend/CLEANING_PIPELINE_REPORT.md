# SiteSafe Text Cleaning, Boilerplate Stripping, & Hyphenation Healing Report

## Systems Architecture Overview

In regulatory compliance RAG systems ("SiteSafe"), raw text extracted from PDFs, HTML municipal exports, and project specifications is heavily contaminated with noise:
- Running headers, footers, and page numbers (`Page 142 of 850`, `- 142 -`).
- Broken line-wrap hyphenations (`fire-re-\nsistance rat-\ning` $\rightarrow$ `fire-resistance rating`).
- Non-standard Unicode artifacts (non-breaking spaces `\u00a0`, typographer quotes `“setback”`).
- Runaway newlines and multi-tab gaps that artificially inflate vector token costs.

This report documents the architectural design, regex rule justifications, test execution results, and before/after metrics for [`backend/text_cleaner.py`](file:///f:/desk/RAG/backend/text_cleaner.py) and [`backend/test_text_cleaner.py`](file:///f:/desk/RAG/backend/test_text_cleaner.py).

---

## 1. Cleaning Pipeline Architecture & Regex Justifications (Tasks 1 & 2)

```
  +-------------------------------------------------------------------------+
  |                           Raw Extracted Text                            |
  +-------------------------------------------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  | 1. Unicode NFKC Normalization (normalize_unicode)                      |
  |    - unicodedata.normalize('NFKC')                                      |
  |    - Replace \u00a0 -> space, \u200b -> empty                            |
  |    - Map curly quotes (“ ” ‘ ’) -> ASCII (" ') & dashes (— –) -> -      |
  +-------------------------------------------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  | 2. Boilerplate & Disclaimer Stripping (strip_boilerplate)               |
  |    - Strip page numbers: r"(?i)page\s+\d+(?:\s+of\s+\d+)?"               |
  |    - Strip headers: r"(?i)2021\s+INTERNATIONAL\s+BUILDING\s+CODE..."      |
  |    - Strip disclaimers: r"(?i)CONFIDENTIAL\s*-\s*TOWER\s+B\s+SPEC..."     |
  +-------------------------------------------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  | 3. Broken Line-Wrap Hyphenation Healing (fix_broken_hyphenations)       |
  |    - Heals: r"(\b[a-zA-Z]+)-\s*\n\s*([a-zA-Z]+\b)" -> r"\1\2"            |
  |    - Heals: r"(\b[a-zA-Z]+-[a-zA-Z]+)-\s*\n\s*([a-zA-Z]+\b)" -> r"\1\2"   |
  +-------------------------------------------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  | 4. Whitespace & Paragraph Normalization (normalize_whitespace)          |
  |    - Convert \r\n -> \n                                                 |
  |    - Collapse multi-spaces/tabs -> single space                         |
  |    - Collapse 3+ newlines -> standard \n\n                              |
  +-------------------------------------------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  |                         Cleaned Text Payload                            |
  +-------------------------------------------------------------------------+
```

---

## 2. Side-by-Side Verification Diffs & Noise Reduction Metrics (Task 4)

| Fixture Category | Raw Input Excerpt | Cleaned Output Excerpt | Noise Reduction % |
| :--- | :--- | :--- | :--- |
| **Fixture A: PDF Code Excerpt** | `"2021 INTERNATIONAL BUILDING CODE®\nPage 142 of 850\nIBC 2021 Section 705.8: Exterior walls of Type V-A con-\nstruction... fire-re-\nsistance rat-\ning..."` | `"IBC 2021 Section 705.8: Exterior walls of Type V-A construction located less than 5 feet from the lot line shall have a minimum fire-resistance rating of 1 hour and must have 0% unprotected openings."` | **25.19% Reduction** (266 $\rightarrow$ 199 chars) |
| **Fixture B: HTML Zoning Export** | `"Home > Title 24 > Chapter 7 > Municipal Zoning Export\n\nMunicipal Zoning Bylaws Section 4.2:\nAll commercial structures built within Zone C-2 must maintain a \u201csetback\u201d distance..."` | `"Municipal Zoning Bylaws Section 4.2:\nAll commercial structures built within Zone C-2 must maintain a "setback" distance of 15 feet.\n\nTable 4.2.1: Side Setbacks\nZone C-2 Commercial: 5.0 feet."` | **23.39% Reduction** (248 $\rightarrow$ 190 chars) |
| **Fixture C: Site Spec Amendment** | `"SECTION 03 30 00 - CAST-IN-PLACE CONCRETE\nCONFIDENTIAL - TOWER B SPECIFICATIONS...\n1.1 PERFORMANCE REQUIREMENTS\nA. Structural concrete footings...\t\t\tSlump..."` | `"SECTION 03 30 00 - CAST-IN-PLACE CONCRETE\n\n1.1 PERFORMANCE REQUIREMENTS\nA. Structural concrete footings shall achieve f'c = 4,000 psi. Slump range: 4 inches +/- 1 inch."` | **43.24% Reduction** (296 $\rightarrow$ 168 chars) |

---

## 3. Unit Test Execution Log (Task 5)

Executing `python backend/test_text_cleaner.py` using Python's standard `unittest` runner:

```text
.....
----------------------------------------------------------------------
Ran 5 tests in 0.003s

OK
```

### Verified Test Cases:
1. **`test_1_unicode_normalization`**: Verifies NFKC conversion, non-breaking space replacement (`\u00a0`), and ASCII quote mapping (`“setback”` $\rightarrow$ `"setback"`).
2. **`test_2_boilerplate_removal`**: Verifies removal of statutory headers (`2021 INTERNATIONAL BUILDING CODE®`) and page numbers (`Page 142 of 850`, `- 142 -`).
3. **`test_3_hyphenation_healing`**: Verifies healing of line-wrapped hyphenated terms (`fire-re-\nsistance rat-\ning` $\rightarrow$ `fire-resistance rating`).
4. **`test_4_whitespace_collapse`**: Verifies conversion of `\r\n`, tab collapse, and 3+ line-break collapse into standard `\n\n`.
5. **`test_5_graceful_malformed_input`**: Verifies safe handling of empty strings, `None` inputs, numeric types, and corpus batch records.

---

## 4. Standardized Git Commit Message (Task 5)

```text
feat(ingestion): implement production text cleaning, boilerplate stripping, and hyphenation healing engine

- Add `backend/text_cleaner.py` with zero-dependency `DocumentCleaner` class and batch `clean_corpus` pipeline
- Implement Unicode NFKC normalization, typographer quote mapping, and non-breaking space replacement
- Implement regex boilerplate stripping for page numbers, disclaimers, and statutory headers
- Implement line-wrap hyphenation healing (`fire-re-\nsistance` -> `fire-resistance`)
- Add unit test suite `test_text_cleaner.py` verifying all 5 test cases
- Document cleaning pipeline architecture and verification diffs in `CLEANING_PIPELINE_REPORT.md`
```
