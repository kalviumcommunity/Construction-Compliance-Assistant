# SiteSafe Decoupled Prompt Templating & Reusability Report

## Systems Architecture Overview

In production RAG systems ("SiteSafe"), hardcoding prompt strings inside application route handlers or CLI scripts creates severe maintainability bottlenecks. A single wording adjustment (e.g. updating compliance citation rules or zero-hallucination guardrails) requires modifying multiple files across the backend.

This report documents the design, implementation, and verification of our decoupled, type-safe prompt management module located in [`backend/templates/`](file:///f:/desk/RAG/backend/templates).

---

## 1. Package Architecture & Separation of Concerns

```text
backend/
├── templates/
│   ├── __init__.py               # Exports templates & base classes
│   ├── base.py                   # Type-safe PromptTemplate engine & MissingTemplateVariableError
│   └── compliance_prompts.py     # Isolated prompt template definitions & constants
├── services/
│   └── verification_service.py   # Feature A: Real-time Online API service
├── cli/
│   └── batch_compliance_auditor.py # Feature B: Offline Batch CLI audit tool
└── test_prompt_templates.py      # Verification test suite & runner
```

### Core Design Principles:
1. **Zero Prompt Strings in Application Code**: Route handlers and CLI tools import pre-configured `PromptTemplate` objects instead of embedding multiline raw strings.
2. **Strict Required Variable Validation**: The `PromptTemplate.render(**kwargs)` method checks that all required placeholders exist prior to formatting, raising `MissingTemplateVariableError` if any mandatory parameter is missing.
3. **Immutability & Thread Safety**: Templates act as immutable definition blueprints; `.render(...)` generates new formatted strings dynamically without mutating original template instances.

---

## 2. Code Examples of Cross-Feature Prompt Reuse

### Shared System Persona Definition ([`templates/compliance_prompts.py`](file:///f:/desk/RAG/backend/templates/compliance_prompts.py))
```python
COMPLIANCE_SYSTEM_PROMPT_TEMPLATE = PromptTemplate(
    template_string=(
        "You are a Senior Building Code Compliance Officer on an active construction site.\n\n"
        "ROLE & REASONING POSTURE:\n"
        "- Evaluate field questions strictly using ONLY the provided statutory context chunks.\n"
        "- Cite exact sections, articles, and page numbers where available.\n"
        "- Maintain zero-hallucination posture. Do not speculate or extrapolate beyond provided text.\n\n"
        "FALLBACK RULE:\n"
        "If the governing rule is missing or ambiguous, output verbatim:\n"
        "\"VERDICT: AMBIGUOUS / INSUFFICIENT DATA. Governing regulation missing from provided context.\""
    ),
    required_vars=[]
)
```

### Feature A: Online API Service ([`services/verification_service.py`](file:///f:/desk/RAG/backend/services/verification_service.py))
```python
from templates.compliance_prompts import (
    COMPLIANCE_SYSTEM_PROMPT_TEMPLATE,
    FIELD_VERIFICATION_USER_PROMPT_TEMPLATE
)

def verify_field_question(trade: str, jurisdiction: str, context_chunks: str, engineer_query: str):
    system_prompt = COMPLIANCE_SYSTEM_PROMPT_TEMPLATE.render()
    user_prompt = FIELD_VERIFICATION_USER_PROMPT_TEMPLATE.render(
        trade=trade,
        jurisdiction=jurisdiction,
        context_chunks=context_chunks,
        engineer_query=engineer_query,
        format_instructions="\n--- OUTPUT FORMAT ---\nPlease respond with structured JSON."
    )
    return [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}]
```

### Feature B: Offline Batch CLI Auditor ([`cli/batch_compliance_auditor.py`](file:///f:/desk/RAG/backend/cli/batch_compliance_auditor.py))
```python
from templates.compliance_prompts import (
    COMPLIANCE_SYSTEM_PROMPT_TEMPLATE,
    BATCH_AUDIT_USER_PROMPT_TEMPLATE
)

def run_batch_audit(project_name: str, inspection_items: list, governing_code_context: str):
    system_prompt = COMPLIANCE_SYSTEM_PROMPT_TEMPLATE.render()
    user_prompt = BATCH_AUDIT_USER_PROMPT_TEMPLATE.render(
        project_name=project_name,
        governing_code_context=governing_code_context,
        inspection_log_items=formatted_items
    )
    return [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}]
```

---

## 3. Rendered Prompt Output Examples (Tasks 4 & 5)

### Example 1: Feature A (Online API Service Render Output)
```text
--- ACTIVE SITE FILTERS ---
- Trade: Exterior Enclosure & Fire Safety
- Jurisdiction: California (CBC / IBC 2021)

--- RETRIEVED STATUTORY CONTEXT CHUNKS ---
IBC 2021 Section 705.8: Exterior walls of Type V construction located less than 5 feet from the lot line shall have a minimum fire-resistance rating of 1 hour and must have 0% unprotected openings.

--- FIELD ENGINEER QUESTION ---
Can we install standard non-rated vinyl sliding windows on an exterior wall 4 feet from the property line?

--- OUTPUT FORMAT ---
Please respond with structured JSON containing 'verdict', 'answer', and 'citations'.
```

### Example 2: Feature B (Offline CLI Batch Audit Render Output)
```text
--- BATCH AUDIT PROJECT: Tower B Residential Complex ---

--- GOVERNING BUILDING CODES & TECHNICAL SPECIFICATIONS ---
IBC 2021 Section 705.8 & ACI 318-19 Table 19.3.2.1

--- PUNCH-LIST INSPECTION ITEMS TO AUDIT ---
- Item ID: PL-101 | Location: Gridline A / Wall 4 | Finding: Vinyl sliding window installed at 4-ft setback without fire rating.
- Item ID: PL-102 | Location: Tower B North Shear Wall | Finding: Rebar spacing measured at 12 inches vs 8-inch spec requirement.

INSTRUCTIONS FOR AUDITOR:
For each item above, evaluate compliance against the governing codes. Output an itemized compliance breakdown listing item ID, status (Compliant/Non-Compliant/Ambiguous), and specific clause section.
```

---

## 4. Exception Validation Output

Executing `python backend/test_prompt_templates.py` verifies error catching when required variables are omitted:

```text
Attempting to render FIELD_VERIFICATION_USER_PROMPT_TEMPLATE without 'context_chunks'...
SUCCESSFULLY CAUGHT EXPECTED ERROR: Cannot render template. Missing required variable(s): context_chunks
```

---

## 5. Standardized Git Commit Message (Task 5)

```text
feat(templates): implement decoupled prompt templating engine and cross-feature reusability

- Create `backend/templates/base.py` with `PromptTemplate` engine and `MissingTemplateVariableError` validation
- Create `backend/templates/compliance_prompts.py` defining system persona, field verification, and batch audit templates
- Refactor `services/verification_service.py` (API service) and `cli/batch_compliance_auditor.py` (CLI tool) to reuse shared templates
- Add test suite `test_prompt_templates.py` verifying rendering, variable validation, and output formatting
- Document architecture and render outputs in `PROMPT_TEMPLATES_REPORT.md`
```
