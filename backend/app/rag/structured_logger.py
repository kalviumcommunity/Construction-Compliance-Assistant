"""
Structured JSON Logger, Token Estimation, and Usage Monitoring Engine for SiteSafe RAG.
Records machine-readable JSON logs for every RAG request and aggregates usage metrics.
Never logs API keys, secrets, or sensitive parameters.
"""

import json
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.config import settings

logger = logging.getLogger("sitesafe.audit")


def estimate_tokens(text: str) -> int:
    """
    Estimates token count using standard character ratio (~4 characters per token).
    Provides an explicitly documented approximation when direct model usage metadata is unavailable.
    """
    if not text:
        return 0
    return max(1, len(text.strip()) // 4)


def calculate_token_cost(input_tokens: int, output_tokens: int) -> float:
    """
    Calculates estimated USD cost based on configurable model pricing in settings.
    """
    input_rate = getattr(settings, "COST_PER_1K_INPUT_TOKENS", 0.00015)
    output_rate = getattr(settings, "COST_PER_1K_OUTPUT_TOKENS", 0.00060)
    cost = (input_tokens / 1000.0 * input_rate) + (output_tokens / 1000.0 * output_rate)
    return round(cost, 6)


class StructuredRAGLogger:
    """
    Machine-readable structured JSON logger and usage aggregator.
    Tracks requests, cache hits/misses, latency, token estimates, and model costs.
    """

    def __init__(self):
        self._logs: List[Dict[str, Any]] = []

    def log_request(
        self,
        request_id: str,
        question: str,
        verdict: str,
        status: str,
        cache_hit: bool,
        elapsed_time_ms: float,
        retrieved_sources: List[Dict[str, Any]],
        input_text: str = "",
        output_text: str = "",
        error_detail: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Records a structured JSON log entry for a RAG request.
        """
        input_tokens = estimate_tokens(question + " " + input_text)
        output_tokens = estimate_tokens(output_text)
        total_tokens = input_tokens + output_tokens
        cost = calculate_token_cost(input_tokens, output_tokens) if not cache_hit else 0.0

        sources_summary = []
        for s in (retrieved_sources or [])[:5]:
            doc_name = s.get("document") or s.get("doc_title") or s.get("document_filename") or "Unknown Doc"
            clause = s.get("clause_number") or s.get("clause") or "General"
            chunk_id = s.get("chunk_id") or ""
            sources_summary.append({
                "document": doc_name,
                "clause": clause,
                "chunk_id": chunk_id,
            })

        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": request_id,
            "question_truncated": question[:120] if question else "",
            "verdict": verdict,
            "status": status,
            "cache_hit": cache_hit,
            "elapsed_time_ms": round(elapsed_time_ms, 2),
            "tokens": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "measurement_method": "Character-Ratio Estimate (~4 chars/token)",
            },
            "estimated_cost_usd": round(cost, 6),
            "sources_count": len(retrieved_sources or []),
            "sources_summary": sources_summary,
            "error": error_detail,
        }

        self._logs.append(log_entry)
        if len(self._logs) > 1000:
            self._logs.pop(0)

        # Output JSON log line to audit logger
        logger.info(json.dumps(log_entry))
        return log_entry

    def get_usage_summary(self) -> Dict[str, Any]:
        """
        Aggregates usage metrics across all recorded requests.
        """
        total_requests = len(self._logs)
        if total_requests == 0:
            return {
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "cache_hits": 0,
                "cache_misses": 0,
                "cache_hit_rate": "0.0%",
                "total_tokens": 0,
                "estimated_total_cost_usd": 0.0,
                "average_latency_ms": 0.0,
                "tokens_measurement_type": "Character-Ratio Estimate (~4 chars/token)",
            }

        successful = sum(1 for l in self._logs if l.get("status") in ("success", "refusal") and not l.get("error"))
        failed = total_requests - successful
        cache_hits = sum(1 for l in self._logs if l.get("cache_hit"))
        cache_misses = total_requests - cache_hits
        cache_hit_rate = round((cache_hits / total_requests) * 100, 2)
        total_tokens = sum(l.get("tokens", {}).get("total_tokens", 0) for l in self._logs)
        total_cost = round(sum(l.get("estimated_cost_usd", 0.0) for l in self._logs), 6)
        avg_latency = round(sum(l.get("elapsed_time_ms", 0.0) for l in self._logs) / total_requests, 2)

        return {
            "total_requests": total_requests,
            "successful_requests": successful,
            "failed_requests": failed,
            "cache_hits": cache_hits,
            "cache_misses": cache_misses,
            "cache_hit_rate": f"{cache_hit_rate}%",
            "total_tokens": total_tokens,
            "tokens_measurement_type": "Character-Ratio Estimate (~4 chars/token)",
            "estimated_total_cost_usd": total_cost,
            "average_latency_ms": avg_latency,
        }

    def clear() -> None:
        """Clears logged entries."""
        self._logs.clear()


rag_logger = StructuredRAGLogger()
