"""
Multi-Turn History Management & Pre-Flight Token Budgeting Engine for SiteSafe RAG.

Tasks Covered:
- Task 1 & 2: ChatMessage structure and exact token measurement via tiktoken (with protocol overhead).
- Task 3: Context Budgeting engine (Sliding window trimming + FIFO eviction preserving immutable system prompt & active turn).
- Task 4: 6-Turn Context Overflow Simulation on "Tower B Fire Setbacks".
- Task 5: Formatted CLI logging and verification outputs.
"""

import sys
import json

try:
    import tiktoken
except ImportError:
    print("Error: tiktoken is required. Install via pip install tiktoken.")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Task 1 & 2: Token Counting & Message Schema Definitions
# ---------------------------------------------------------------------------

try:
    ENCODING = tiktoken.get_encoding("o200k_base")
    ENCODING_NAME = "o200k_base (GPT-4o)"
except Exception:
    ENCODING = tiktoken.get_encoding("cl100k_base")
    ENCODING_NAME = "cl100k_base (GPT-4 / GPT-3.5)"


class ChatMessage:
    def __init__(self, role: str, content: str, turn_id: int = None, is_rag_context: bool = False):
        self.role = role
        self.content = content
        self.turn_id = turn_id
        self.is_rag_context = is_rag_context

    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content}

    def __repr__(self):
        t_info = f" [Turn {self.turn_id}]" if self.turn_id is not None else ""
        return f"<{self.role.upper()}{t_info}: {self.content[:40]}...>"


def count_string_tokens(text: str) -> int:
    """Calculates exact token count for a text string."""
    return len(ENCODING.encode(text))


def measure_message_tokens(message: ChatMessage) -> int:
    """
    Calculates exact token count for a single message including ChatML/OpenAI protocol overhead.
    Protocol Overhead per message:
    - 3 tokens for role/content delimiters (<|im_start|>{role}\n{content}<|im_end|>)
    """
    tokens_per_message = 3
    content_tokens = count_string_tokens(message.content)
    role_tokens = count_string_tokens(message.role)
    return content_tokens + role_tokens + tokens_per_message


def measure_history_tokens(messages: list) -> int:
    """
    Calculates total tokens for a full conversation list including system prompt,
    history turns, RAG chunks, and final assistant response priming (+3 tokens).
    """
    total_tokens = 0
    for msg in messages:
        if isinstance(msg, ChatMessage):
            total_tokens += measure_message_tokens(msg)
        elif isinstance(msg, dict):
            m = ChatMessage(role=msg.get("role", "user"), content=msg.get("content", ""))
            total_tokens += measure_message_tokens(m)

    # 3 tokens for assistant response primer (<|im_start|>assistant<|im_sep|>)
    total_tokens += 3
    return total_tokens


# ---------------------------------------------------------------------------
# Task 3: Memory Compaction & Sliding-Window Trimming Engine
# ---------------------------------------------------------------------------

class ContextBudgetManager:
    def __init__(self, max_context_tokens: int = 2000, reserved_output_tokens: int = 400):
        self.max_context_tokens = max_context_tokens
        self.reserved_output_tokens = reserved_output_tokens
        self.effective_input_budget = max_context_tokens - reserved_output_tokens

    def compact_history(self, messages: list) -> tuple:
        """
        Applies strict memory compaction rules:
        1. IMMUTABLE SYSTEM PROMPT: System message (messages[0]) is NEVER dropped or truncated.
        2. PRESERVE CURRENT TURN: Newest user query & newly retrieved RAG context are ALWAYS kept.
        3. FIFO PAIRWISE TRIMMING: Evicts oldest user/assistant turns when budget is exceeded.
        """
        current_tokens = measure_history_tokens(messages)
        if current_tokens <= self.effective_input_budget:
            return messages, False, []

        evicted_details = []
        compacted = list(messages)

        # Identify System Prompt (Index 0)
        system_msg = compacted[0] if compacted and compacted[0].role == "system" else None

        # Extract history pool excluding system prompt and current turn (last 2 messages: current context + query)
        # Current turn consists of the latest RAG context chunk and latest user question
        while measure_history_tokens(compacted) > self.effective_input_budget:
            # Find the oldest candidate turn to evict (search after system prompt index 0, before current turn)
            eviction_index = -1
            for idx in range(1, len(compacted) - 2):
                if compacted[idx].role != "system":
                    eviction_index = idx
                    break

            if eviction_index == -1:
                # Cannot evict further without violating current turn or system prompt invariant
                break

            evicted_msg = compacted.pop(eviction_index)
            evicted_details.append(
                f"Evicted {evicted_msg.role.upper()} (Turn {evicted_msg.turn_id}, {measure_message_tokens(evicted_msg)} tokens): '{evicted_msg.content[:45]}...'"
            )

        post_trim_tokens = measure_history_tokens(compacted)
        return compacted, True, evicted_details


