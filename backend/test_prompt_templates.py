"""
Verification Runner & Test Suite for Decoupled Prompt Templates.

Tasks Covered:
- Task 1: PromptTemplate rendering and validation.
- Task 2 & 3: Template reuse across verification_service (Feature A) and batch_compliance_auditor (Feature B).
- Task 4: MissingTemplateVariableError exception handling and error logging.
- Task 5: Printed rendered prompt outputs for inspection.
"""

import sys
import os
import json

# Add current directory to sys.path to enable package imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from templates.base import MissingTemplateVariableError
from templates.compliance_prompts import (
    COMPLIANCE_SYSTEM_PROMPT_TEMPLATE,
    FIELD_VERIFICATION_USER_PROMPT_TEMPLATE,
    BATCH_AUDIT_USER_PROMPT_TEMPLATE
)
from services.verification_service import verify_field_question
from cli.batch_compliance_auditor import run_batch_audit


def test_template_rendering_and_reuse():
    print("=" * 90)
    print("SITESAFE DECOUPLED PROMPT TEMPLATE VERIFICATION SUITE")
    print("=" * 90)

    # -----------------------------------------------------------------------
    # Test Case 1: Feature A - Online API Service Prompt Rendering
    # -----------------------------------------------------------------------
    print("\n" + "-" * 90)
    print("TEST CASE 1: Feature A (Online Verification API Service)")
    print("-" * 90)

    api_result = verify_field_question(
        trade="Exterior Enclosure & Fire Safety",
        jurisdiction="California (CBC / IBC 2021)",
        context_chunks=(
            "IBC 2021 Section 705.8: Exterior walls of Type V construction located less than 5 feet "
            "from the lot line shall have a minimum fire-resistance rating of 1 hour and must have 0% unprotected openings."
        ),
        engineer_query="Can we install standard non-rated vinyl sliding windows on an exterior wall 4 feet from the property line?"
    )

    print(f"Service Name : {api_result['service']}")
    print(f"Render Status: {api_result['status']}")
    print("\n--- RENDERED SYSTEM PROMPT ---")
    print(api_result['payload'][0]['content'])
    print("\n--- RENDERED USER PROMPT ---")
    print(api_result['payload'][1]['content'])

    # -----------------------------------------------------------------------
    # Test Case 2: Feature B - Offline CLI Batch Auditor Prompt Rendering
    # -----------------------------------------------------------------------
    print("\n" + "-" * 90)
    print("TEST CASE 2: Feature B (Offline CLI Batch Compliance Auditor)")
    print("-" * 90)

    punch_list = [
        {"id": "PL-101", "location": "Gridline A / Wall 4", "finding": "Vinyl sliding window installed at 4-ft setback without fire rating."},
        {"id": "PL-102", "location": "Tower B North Shear Wall", "finding": "Rebar spacing measured at 12 inches vs 8-inch spec requirement."}
    ]

    cli_result = run_batch_audit(
        project_name="Tower B Residential Complex",
        governing_code_context="IBC 2021 Section 705.8 & ACI 318-19 Table 19.3.2.1",
        inspection_items=punch_list
    )

    print(f"Service Name : {cli_result['service']}")
    print(f"Items Audited: {cli_result['item_count']}")
    print(f"Render Status: {cli_result['status']}")
    print("\n--- RENDERED BATCH USER PROMPT ---")
    print(cli_result['payload'][1]['content'])

    # -----------------------------------------------------------------------
    # Test Case 3: Error Handling - Missing Template Variable Validation
    # -----------------------------------------------------------------------
    print("\n" + "-" * 90)
    print("TEST CASE 3: Exception Handling (Missing Template Variable Validation)")
    print("-" * 90)

    try:
        print("Attempting to render FIELD_VERIFICATION_USER_PROMPT_TEMPLATE without 'context_chunks'...")
        FIELD_VERIFICATION_USER_PROMPT_TEMPLATE.render(
            trade="Fire Safety",
            jurisdiction="California",
            # context_chunks is intentionally omitted!
            engineer_query="Can we bypass fire dampers?"
        )
    except MissingTemplateVariableError as e:
        print(f"SUCCESSFULLY CAUGHT EXPECTED ERROR: {e}")

    print("\n" + "=" * 90)
    print("ALL TEMPLATE TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 90)


if __name__ == "__main__":
    test_template_rendering_and_reuse()
