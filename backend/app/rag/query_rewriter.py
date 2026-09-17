"""
Conversational Query Rewriter Module for Construction Compliance Assistant.
Detects follow-up questions in multi-turn dialogues and rewrites them into standalone
retrieval queries containing resolved context and subject entities from prior turns.
"""

import os
import re
import logging
from typing import List, Dict, Tuple, Optional
from app.config import settings

logger = logging.getLogger("sitesafe.query_rewriter")

# Pronouns and follow-up indicators that suggest a query depends on conversation context
FOLLOWUP_PRONOUNS_PATTERNS = [
    r"\b(it|its|this|these|those|that|they|them|their)\b",
    r"\b(what about|how about|does this|is this|are these|can we use this|what are the|why is this)\b",
    r"\b(the same|the above|this rule|this code|this requirement|the standard|the specification)\b",
    r"\b(also|instead|too|as well)\b",
]

# Words that indicate a standalone topic (technical construction terms)
CONSTRUCTION_TOPIC_KEYWORDS = [
    "pvc", "conduit", "plenum", "ceiling", "raceway", "firestop", "penetration",
    "concrete", "psi", "compressive", "break test", "slab", "dwv", "hydrostatic",
    "stair", "egress", "handrail", "clear width", "ibc", "nec", "upc", "astm", "ul"
]


