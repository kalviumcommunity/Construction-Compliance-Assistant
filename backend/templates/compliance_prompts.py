"""
Compliance Prompt Templates Definition.
Defines isolated, reusable templates for system persona, single field queries, and batch audit tools.
"""

from .base import PromptTemplate

# ---------------------------------------------------------------------------
# System Persona Prompt Template
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Single Field Verification User Prompt Template (Feature A: Online API Service)
# ---------------------------------------------------------------------------

FIELD_VERIFICATION_USER_PROMPT_TEMPLATE = PromptTemplate(
    template_string=(
        "--- ACTIVE SITE FILTERS ---\n"
        "- Trade: {trade}\n"
        "- Jurisdiction: {jurisdiction}\n\n"
        "--- RETRIEVED STATUTORY CONTEXT CHUNKS ---\n"
        "{context_chunks}\n\n"
        "--- FIELD ENGINEER QUESTION ---\n"
        "{engineer_query}\n"
        "{format_instructions}"
    ),
    required_vars=["trade", "jurisdiction", "context_chunks", "engineer_query"],
    optional_vars=["format_instructions"]
)


# ---------------------------------------------------------------------------
# Batch Audit User Prompt Template (Feature B: Offline CLI Audit Tool)
# ---------------------------------------------------------------------------

BATCH_AUDIT_USER_PROMPT_TEMPLATE = PromptTemplate(
    template_string=(
        "--- BATCH AUDIT PROJECT: {project_name} ---\n\n"
        "--- GOVERNING BUILDING CODES & TECHNICAL SPECIFICATIONS ---\n"
        "{governing_code_context}\n\n"
        "--- PUNCH-LIST INSPECTION ITEMS TO AUDIT ---\n"
        "{inspection_log_items}\n\n"
        "INSTRUCTIONS FOR AUDITOR:\n"
        "For each item above, evaluate compliance against the governing codes. "
        "Output an itemized compliance breakdown listing item ID, status (Compliant/Non-Compliant/Ambiguous), "
        "and specific clause section."
    ),
    required_vars=["project_name", "inspection_log_items", "governing_code_context"]
)
