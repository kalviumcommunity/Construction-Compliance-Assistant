"""
Token Profiling & Cost Estimation Engine for SiteSafe Construction Compliance RAG.

Tasks Covered:
- Task 1 & 2: Token counting across 3 varying corpus samples (Short Query, Context Paragraph, Full Spec Doc).
- Task 3: Cost estimation engine (input/output pricing for GPT-4o and GPT-4o-mini, 500 queries/day projection).
- Task 4: Character-to-token ratio discrepancy analysis across natural prose, technical codes, and JSON payloads.
- Task 5: Formatted CLI runner and report generation support.
"""

import sys
import json
import tiktoken

# ---------------------------------------------------------------------------
# Pricing Constants (per 1,000,000 tokens)
# ---------------------------------------------------------------------------
MODEL_PRICING = {
    "gpt-4o": {
        "input_per_1m": 2.50,
        "output_per_1m": 10.00
    },
    "gpt-4o-mini": {
        "input_per_1m": 0.15,
        "output_per_1m": 0.60
    }
}

# Initialize encoding (cl100k_base or o200k_base if available)
try:
    ENCODING = tiktoken.get_encoding("o200k_base")
    ENCODING_NAME = "o200k_base (GPT-4o)"
except Exception:
    ENCODING = tiktoken.get_encoding("cl100k_base")
    ENCODING_NAME = "cl100k_base (GPT-4 / GPT-3.5)"


# ---------------------------------------------------------------------------
# Task 1 & 2 Data Samples
# ---------------------------------------------------------------------------

SAMPLE_1_SHORT_QUERY = (
    "Can we install standard vinyl-frame sliding windows on a Type V exterior wall "
    "4 feet from the property line?"
)

SAMPLE_2_CONTEXT_PARAGRAPH = (
    "IBC 2021 Section 705.8 - Openings in Exterior Walls: Building exterior walls located less "
    "than 5 feet (1524 mm) from the property line shall have a fire-resistance rating of not less than "
    "1 hour in accordance with Table 601 for Type V-A or V-B construction. Openings in exterior walls "
    "with a fire separation distance of 0 to less than 3 feet shall have 0% allowable area of unprotected "
    "openings. For fire separation distances from 3 feet to less than 5 feet, allowable unprotected openings "
    "shall not exceed 15% of the wall area, provided opening protective assemblies comply with Section 716.5 "
    "and carry a minimum 45-minute fire-protection rating."
)

SAMPLE_3_FULL_SPECIFICATION = (
    "SECTION 03 30 00 - CAST-IN-PLACE CONCRETE\n\n"
    "PART 1 - GENERAL\n"
    "1.1 SECTION INCLUDES\n"
    "A. Structural concrete footings, foundation walls, grade beams, elevated slabs-on-grade, and concrete shear walls.\n"
    "B. Specifying concrete mix designs, compressive strengths, slump tolerances, maximum water-cementitious ratios, "
    "and field curing procedures in accordance with ACI 301-20 and ACI 318-19.\n\n"
    "1.2 PERFORMANCE REQUIREMENTS & CODES\n"
    "A. American Concrete Institute (ACI):\n"
    "   1. ACI 301-20: Specifications for Structural Concrete.\n"
    "   2. ACI 318-19: Building Code Requirements for Structural Concrete.\n"
    "   3. ACI 305.1-14: Specification for Hot Weather Concreting.\n"
    "   4. ACI 306.1-90: Standard Specification for Cold Weather Concreting.\n"
    "B. ASTM International Standards:\n"
    "   1. ASTM C33/C33M-18: Standard Specification for Concrete Aggregates.\n"
    "   2. ASTM C94/C94M-21a: Standard Specification for Ready-Mixed Concrete.\n"
    "   3. ASTM C150/C150M-20: Standard Specification for Portland Cement Type I/II/V.\n"
    "   4. ASTM C494/C494M-19: Standard Specification for Chemical Admixtures for Concrete.\n\n"
    "PART 2 - PRODUCTS & MIX DESIGNS\n"
    "2.1 CONCRETE MIX CLASSES\n"
    "A. Class A Footings & Grade Beams:\n"
    "   - Specified Compressive Strength (f'c): 4,000 psi at 28 days.\n"
    "   - Maximum Water-Cementitious Materials Ratio (w/cm): 0.45.\n"
    "   - Slump Range: 4 inches +/- 1 inch at placement.\n"
    "   - Air Content: 4.5% to 6.5% for freeze-thaw exposure Class F1.\n"
    "B. Class B Elevated Slabs & Columns:\n"
    "   - Specified Compressive Strength (f'c): 5,000 psi at 28 days.\n"
    "   - Maximum Water-Cementitious Materials Ratio (w/cm): 0.40.\n"
    "   - Slump Range: 3 to 5 inches, or up to 8 inches when high-range water-reducing admixture (superplasticizer) ASTM C494 Type F is used.\n\n"
    "PART 3 - EXECUTION & FIELD QUALITY CONTROL\n"
    "3.1 PLACEMENT & CONSOLIDATION\n"
    "A. Do not place concrete until rebar inspection, formwork approval, and embedments have been signed off by the Special Inspector.\n"
    "B. Deposit concrete continuously to prevent cold joints. Consolidate concrete using internal mechanical vibrators complying with ACI 309R.\n"
    "C. Maximum allowable free fall drop height for unconfined concrete placement shall not exceed 5 feet to prevent aggregate segregation.\n\n"
    "3.2 CURING & TESTING\n"
    "A. Moist cure unformed surfaces for a minimum continuous duration of 7 days in accordance with ACI 308.1.\n"
    "B. Field Testing Agency shall perform 1 slump test (ASTM C143), 1 air content test (ASTM C231), and cast 1 set of 4 compressive cylinder samples (ASTM C31) for every 50 cubic yards of concrete placed."
)