# ---------------------------------------------------------------------------
# Task 4: 6-Turn Sequential Dialogue Simulation on Tower B Fire Setbacks
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_TEXT = """You are the Senior Building Compliance Officer for SiteSafe.
Evaluate structural safety and fire setback requirements strictly using provided RAG context.
DO NOT speculate. If context is missing governing data, reply: 'VERDICT: AMBIGUOUS / INSUFFICIENT DATA.'"""

DIALOGUE_SIMULATION_TURNS = [
    {
        "turn": 1,
        "topic": "Minimum Setback Distance for Type V",
        "question": "What is the minimum exterior wall setback distance required for a Type V-B commercial building along the west property line under IBC 2021?",
        "rag_context": (
            "IBC 2021 Section 705.2 & Table 601: Exterior walls of Type V-B construction located less than 5 feet (1524 mm) "
            "from the lot line must possess a minimum 1-hour fire-resistance rating. For fire separation distances between "
            "5 feet and 10 feet, a 1-hour rating is required unless qualified under sprinkler exceptions."
        ),
        "simulated_answer": (
            "Under IBC 2021 Section 705.2 and Table 601, Type V-B construction requires a minimum 1-hour fire-resistance rating "
            "for exterior walls located less than 5 feet from the lot line, and 1-hour for separation distances between 5 and 10 feet."
        )
    },
    {
        "turn": 2,
        "topic": "Allowable Unprotected Opening Percentages",
        "question": "If our west exterior wall along Gridline B is set back exactly 4 feet from the lot line, what percentage of the wall area can contain unprotected vinyl sliding windows?",
        "rag_context": (
            "IBC 2021 Section 705.8 & Table 705.8: For fire separation distances from 3 feet to less than 5 feet in Type V construction, "
            "the maximum allowable area of unprotected openings is 0%. All openings must be protected assemblies carrying a minimum "
            "45-minute fire-protection rating under Section 716.5."
        ),
        "simulated_answer": (
            "Per IBC 2021 Section 705.8 Table 705.8, at a 4-foot fire separation distance, allowable unprotected openings are 0%. "
            "Standard unprotected vinyl sliding windows are strictly prohibited; all openings require 45-minute fire-rated assemblies."
        )
    },
    {
        "turn": 3,
        "topic": "NFPA 13 Sprinkler Exception Clauses",
        "question": "Does installing an automatic fire sprinkler system throughout Tower B under NFPA 13 increase our allowable unprotected opening percentage at the 4-foot setback?",
        "rag_context": (
            "IBC 2021 Section 705.8.1 Exception 1: Buildings equipped throughout with an automatic sprinkler system installed in accordance "
            "with Section 903.3.1.1 (NFPA 13) allow protected opening percentages to increase, but unprotected openings for fire separation "
            "distances under 5 feet remain limited to 0% unless protected by approved fire shutters or deluge sprinklers."
        ),
        "simulated_answer": (
            "No. Under IBC Section 705.8.1 Exception 1, while NFPA 13 sprinklers increase allowable protected opening limits, "
            "unprotected opening allowances for fire separation distances under 5 feet remain at 0% unless specific deluge protection is installed."
        )
    },
    {
        "turn": 4,
        "topic": "Exterior Wall Fire-Resistance Hourly Ratings",
        "question": "What structural rating and testing standard is required for the exterior shear wall assembly along the 4-foot setback line?",
        "rag_context": (
            "IBC 2021 Section 705.5 & ASTM E119 / UL 263: Fire-resistance-rated exterior walls required to have a 1-hour rating "
            "must be tested in accordance with ASTM E119 or UL 263 with exposure from both sides. Non-combustible framing or approved "
            "fire-retardant-treated wood (FRTW) must be utilized for Type V assemblies."
        ),
        "simulated_answer": (
            "Per IBC Section 705.5, the wall assembly must achieve a 1-hour fire rating tested per ASTM E119 or UL 263 with fire exposure "
            "evaluated from both sides. Construction requires non-combustible framing or fire-retardant-treated wood (FRTW)."
        )
    },
    {
        "turn": 5,
        "topic": "Parapet Height Requirements",
        "question": "Because the exterior wall is 4 feet from the lot line, are we required to extend the wall to form a parapet above the roof line?",
        "rag_context": (
            "IBC 2021 Section 705.11: Parapets shall be provided on all exterior walls of buildings. Exceptions: Parapets are not required "
            "where exterior walls are permitted to have 0% fire-resistance rating, or where the roof construction has a 1-hour fire rating "
            "for a distance of 10 feet from the exterior wall for Type V buildings."
        ),
        "simulated_answer": (
            "Yes. Under IBC Section 705.11, parapets are mandatory for exterior walls with a 4-foot fire separation distance, "
            "extending at least 30 inches above the roof surface, unless the 10-foot adjacent roof zone is constructed with a continuous 1-hour fire rating."
        )
    },
    {
        "turn": 6,
        "topic": "Overall West Elevation Summary",
        "question": "Can you summarize all structural, opening, sprinkler, and parapet requirements for Tower B West Elevation into a site checklist?",
        "rag_context": (
            "SiteSafe Summary Protocols: West Elevation Type V-B at 4-foot setback requires 1-hr ASTM E119 exterior wall, 0% unprotected openings, "
            "45-min protected opening assemblies, 30-inch parapet or 1-hr roof zone, and NFPA 13 sprinkler integration."
        ),
        "simulated_answer": (
            "TOWER B WEST ELEVATION COMPLIANCE CHECKLIST (4-ft Setback):\n"
            "1. Wall Rating: 1-hour fire resistance (ASTM E119 / UL 263 exposed both sides).\n"
            "2. Openings: 0% unprotected openings permitted; all glazing must be 45-min rated assemblies.\n"
            "3. Parapet: 30-inch parapet required above roofline (or 10-ft 1-hr rated roof zone).\n"
            "4. Sprinklers: NFPA 13 system required throughout."
        )
    }
]


