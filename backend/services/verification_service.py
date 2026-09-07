"""
Online Field Verification Service (Feature A).
Simulates real-time HTTP request handling (FastAPI / Next.js backend) by reusing
decoupled templates from templates.compliance_prompts.
"""

from typing import Dict, Any
from templates.compliance_prompts import (
    COMPLIANCE_SYSTEM_PROMPT_TEMPLATE,
    FIELD_VERIFICATION_USER_PROMPT_TEMPLATE
)


def verify_field_question(trade: str, jurisdiction: str, context_chunks: str, engineer_query: str) -> Dict[str, Any]:
    """
    Renders prompt payload dynamically at runtime using shared template definitions
    and simulates LLM API invocation.
    """
    system_prompt = COMPLIANCE_SYSTEM_PROMPT_TEMPLATE.render()
    user_prompt = FIELD_VERIFICATION_USER_PROMPT_TEMPLATE.render(
        trade=trade,
        jurisdiction=jurisdiction,
        context_chunks=context_chunks,
        engineer_query=engineer_query,
        format_instructions="\n--- OUTPUT FORMAT ---\nPlease respond with structured JSON containing 'verdict', 'answer', and 'citations'."
    )

    # Simulated LLM invocation payload
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    return {
        "service": "verification_service (Feature A)",
        "status": "PROMPT_RENDERED_SUCCESSFULLY",
        "payload": messages
    }