def profile_text(text: str) -> dict:
    """Calculates character count, word count, token count, and char/token ratio for a text block."""
    char_count = len(text)
    word_count = len(text.split())
    tokens = ENCODING.encode(text)
    token_count = len(tokens)
    char_per_token = round(char_count / token_count, 2) if token_count > 0 else 0.0
    tokens_per_word = round(token_count / word_count, 2) if word_count > 0 else 0.0

    return {
        "char_count": char_count,
        "word_count": word_count,
        "token_count": token_count,
        "char_per_token": char_per_token,
        "tokens_per_word": tokens_per_word
    }


# ---------------------------------------------------------------------------
# Task 3: Cost Estimation Engine
# ---------------------------------------------------------------------------

def calculate_query_cost(input_tokens: int, estimated_output_tokens: int, model_name: str) -> dict:
    """Calculates single query cost for input and output tokens for a specified model."""
    pricing = MODEL_PRICING.get(model_name.lower())
    if not pricing:
        raise ValueError(f"Unknown model name: {model_name}")

    input_cost = (input_tokens / 1_000_000) * pricing["input_per_1m"]
    output_cost = (estimated_output_tokens / 1_000_000) * pricing["output_per_1m"]
    total_cost = input_cost + output_cost

    return {
        "model": model_name,
        "input_cost": round(input_cost, 6),
        "output_cost": round(output_cost, 6),
        "total_cost": round(total_cost, 6)
    }


def project_monthly_cost(daily_queries: int, avg_input_tokens_per_query: int, avg_output_tokens_per_query: int, model_name: str) -> dict:
    """Projects daily and monthly (30-day) cost for a query workload volume."""
    single_query = calculate_query_cost(avg_input_tokens_per_query, avg_output_tokens_per_query, model_name)
    daily_input_tokens = daily_queries * avg_input_tokens_per_query
    daily_output_tokens = daily_queries * avg_output_tokens_per_query

    daily_cost = single_query["total_cost"] * daily_queries
    monthly_cost = daily_cost * 30

    return {
        "model": model_name,
        "daily_queries": daily_queries,
        "daily_input_tokens": daily_input_tokens,
        "daily_output_tokens": daily_output_tokens,
        "single_query_cost": single_query["total_cost"],
        "daily_cost": round(daily_cost, 4),
        "monthly_cost": round(monthly_cost, 2)
    }


# ---------------------------------------------------------------------------
# Task 4: Character-to-Token Ratio Discrepancy Micro-Samples
# ---------------------------------------------------------------------------

MICRO_SAMPLE_PROSE = (
    "The site supervisor verified that all safety harnesses were inspected and securely fastened before work began."
)

MICRO_SAMPLE_TECHNICAL = (
    "ASTM C150/C150M-20 Type II/V; IBC §705.8.1; ACI 318-19 Table 19.3.2.1"
)

