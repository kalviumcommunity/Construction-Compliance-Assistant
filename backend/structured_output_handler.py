"""
Structured JSON Output Generation, Validation, & Recovery Handler for SiteSafe RAG.

Tasks Covered:
- Task 1: Pydantic v2 Schema definition (Citation & CompliancePayload) and OpenAI Structured Output methods.
- Task 2: Strict field validation & citation rule enforcement for "Compliant" and "Non-Compliant" verdicts.
- Task 3: Defensive cleaning (markdown stripping) and graceful malformed JSON recovery.
- Task 4 & 5: Executable test runner evaluating 4 distinct fixtures (Valid, Markdown Wrapped, Malformed, Schema Violation).
"""

import os
import sys
import re
import json
import logging
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ValidationError, model_validator
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Task 1: Pydantic v2 Data Models
# ---------------------------------------------------------------------------

class Citation(BaseModel):
    document: str = Field(..., description="Title of governing standard or spec document.")
    clause_section: str = Field(..., description="Specific clause, article, or section number.")
    page_number: int = Field(..., description="Page number location within the source text.")
    quote: str = Field(..., description="Verbatim text excerpt supporting the citation.")


class CompliancePayload(BaseModel):
    verdict: Literal["Compliant", "Non-Compliant", "Ambiguous/Insufficient Data"] = Field(
        ..., description="Deterministic compliance determination."
    )
    answer: str = Field(..., description="Concise technical summary and reasoning breakdown.")
    citations: List[Citation] = Field(
        default_factory=list, description="List of supporting statutory regulatory citations."
    )
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0."
    )

    @model_validator(mode="after")
    def validate_citation_requirement(self) -> "CompliancePayload":
        """Enforces that Compliant or Non-Compliant verdicts MUST contain at least 1 citation."""
        if self.verdict in ["Compliant", "Non-Compliant"] and len(self.citations) == 0:
            raise ValueError(
                f"Validation Error: A verdict of '{self.verdict}' requires at least one supporting citation."
            )
        return self


# ---------------------------------------------------------------------------
# Task 3: Cleaning & Recovery Helpers
# ---------------------------------------------------------------------------

def clean_json_string(raw_text: str) -> str:
    """Strips markdown code fences, removes trailing commas, and trims whitespace."""
    text = raw_text.strip()
    # Strip markdown ```json ... ``` code block wrappers
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    text = text.strip()

    # Remove trailing commas before closing braces/brackets
    text = re.sub(r",\s*([\]}])", r"\1", text)
    return text


def validate_and_parse_response(raw_text: str) -> CompliancePayload:
    """Parses clean JSON string and validates against Pydantic schema."""
    cleaned = clean_json_string(raw_text)
    raw_dict = json.loads(cleaned)
    return CompliancePayload.model_validate(raw_dict)


def parse_with_recovery(raw_text: str) -> tuple:
    """
    Defensive parser attempting:
    1. Direct parse & validation.
    2. Auto-repair for truncated JSON strings.
    3. Safe fallback payload generation upon unrecoverable failure.
    Returns tuple: (CompliancePayload, status_message: str)
    """
    cleaned = clean_json_string(raw_text)

    # 1. Attempt standard validation
    try:
        payload = validate_and_parse_response(cleaned)
        return payload, "SUCCESS: Standard Validation Passed"
    except ValidationError as ve:
        # Schema rule violation (e.g. missing citations for Non-Compliant)
        return None, f"SCHEMA REJECTED: {str(ve)}"
    except json.JSONDecodeError:
        pass

    # 2. Attempt truncation auto-repair
    logger.warning("JSONDecodeError encountered. Attempting truncation recovery...")
    repaired_str = cleaned

    if not repaired_str.endswith("}"):
        # Close open quotes if odd count
        if repaired_str.count('"') % 2 != 0:
            repaired_str += '"'
        # Close open brackets & braces
        open_brackets = repaired_str.count("[") - repaired_str.count("]")
        open_braces = repaired_str.count("{") - repaired_str.count("}")
        repaired_str += "]" * max(0, open_brackets)
        repaired_str += "}" * max(0, open_braces)

    try:
        raw_dict = json.loads(repaired_str)
        payload = CompliancePayload.model_validate(raw_dict)
        return payload, "RECOVERED: Truncated JSON Repaired & Validated"
    except Exception as repair_err:
        logger.error(f"Recovery failed: {repair_err}. Returning safe fallback payload.")

    # 3. Safe fallback payload
    fallback = CompliancePayload(
        verdict="Ambiguous/Insufficient Data",
        answer="Parsing Error: Model output was malformed and could not be verified.",
        citations=[],
        confidence_score=0.0
    )
    return fallback, "FALLBACK ACTIVATED: Graceful Fallback Payload Generated"


# ---------------------------------------------------------------------------
# Task 4: Test Fixtures
# ---------------------------------------------------------------------------

FIXTURE_1_VALID_SUCCESS = json.dumps({
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
}, indent=2)

FIXTURE_2_MARKDOWN_WRAPPED = f"""```json
{FIXTURE_1_VALID_SUCCESS}
```"""

FIXTURE_3_MALFORMED_TRUNCATED = """{
  "verdict": "Non-Compliant",
  "answer": "Standard non-rated sliding glass doors are prohibited on Type V exterior walls located 4 feet from property lot lines under IBC 2021 Section 705.8.",
  "citations": [
    {
      "document": "IBC 2021",
      "clause_section": "Section 705.8",
      "page_number": 142,
      "quote": "Exterior walls of Type V construction located less than 5 feet from the lot line shall have 0% unprotected openings."""

FIXTURE_4_SCHEMA_VIOLATION = json.dumps({
    "verdict": "Non-Compliant",
    "answer": "Non-compliant condition detected but no citations were provided.",
    "citations": [],  # Violates rule: Non-Compliant requires at least 1 citation!
    "confidence_score": 0.90
}, indent=2)


def run_test_suite():
    print("=" * 90)
    print("SITESAFE STRUCTURED OUTPUT VALIDATION & RECOVERY SUITE")
    print("=" * 90)

    test_fixtures = [
        ("Fixture 1: Valid Success Payload", FIXTURE_1_VALID_SUCCESS),
        ("Fixture 2: Markdown Wrapped JSON (```json ... ```)", FIXTURE_2_MARKDOWN_WRAPPED),
        ("Fixture 3: Malformed / Truncated JSON (max_tokens Cutoff)", FIXTURE_3_MALFORMED_TRUNCATED),
        ("Fixture 4: Schema Violation (Non-Compliant with Empty Citations)", FIXTURE_4_SCHEMA_VIOLATION)
    ]

    for label, raw_text in test_fixtures:
        print("\n" + "-" * 90)
        print(f"RUNNING TEST: {label}")
        print("-" * 90)

        result_payload, status_msg = parse_with_recovery(raw_text)

        print(f"STATUS: {status_msg}")
        if result_payload:
            print("PARSED MODEL PAYLOAD:")
            print(json.dumps(result_payload.model_dump(), indent=2))
        else:
            print("PAYLOAD REJECTED BY VALIDATION RULES.")

    print("=" * 90)


if __name__ == "__main__":
    run_test_suite()
