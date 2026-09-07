"""
SiteSafe Prompt Templates Package.
"""
from .base import PromptTemplate, MissingTemplateVariableError
from .compliance_prompts import (
    COMPLIANCE_SYSTEM_PROMPT_TEMPLATE,
    FIELD_VERIFICATION_USER_PROMPT_TEMPLATE,
    BATCH_AUDIT_USER_PROMPT_TEMPLATE
)

__all__ = [
    "PromptTemplate",
    "MissingTemplateVariableError",
    "COMPLIANCE_SYSTEM_PROMPT_TEMPLATE",
    "FIELD_VERIFICATION_USER_PROMPT_TEMPLATE",
    "BATCH_AUDIT_USER_PROMPT_TEMPLATE"
]