MICRO_SAMPLE_JSON = json.dumps({
    "compliance_verdict": "APPROVED_WITH_CONDITIONS",
    "section_ref": "IBC_2021_705.8.1",
    "setback_ft": 4.5,
    "max_unprotected_opening_pct": 15.0,
    "required_fire_rating_hr": 1.0,
    "special_inspection_req": True
}, indent=2)


# ---------------------------------------------------------------------------
# CLI Printing & Main Runner
# ---------------------------------------------------------------------------

def run_token_cost_analysis():
    print("=" * 85)
    print(f"SITESAFE RAG TOKEN PROFILING & COST ESTIMATION ENGINE (Encoding: {ENCODING_NAME})")
    print("=" * 85)

    # -----------------------------------------------------------------------
    # Task 1 & 2 Results
    # -----------------------------------------------------------------------
    print("\n" + "-" * 85)
    print("TASK 1 & 2: CORPUS SAMPLE TOKEN PROFILING")
    print("-" * 85)

    samples = [
        ("Sample 1: Short Site Engineer Query", SAMPLE_1_SHORT_QUERY),
        ("Sample 2: Retrieved Context Paragraph (IBC Section 705.8)", SAMPLE_2_CONTEXT_PARAGRAPH),
        ("Sample 3: Full Document Spec (Section 03 30 00 Concrete)", SAMPLE_3_FULL_SPECIFICATION)
    ]

    header_fmt = "{:<55} | {:<7} | {:<7} | {:<8} | {:<10}"
    row_fmt = "{:<55} | {:<7} | {:<7} | {:<8} | {:<10}"
    print(header_fmt.format("Corpus Tier / Sample Description", "Chars", "Words", "Tokens", "Char/Token"))
    print("-" * 95)

    for label, text in samples:
        metrics = profile_text(text)
        print(row_fmt.format(
            label[:55],
            metrics["char_count"],
            metrics["word_count"],
            metrics["token_count"],
            f"{metrics['char_per_token']:.2f}"
        ))

    # -----------------------------------------------------------------------
    # Task 3 Results
    # -----------------------------------------------------------------------
    print("\n" + "-" * 85)
    print("TASK 3: COST ESTIMATION ENGINE & 500 QUERIES/DAY PROJECTION (30-DAY MONTH)")
    print("-" * 85)
    print("Simulation Workload: 500 queries/day | 1,500 input tokens/query | 250 output tokens/query\n")

    cost_fmt = "{:<15} | {:<14} | {:<14} | {:<14} | {:<14}"
    print(cost_fmt.format("Model Name", "Input $/1M", "Output $/1M", "Daily Cost ($)", "Monthly Cost ($)"))
    print("-" * 85)

    for model in ["gpt-4o", "gpt-4o-mini"]:
        proj = project_monthly_cost(
            daily_queries=500,
            avg_input_tokens_per_query=1500,
            avg_output_tokens_per_query=250,
            model_name=model
        )
        pricing = MODEL_PRICING[model]
        print(cost_fmt.format(
            model.upper(),
            f"${pricing['input_per_1m']:.2f}",
            f"${pricing['output_per_1m']:.2f}",
            f"${proj['daily_cost']:.4f}",
            f"${proj['monthly_cost']:.2f}"
        ))

    # -----------------------------------------------------------------------
    # Task 4 Results
    # -----------------------------------------------------------------------
    print("\n" + "-" * 85)
    print("TASK 4: CHARACTER-TO-TOKEN RATIO DISCREPANCY COMPARISON")
    print("-" * 85)

    micro_samples = [
        ("1. Standard English Prose", MICRO_SAMPLE_PROSE),
        ("2. Technical Alphanumeric Code String", MICRO_SAMPLE_TECHNICAL),
        ("3. Minified JSON Response Payload", MICRO_SAMPLE_JSON)
    ]

    micro_fmt = "{:<40} | {:<6} | {:<6} | {:<7} | {:<10} | {:<11}"
    print(micro_fmt.format("Text Complexity Category", "Chars", "Words", "Tokens", "Char/Token", "Tokens/Word"))
    print("-" * 92)

    for label, text in micro_samples:
        m = profile_text(text)
        print(micro_fmt.format(
            label[:40],
            m["char_count"],
            m["word_count"],
            m["token_count"],
            f"{m['char_per_token']:.2f}",
            f"{m['tokens_per_word']:.2f}"
        ))

    print("=" * 85)


if __name__ == "__main__":
    run_token_cost_analysis()