class ConversationalQueryRewriter:
    """
    Detects follow-up questions dependent on prior conversation context and
    rewrites them into standalone search queries for RAG vector retrieval.
    """

    def __init__(self):
        self.gemini_key = (
            settings.GEMINI_API_KEY
            or settings.GOOGLE_API_KEY
            or os.getenv("GEMINI_API_KEY", "")
            or os.getenv("GOOGLE_API_KEY", "")
        )
        self.openai_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")

    def is_followup_query(self, query: str, history: List[Dict[str, str]]) -> bool:
        """
        Determines whether the given query is a follow-up question that depends
        on prior dialogue turns.
        """
        if not history:
            return False

        query_lower = query.lower().strip()

        # Check for explicit followup pronouns and phrases
        for pattern in FOLLOWUP_PRONOUNS_PATTERNS:
            if re.search(pattern, query_lower):
                return True

        # Check for short or elliptical queries (e.g. "What are the rules?", "Is it allowed?")
        word_count = len(query_lower.split())
        has_construction_topic = any(kw in query_lower for kw in CONSTRUCTION_TOPIC_KEYWORDS)
        
        if word_count <= 8 and not has_construction_topic:
            return True

        return False

    def extract_prior_context_summary(self, history: List[Dict[str, str]]) -> str:
        """
        Extracts key technical topic elements from conversation history.
        """
        user_queries = [turn["content"] for turn in history if turn.get("role") == "user"]
        assistant_replies = [turn["content"] for turn in history if turn.get("role") == "assistant"]

        if not user_queries:
            return ""

        last_user_q = user_queries[-1]
        
        # Try to find specific construction topic from last user query
        extracted_topics = []
        for kw in CONSTRUCTION_TOPIC_KEYWORDS:
            if kw in last_user_q.lower():
                extracted_topics.append(kw)

        # Look for clause numbers or specific subjects in user query
        clause_match = re.search(r"\b(IBC|NEC|UPC|ASTM|UL)\s*\d+(\.\d+)?\b", last_user_q, re.IGNORECASE)
        clause_str = f" ({clause_match.group(0)})" if clause_match else ""

        if extracted_topics:
            topic_str = " ".join(dict.fromkeys(extracted_topics))
            return f"{last_user_q}{clause_str}"
        
        return last_user_q

    def rewrite_query(self, query: str, history: Optional[List[Dict[str, str]]] = None) -> Tuple[str, bool]:
        """
        Rewrites a query into a standalone retrieval query incorporating conversation context.
        Returns a tuple of (rewritten_query, was_rewritten).
        """
        if not history:
            return query, False

        is_followup = self.is_followup_query(query, history)
        if not is_followup:
            return query, False

        # Attempt LLM rewriting if configured
        has_gemini = bool(
            self.gemini_key
            and not self.gemini_key.startswith("your-")
            and not self.gemini_key.startswith("placeholder")
            and len(self.gemini_key.strip()) > 10
        )
        has_openai = bool(
            self.openai_key
            and self.openai_key.startswith("sk-")
            and not self.openai_key.startswith("sk-placeholder")
        )

        if has_gemini or has_openai:
            llm_rewritten = self._rewrite_with_llm(query, history, has_gemini, has_openai)
            if llm_rewritten:
                return llm_rewritten, True

        # Fallback deterministic rewriter engine
        deterministic_rewritten = self._rewrite_deterministic(query, history)
        return deterministic_rewritten, True

    def _rewrite_with_llm(
        self, query: str, history: List[Dict[str, str]], has_gemini: bool, has_openai: bool
    ) -> Optional[str]:
        """Uses LLM to perform accurate contextual query resolution."""
        formatted_history = []
        for turn in history[-6:]:  # include up to last 3 turns
            role = "User" if turn.get("role") == "user" else "Assistant"
            formatted_history.append(f"{role}: {turn.get('content', '')}")
        
        history_str = "\n".join(formatted_history)

        prompt = (
            "Given the following conversation history and a follow-up question from the user, "
            "rewrite the follow-up question into a SINGLE STANDALONE search query that contains all necessary "
            "context, subjects, building code sections, and technical details to retrieve relevant documents.\n\n"
            "Rules:\n"
            "1. Do NOT answer the question.\n"
            "2. Replace all ambiguous pronouns (it, its, this, these, that) with the exact technical subject mentioned in the history.\n"
            "3. Keep the rewritten query concise, factual, and focused on construction code requirements.\n"
            "4. Output ONLY the rewritten standalone search query with no additional text or explanations.\n\n"
            f"CONVERSATION HISTORY:\n{history_str}\n\n"
            f"FOLLOW-UP QUESTION: {query}\n\n"
            "STANDALONE SEARCH QUERY:"
        )

        if has_gemini:
            try:
                from google import genai
                from google.genai import types

                os.environ["GEMINI_API_KEY"] = self.gemini_key
                client = genai.Client(http_options=types.HttpOptions(timeout=15000))
                
                resp = client.models.generate_content(
                    model=settings.GEMINI_MODEL_NAME or "gemini-2.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.0),
                )
                if resp and resp.text:
                    cleaned = resp.text.strip().strip('"')
                    if cleaned:
                        return cleaned
            except Exception as e:
                logger.warning(f"LLM query rewriting via Gemini failed: {e}")

        if has_openai:
            try:
                from langchain_openai import ChatOpenAI
                llm = ChatOpenAI(
                    model=settings.OPENAI_MODEL_NAME,
                    temperature=0.0,
                    openai_api_key=self.openai_key,
                )
                res = llm.invoke(prompt)
                if res and res.content:
                    cleaned = str(res.content).strip().strip('"')
                    if cleaned:
                        return cleaned
            except Exception as e:
                logger.warning(f"LLM query rewriting via OpenAI failed: {e}")

        return None

    def _rewrite_deterministic(self, query: str, history: List[Dict[str, str]]) -> str:
        """
        Deterministic resolution for pronouns and follow-up context when LLMs are offline/in CI.
        """
        prior_context = self.extract_prior_context_summary(history)
        if not prior_context:
            return query

        query_lower = query.lower().strip()
        
        # 1. Pronoun replacement in query
        rewritten = query
        
        # Identify main topic phrase from prior context
        # e.g., "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in ceiling return air plenum?"
        # topic: "PVC conduit in ceiling return air plenum"
        topic_phrase = prior_context
        
        # Refine topic phrase if prior context is a long sentence
        pvc_match = re.search(r"(?:PVC|nonmetallic|Schedule\s*\d+)?\s*conduit\b.*?\bplenum\b", prior_context, re.IGNORECASE)
        firestop_match = re.search(r"\b(?:firestop|penetration)\b.*?\b(?:wall|floor|assembly)\b", prior_context, re.IGNORECASE)
        concrete_match = re.search(r"\b(?:concrete|compressive|cylinder|slab)\b.*?\b(?:psi|strength|break)\b", prior_context, re.IGNORECASE)
        stair_match = re.search(r"\b(?:stair|egress|handrail|width)\b", prior_context, re.IGNORECASE)

        if pvc_match:
            topic_phrase = pvc_match.group(0)
        elif firestop_match:
            topic_phrase = firestop_match.group(0)
        elif concrete_match:
            topic_phrase = concrete_match.group(0)
        elif stair_match:
            topic_phrase = stair_match.group(0)
        else:
            # Strip question prefixes from prior_context
            clean_prior = re.sub(r"^(can we|what are|is it|how to|does|should we|verify)\s+", "", prior_context, flags=re.IGNORECASE)
            topic_phrase = clean_prior.strip("?.!")

        # Replace pronouns with topic phrase
        if re.search(r"\bits\b", query, re.IGNORECASE):
            rewritten = re.sub(r"\bits\b", f"{topic_phrase}'s", query, flags=re.IGNORECASE)
        elif re.search(r"\b(it|this|these|those|that)\b", query, re.IGNORECASE):
            rewritten = re.sub(r"\b(it|this|these|those|that)\b", topic_phrase, query, count=1, flags=re.IGNORECASE)
        else:
            # If no pronoun direct replacement, append context
            rewritten = f"{query} regarding {topic_phrase}"

        # Clean up any duplicate spaces or trailing punct
        rewritten = re.sub(r"\s+", " ", rewritten).strip()
        return rewritten
