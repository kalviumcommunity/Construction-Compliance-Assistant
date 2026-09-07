"""
Offline Batch Compliance Auditor CLI Tool (Feature B).
Simulates batch processing over historical punch-lists by reusing decoupled templates from templates.compliance_prompts.
"""

from typing import List, Dict, Any
from templates.compliance_prompts import (
    COMPLIANCE_SYSTEM_PROMPT_TEMPLATE,
    BATCH_AUDIT_USER_PROMPT_TEMPLATE
)


def run_batch_audit(project_name: str, inspection_items: List[Dict[str, str]], governing_code_context: str) -> Dict[str, Any]:
    """
    Renders batch audit user prompt dynamically at runtime reusing shared template definitions.
    """
    system_prompt = COMPLIANCE_SYSTEM_PROMPT_TEMPLATE.render()

    formatted_items = ""
    for item in inspection_items:
        formatted_items += f"- Item ID: {item['id']} | Location: {item['location']} | Finding: {item['finding']}\n"

    user_prompt = BATCH_AUDIT_USER_PROMPT_TEMPLATE.render(
        project_name=project_name,
        governing_code_context=governing_code_context,
        inspection_log_items=formatted_items.strip()
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    return {
        "service": "batch_compliance_auditor (Feature B - CLI)",
        "status": "BATCH_PROMPT_RENDERED_SUCCESSFULLY",
        "item_count": len(inspection_items),
        "payload": messages
    }