def run_dialogue_simulation():
    budget_mgr = ContextBudgetManager(max_context_tokens=1000, reserved_output_tokens=400)

    print("=" * 95)
    print(f"SITESAFE RAG CONTEXT BUDGET & HISTORY MANAGEMENT ENGINE")
    print(f"Tokenizer: {ENCODING_NAME} | Max Context: {budget_mgr.max_context_tokens} | Output Reserve: {budget_mgr.reserved_output_tokens}")
    print(f"EFFECTIVE INPUT BUDGET: {budget_mgr.effective_input_budget} TOKENS")
    print("=" * 95)

    system_msg = ChatMessage(role="system", content=SYSTEM_PROMPT_TEXT, turn_id=0)
    conversation_history = [system_msg]

    print("\n" + "-" * 95)
    print(f"{'Turn':<6} | {'Topic':<35} | {'Pre-Trim':<10} | {'Status':<18} | {'Post-Trim':<10} | {'LLM Result':<10}")
    print("-" * 95)

    for turn_data in DIALOGUE_SIMULATION_TURNS:
        t_id = turn_data["turn"]
        topic = turn_data["topic"]

        # Append RAG Context block as User message pre-payload
        rag_msg = ChatMessage(
            role="user",
            content=f"[RETRIEVED RAG CONTEXT (Turn {t_id})]: {turn_data['rag_context']}",
            turn_id=t_id,
            is_rag_context=True
        )
        user_query_msg = ChatMessage(
            role="user",
            content=f"[USER QUESTION (Turn {t_id})]: {turn_data['question']}",
            turn_id=t_id
        )

        conversation_history.append(rag_msg)
        conversation_history.append(user_query_msg)

        # Pre-trim token measurement
        pre_trim_tokens = measure_history_tokens(conversation_history)

        # Perform context compaction / trimming
        compacted_messages, is_trimmed, evicted_list = budget_mgr.compact_history(conversation_history)
        post_trim_tokens = measure_history_tokens(compacted_messages)

        status_str = "TRIMMING TRIGGERED" if is_trimmed else "Within Budget"
        llm_status = "SUCCESS (200)" if post_trim_tokens <= budget_mgr.effective_input_budget else "FAILED (400)"

        print(f"{t_id:<6} | {topic[:35]:<35} | {pre_trim_tokens:<10} | {status_str:<18} | {post_trim_tokens:<10} | {llm_status:<10}")

        if is_trimmed:
            for evicted in evicted_list:
                print(f"       |--> [MEMORY COMPACTION]: {evicted}")

        # Update conversation history to compacted state and append assistant response for next turn
        assistant_reply_msg = ChatMessage(
            role="assistant",
            content=turn_data["simulated_answer"],
            turn_id=t_id
        )
        compacted_messages.append(assistant_reply_msg)
        conversation_history = compacted_messages

    print("=" * 95)
    print("\nFINAL COMPACTED CONVERSATION STATE (Turn 6 Execution Payload):")
    print("-" * 95)
    for idx, msg in enumerate(conversation_history):
        tok = measure_message_tokens(msg)
        print(f"[{idx}] {msg.role.upper()} (Turn {msg.turn_id}, {tok} tokens): {msg.content[:85]}...")
    print("-" * 95)
    print(f"Final Total Token Count: {measure_history_tokens(conversation_history)} / {budget_mgr.effective_input_budget} (Effective Budget)")
    print("=" * 95)


if __name__ == "__main__":
    run_dialogue_simulation()
