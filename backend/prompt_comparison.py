"""
Prompt Engineering & Comparison Script for Construction Compliance Assistant.

Tasks Covered:
- Task 1: Distinct system and user roles.
- Task 2: Robust system message specifying role, scope, constraints (tone, length, safety fallback).
- Task 3: Head-to-head comparison of Prompt Variations (Vague vs. Structured/Constrained).
- Task 4: Evaluation and documentation of outputs.
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
# Prompt Definitions (Task 2 & Task 3)
# ---------------------------------------------------------------------------

# Variation A: Vague / Baseline Prompt
SYSTEM_PROMPT_VAGUE = """
You are a helpful AI assistant for a construction company. Answer questions that staff members ask.
"""

# Variation B: Constrained & Structured System Prompt (Role, Scope, Constraints & Fallbacks)
SYSTEM_PROMPT_STRUCTURED = """
You are the Construction Compliance Assistant, an internal specialist supporting site supervisors, safety managers, and field staff.

ROLE & PURPOSE:
- Provide accurate, concise, and actionable guidance on building regulations, safety standards (e.g., OSHA, local building codes), and construction site protocols.

SCOPE & BEHAVIOR:
- DO: Focus strictly on construction compliance, structural safety, environmental standards, and standard operational procedures.
- DO NOT: Provide legal counsel, financial advice, architectural sign-offs, or speculate beyond established regulatory safety practices.

CONSTRAINTS:
1. Tone: Professional, authoritative, yet approachable for on-site personnel.
2. Length: Keep responses under 150 words unless detailed multi-step procedures are explicitly requested.
3. Formatting: Use bullet points for checklists/actionable steps and bold key regulations.
4. Fallback Rule: If a query falls outside construction compliance or if information is ambiguous/unsafe, reply with:
   "I cannot provide guidance on this matter as it falls outside certified construction compliance standards. Please consult your Project Safety Officer or Legal Team."
"""

# Test Scenarios / User Questions
EVALUATION_QUESTIONS = [
    {
        "id": "scenario_1_safety_checklist",
        "category": "In-Scope Core Compliance",
        "question": "What are the mandatory PPE and safety precautions required before entering a deep trench excavation on site?"
    },
    {
        "id": "scenario_2_out_of_scope_fallback",
        "category": "Out-of-Scope / Fallback Test",
        "question": "Can you advise whether our subcontractor's contract breach lets us withhold payment without legal liability?"
    }
]


def execute_prompt_variation(client: OpenAI, model_name: str, system_prompt: str, user_question: str) -> str:
    """Executes a single chat completion with distinct system and user roles."""
    messages = [
        {"role": "system", "content": system_prompt.strip()},
        {"role": "user", "content": user_question.strip()}
    ]

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.3  # Lower temperature for deterministic, compliance-safe answers
        )
        return response.choices[0].message.content
    except AuthenticationError:
        return "[Error 401] Invalid or missing API key."
    except RateLimitError:
        return "[Error 429] Rate limit reached."
    except Exception as e:
        return f"[API Error] {str(e)}"


def run_prompt_comparison():
    """Runs comparison between Vague and Structured prompts across test questions."""
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo")

    client = None
    if api_key and api_key != "your_openai_api_key_here":
        client = OpenAI(api_key=api_key, base_url=base_url)

    print("=" * 80)
    print("PROMPT EVALUATION & COMPARISON SUITE")
    print("=" * 80)

    for item in EVALUATION_QUESTIONS:
        q_id = item["id"]
        category = item["category"]
        question = item["question"]

        print(f"\n[Category: {category}]")
        print(f"User Question: \"{question}\"\n")

        if client:
            output_vague = execute_prompt_variation(client, model_name, SYSTEM_PROMPT_VAGUE, question)
            output_structured = execute_prompt_variation(client, model_name, SYSTEM_PROMPT_STRUCTURED, question)
        else:
            print("Note: Running in offline simulation mode (API key not configured in .env).")
            # Deterministic simulation reflecting model outputs
            if q_id == "scenario_1_safety_checklist":
                output_vague = (
                    "When entering a deep trench excavation, workers must wear hard hats, safety boots, high-visibility vests, "
                    "and safety glasses. You should also ensure the trench is inspected by a competent person, test for hazardous atmospheres, "
                    "provide a ladder or ramp within 25 feet for exit, and use trench boxes, shoring, or sloping to prevent cave-ins."
                )
                output_structured = (
                    "**Mandatory Trench Excavation Safety Protocol (OSHA Compliant)**\n\n"
                    "**Required PPE:**\n"
                    "- Hard hat (**ANSI Z89.1**)\n"
                    "- Steel-toe boots (**ASTM F2413**)\n"
                    "- High-visibility vest & protective eyewear\n\n"
                    "**Required Precautions (5+ ft depth):**\n"
                    "- **Cave-in Protection:** Protective system (sloping, shoring, or trench shield).\n"
                    "- **Access/Egress:** Ladder/ramp located within 25 lateral feet of all workers.\n"
                    "- **Atmospheric Testing:** Pre-entry test for oxygen deficiency or hazardous gases.\n"
                    "- **Daily Inspection:** Completed by a designated Competent Person prior to entry."
                )
            else:
                output_vague = (
                    "Contract law usually allows withholding payments if the contract includes a specific pay-when-paid or retainage clause, "
                    "or if the breach is material. You should review the termination for cause section of the agreement."
                )
                output_structured = (
                    "I cannot provide guidance on this matter as it falls outside certified construction compliance standards. "
                    "Please consult your Project Safety Officer or Legal Team."
                )

        print("-" * 40)
        print("VARIATION A (Vague System Prompt) Output:")
        print("-" * 40)
        print(output_vague.strip())

        print("\n" + "-" * 40)
        print("VARIATION B (Structured System Prompt) Output:")
        print("-" * 40)
        print(output_structured.strip())
        print("=" * 80)


if __name__ == "__main__":
    run_prompt_comparison()
