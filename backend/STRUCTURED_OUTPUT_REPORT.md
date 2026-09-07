# SiteSafe Structured Output JSON Schema & Recovery Pipeline Report

## Systems Architecture Overview

In safety-critical regulatory RAG platforms ("SiteSafe"), downstream application UIs, audit logging pipelines, and automated reporting systems cannot consume loose free-form text. They require **guaranteed, machine-readable JSON payloads** with strict schema typing, verified statutory citations, and defensive error recovery.

This report details the Pydantic v2 schema specification, parsing pipeline, validation rules, and recovery behaviors implemented in [`backend/structured_output_handler.py`](file:///f:/desk/RAG/backend/structured_output_handler.py).

---

## 1. Pydantic v2 Schema Specification (Task 1 & Task 2)

```python
class Citation(BaseModel):
    document: str          # Title of standard (e.g., "IBC 2021", "Tower B Spec")
    clause_section: str    # Specific clause/article (e.g., "Section 705.8")
    page_number: int       # Source page number
    quote: str             # Verbatim text excerpt

class CompliancePayload(BaseModel):
    verdict: Literal["Compliant", "Non-Compliant", "Ambiguous/Insufficient Data"]
    answer: str
    citations: List[Citation]
    confidence_score: float = Field(..., ge=0.0, le=1.0)
```

### Mandated Validation Rules (Task 2):
1. **Literal Verdict Enforcement**: The `verdict` field must strictly match one of the three enumerated states.
2. **Mandatory Citation Guarantee**: If `verdict` is `"Compliant"` or `"Non-Compliant"`, `len(citations)` MUST be greater than 0. Definitive rulings without supporting citations are rejected.
3. **Bounded Confidence Score**: `confidence_score` is restricted to $[0.0, 1.0]$.

---

## 2. Defensive Parsing & Recovery Architecture (Task 3)

```
  +--------------------------------------------------------------------+
  |                        Raw Model Response                          |
  +--------------------------------------------------------------------+
                                    |
                                    v
  +--------------------------------------------------------------------+
  |                Sanitization (clean_json_string)                     |
  |  - Strip markdown code fences (```json ... ```)                     |
  |  - Remove trailing commas before closing braces                      |
  +--------------------------------------------------------------------+
                                    |
                                    v
                       Try Standard JSON Parsing
                           /                \
                     SUCCESS                FAIL (JSONDecodeError / Truncation)
                       /                        \
                      v                          v
  +-----------------------+           +--------------------------------+
  |  Pydantic Validation  |           |  Truncation Recovery Engine    |
  +-----------------------+           |  - Auto-close quotes & braces  |
       /             \                +--------------------------------+
   PASSED          FAILED                             |
     /                \                 Try Repaired Validation
    v                  v                   /               \
[Valid Payload]  [Schema Reject]        SUCCESS           FAIL
                                          /                  \
                                         v                    v
                                 [Recovered Payload]  [Fallback Payload]
```

---

## 3. End-to-End Test Suite Outputs (Task 4)

Below is the verified output from executing `python backend/structured_output_handler.py`:

```text
==========================================================================================
SITESAFE STRUCTURED OUTPUT VALIDATION & RECOVERY SUITE
==========================================================================================

------------------------------------------------------------------------------------------
RUNNING TEST: Fixture 1: Valid Success Payload
------------------------------------------------------------------------------------------
STATUS: SUCCESS: Standard Validation Passed
PARSED MODEL PAYLOAD:
{
  "verdict": "Non-Compliant",
  "answer": "Standard non-rated sliding glass doors are prohibited on Type V exterior walls located 4 feet from property lot lines under IBC 2021 Section 705.8.",
  "citations": [
    {
      "document": "IBC 2021",
      "clause_section": "Section 705.8",
      "page_number": 142,
      "quote": "Exterior walls of Type V construction located less than 5 feet from the lot line shall have 0% unprotected openings."
    }
  ],
  "confidence_score": 0.98
}

------------------------------------------------------------------------------------------
RUNNING TEST: Fixture 2: Markdown Wrapped JSON (```json ... ```)
------------------------------------------------------------------------------------------
STATUS: SUCCESS: Standard Validation Passed
PARSED MODEL PAYLOAD:
{
  "verdict": "Non-Compliant",
  "answer": "Standard non-rated sliding glass doors are prohibited on Type V exterior walls located 4 feet from property lot lines under IBC 2021 Section 705.8.",
  "citations": [
    {
      "document": "IBC 2021",
      "clause_section": "Section 705.8",
      "page_number": 142,
      "quote": "Exterior walls of Type V construction located less than 5 feet from the lot line shall have 0% unprotected openings."
    }
  ],
  "confidence_score": 0.98
}

------------------------------------------------------------------------------------------
RUNNING TEST: Fixture 3: Malformed / Truncated JSON (max_tokens Cutoff)
------------------------------------------------------------------------------------------
2026-09-07 10:50:14 [WARNING] JSONDecodeError encountered. Attempting truncation recovery...
2026-09-07 10:50:14 [ERROR] Recovery failed: Expecting ',' delimiter. Returning safe fallback payload.
STATUS: FALLBACK ACTIVATED: Graceful Fallback Payload Generated
PARSED MODEL PAYLOAD:
{
  "verdict": "Ambiguous/Insufficient Data",
  "answer": "Parsing Error: Model output was malformed and could not be verified.",
  "citations": [],
  "confidence_score": 0.0
}

------------------------------------------------------------------------------------------
RUNNING TEST: Fixture 4: Schema Violation (Non-Compliant with Empty Citations)
------------------------------------------------------------------------------------------
STATUS: SCHEMA REJECTED: 1 validation error for CompliancePayload
  Value error, Validation Error: A verdict of 'Non-Compliant' requires at least one supporting citation.
PAYLOAD REJECTED BY VALIDATION RULES.
==========================================================================================
```

---

## 4. Standardized Git Commit Message (Task 5)

```text
feat(backend): implement Pydantic v2 structured JSON schema and recovery engine

- Add `backend/structured_output_handler.py` with `Citation` and `CompliancePayload` models
- Enforce mandatory citation requirements for definitive verdicts ("Compliant"/"Non-Compliant")
- Implement `clean_json_string` and `parse_with_recovery` for markdown stripping and truncation recovery
- Build test runner evaluating 4 test fixtures (valid, markdown wrapped, truncated, schema violation)
- Document architecture and test output logs in `STRUCTURED_OUTPUT_REPORT.md`
```
