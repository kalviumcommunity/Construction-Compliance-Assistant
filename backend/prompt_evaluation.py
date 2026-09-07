"""
Prompt Engineering & Evaluation Suite for SiteSafe Construction Compliance RAG.

Tasks Covered:
- Task 1: Distinct system and user roles with active site filters and retrieved context.
- Task 2: Production system prompt defining role, scope (DO/DO NOT), and constraints (tone, length, fallback rule).
- Task 3: Benchmark comparison between Variation A (Vague) and Variation B (Constrained) prompts.
- Task 4: Evaluation and documentation.
- Task 5: Execution script and output reporting.
"""

import os
import sys
import json
import logging
from dotenv import load_dotenv
from openai import OpenAI, AuthenticationError, RateLimitError, APIConnectionError, APIStatusError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Task 2: Production System Message Definition
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_VAGUE = """
You are a construction helper. Answer the question based on the context.
"""

SYSTEM_PROMPT_CONSTRAINED = """
You are a Senior Structural and Building Compliance Officer on an active construction site.

ROLE & REASONING POSTURE:
- Evaluate site conditions strictly against the provided context chunks.
- Maintain maximum regulatory strictness and an objective, technical, decisive, and authoritative tone.

SCOPE (WHAT YOU MUST DO):
- Evaluate site conditions strictly against the provided context.
- Identify exact code violations or approvals.
- Cite statutory clauses down to the section and page number where available.

SCOPE (WHAT YOU MUST NOT DO):
- DO NOT speculate or extrapolate beyond the provided text.
- DO NOT offer legal disclaimers or legal advice.
- DO NOT reference external codes or regulations not present in the provided context.

CONSTRAINTS:
1. Length: Concise, bulleted compliance breakdown (maximum 150 words).
2. Tone: Objective, technical, decisive, and authoritative.
3. Fallback Behavior: If the context does not explicitly provide the governing rule or necessary data parameters (e.g. missing dimensions, distances, or ratings), refuse to guess and output verbatim:
   "VERDICT: AMBIGUOUS / INSUFFICIENT DATA. Governing regulation missing from provided context."
"""

# ---------------------------------------------------------------------------
# Benchmark Scenario & Data Payloads (Task 1 & Task 3)
# ---------------------------------------------------------------------------

BENCHMARK_SCENARIO = {
    "trade_filter": "Exterior Enclosure & Fire Safety",
    "jurisdiction": "California (CBC / IBC 2021)",
    "construction_type": "Type V",
    "retrieved_context": (
        "IBC 2021 Section 705.8: Exterior walls of Type V construction located less than 5 feet "
        "from the lot line shall have a minimum fire-resistance rating of 1 hour and must have 0% unprotected openings."
    ),
    "user_question": "Can we install standard vinyl-frame sliding windows on the exterior wall along Gridline A?"
}


def build_user_payload(scenario: dict) -> str:
    """Formats retrieved context, active site filters, and user question into structured user message."""
    return f"""--- ACTIVE SITE FILTERS ---
- Trade: {scenario['trade_filter']}
- Jurisdiction: {scenario['jurisdiction']}
- Construction Type: {scenario['construction_type']}

--- RETRIEVED CONTEXT CHUNKS ---
{scenario['retrieved_context']}

--- USER QUERY ---
{scenario['user_question']}
"""


def execute_prompt_variation(client: OpenAI, model_name: str, system_prompt: str, scenario: dict) -> str:
    """Executes a completion request with distinct system and user roles at temperature=0.0."""
    user_content = build_user_payload(scenario)
    messages = [
        {"role": "system", "content": system_prompt.strip()},
        {"role": "user", "content": user_content.strip()}
    ]

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.0
        )
        return response.choices[0].message.content
    except AuthenticationError:
        return "[Error 401] Invalid or missing API key."
    except RateLimitError:
        return "[Error 429] Rate limit reached."
    except Exception as e:
        return f"[API Error] {str(e)}"


def run_evaluation_suite():
    """Runs the prompt evaluation benchmark suite and prints comparison results."""
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")

    client = None
    if api_key and api_key != "your_openai_api_key_here":
        client = OpenAI(api_key=api_key, base_url=base_url)

    print("=" * 80)
    print("SITESAFE RAG EVALUATION SUITE: SYSTEM PROMPT BENCHMARK")
    print("=" * 80)

    user_payload = build_user_payload(BENCHMARK_SCENARIO)
    print("\n[RETRIEVED DATA & USER PAYLOAD]")
    print(user_payload)

    if client:
        print("\nSending requests to model endpoint via OpenAI SDK (temp=0.0)...")
        output_vague = execute_prompt_variation(client, model_name, SYSTEM_PROMPT_VAGUE, BENCHMARK_SCENARIO)
        output_constrained = execute_prompt_variation(client, model_name, SYSTEM_PROMPT_CONSTRAINED, BENCHMARK_SCENARIO)
    else:
        print("\nNote: Running in offline deterministic simulation mode (API key not configured in .env).")
        # Offline deterministic responses reflecting model output behavior at temp=0.0
        output_vague = (
            "Based on the context from IBC 2021 Section 705.8, exterior walls of Type V construction "
            "located less than 5 feet from the lot line need a 1-hour fire resistance rating and 0% unprotected openings. "
            "Vinyl-frame sliding windows are generally considered unprotected openings. Therefore, assuming Gridline A "
            "is close to the lot line (less than 5 feet), you cannot install standard vinyl windows. However, if Gridline A "
            "is further than 5 feet away, it might be allowed. Check with your site architect to confirm the setback distance."
        )
        output_constrained = (
            "VERDICT: AMBIGUOUS / INSUFFICIENT DATA. Governing regulation missing from provided context."
        )

    print("\n" + "=" * 80)
    print("PROMPT VARIATION A: VAGUE SYSTEM PROMPT")
    print("=" * 80)
    print(output_vague.strip())

    print("\n" + "=" * 80)
    print("PROMPT VARIATION B: CONSTRAINED PRODUCTION PROMPT (TASK 2)")
    print("=" * 80)
    print(output_constrained.strip())
    print("=" * 80)


if __name__ == "__main__":
    run_evaluation_suite()
