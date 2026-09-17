"""
Deterministic Query Result Cache and Key Generator for SiteSafe RAG Assistant.
Prevents redundant LLM synthesis and retrieval when identical parameters are queried.
Enforces TTL expiration and settings-aware key hashing to avoid serving stale results.
"""

import hashlib
import json
import time
from typing import Any, Dict, Optional, List
from app.config import settings


class QueryCacheManager:
    """
    In-memory deterministic query cache with TTL expiration and settings-aware cache keys.
    """

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def generate_cache_key(
        self,
        question: str,
        trade: str = "All",
        jurisdiction: str = "All",
        doc_type: str = "All",
        top_k: int = 5,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """
        Generates a deterministic SHA-256 hash incorporating the question, filters,
        and current RAG configuration settings.
        """
        payload = {
            "question": question.strip().lower(),
            "trade": (trade or "All").strip().lower(),
            "jurisdiction": (jurisdiction or "All").strip().lower(),
            "doc_type": (doc_type or "All").strip().lower(),
            "top_k": top_k,
            "conversation_history": conversation_history or [],
            "gemini_model": settings.GEMINI_MODEL_NAME,
            "dense_model": settings.FASTEMBED_DENSE_MODEL,
            "relevance_threshold": settings.RAG_RELEVANCE_THRESHOLD,
        }
        serialized = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieves cached payload if present and not expired."""
        if not getattr(settings, "RAG_CACHE_ENABLED", True):
            return None

        entry = self._cache.get(key)
        if not entry:
            return None

        now = time.time()
        ttl = getattr(settings, "RAG_CACHE_TTL", 3600)
        if now - entry["timestamp"] > ttl:
            # Entry has expired
            del self._cache[key]
            return None

        return entry["data"]

    def set(self, key: str, data: Dict[str, Any]) -> None:
        """Stores result payload in cache with current timestamp."""
        if not getattr(settings, "RAG_CACHE_ENABLED", True):
            return

        self._cache[key] = {
            "timestamp": time.time(),
            "data": data,
        }

    def clear(self) -> None:
        """Clears all cached entries."""
        self._cache.clear()

    def size(self) -> int:
        """Returns current cache entry count."""
        return len(self._cache)


query_cache = QueryCacheManager()
