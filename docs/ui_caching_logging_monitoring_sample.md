# SiteSafe RAG — Query Caching, Structured Logging & Usage Monitoring

This document details the Query Caching, Machine-Readable Structured JSON Logging, Token Usage Estimation, Model Pricing/Cost Calculation, and Aggregated Usage Metrics API implemented for SiteSafe Construction Compliance Assistant.

---

## 1. Environment Configuration

Cache TTL, logging format, and token pricing are configured via environment variables in `backend/app/config.py`:

```env
# Cache & Logging Configuration
RAG_CACHE_ENABLED=true
RAG_CACHE_TTL=3600               # Expiration in seconds (1 hour)
RAG_LOG_FORMAT=json

# Configurable Model Token Pricing (USD per 1,000 tokens)
COST_PER_1K_INPUT_TOKENS=0.00015
COST_PER_1K_OUTPUT_TOKENS=0.00060
```

---

## 2. Deterministic Cache Key Strategy

The cache key generator (`QueryCacheManager.generate_cache_key`) constructs a SHA-256 hash incorporating the query text, active filters, and governing model settings:

```json
{
  "question": "can we install 1-inch schedule 40 pvc conduit for low-voltage controls in the drop-ceiling return air plenum?",
  "trade": "electrical",
  "jurisdiction": "national",
  "doc_type": "code",
  "top_k": 5,
  "conversation_history": [],
  "gemini_model": "gemini-3.6-flash",
  "dense_model": "BAAI/bge-small-en-v1.5",
  "relevance_threshold": 0.01
}
```

- **Deterministic SHA-256 Hash**: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- **Cache Hit Determination**: If an identical request with matching settings is submitted within `RAG_CACHE_TTL` (3600s), the cached payload is returned instantly with `"cache_hit": true` in response metadata without rerunning vector retrieval or LLM synthesis.
- **Cache Invalidation**: Changing any parameter (e.g. `trade="Plumbing"`) or exceeding TTL automatically invalidates the cache entry, triggering a fresh RAG pipeline execution.

---

## 3. Sample Structured JSON Logs (`sitesafe.audit`)

### A. Cache Miss Log Entry
```json
{
  "timestamp": "2026-09-17T09:58:30.124500+00:00",
  "request_id": "req-1726567110124",
  "question_truncated": "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?",
  "verdict": "Non-Compliant",
  "status": "success",
  "cache_hit": false,
  "elapsed_time_ms": 342.15,
  "tokens": {
    "input_tokens": 32,
    "output_tokens": 118,
    "total_tokens": 150,
    "measurement_method": "Character-Ratio Estimate (~4 chars/token)"
  },
  "estimated_cost_usd": 0.000075,
  "sources_count": 2,
  "sources_summary": [
    {
      "document": "National Electrical Code (NEC 2023)",
      "clause": "NEC Article 300.22(C)",
      "chunk_id": "nec-300-22-c1"
    },
    {
      "document": "Division 26 Electrical Specification",
      "clause": "Project Spec 26 05 33 §2.01.B",
      "chunk_id": "spec-26-05-33-p2"
    }
  ],
  "error": null
}
```

### B. Cache Hit Log Entry
```json
{
  "timestamp": "2026-09-17T09:58:35.882100+00:00",
  "request_id": "req-1726567115882",
  "question_truncated": "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?",
  "verdict": "Non-Compliant",
  "status": "success",
  "cache_hit": true,
  "elapsed_time_ms": 1.25,
  "tokens": {
    "input_tokens": 32,
    "output_tokens": 118,
    "total_tokens": 150,
    "measurement_method": "Character-Ratio Estimate (~4 chars/token)"
  },
  "estimated_cost_usd": 0.0,
  "sources_count": 2,
  "sources_summary": [
    {
      "document": "National Electrical Code (NEC 2023)",
      "clause": "NEC Article 300.22(C)",
      "chunk_id": "nec-300-22-c1"
    }
  ],
  "error": null
}
```

### C. Error Request Log Entry
```json
{
  "timestamp": "2026-09-17T09:59:02.441200+00:00",
  "request_id": "req-1726567142441",
  "question_truncated": "   ",
  "verdict": "Error",
  "status": "error",
  "cache_hit": false,
  "elapsed_time_ms": 0.85,
  "tokens": {
    "input_tokens": 0,
    "output_tokens": 0,
    "total_tokens": 0,
    "measurement_method": "Character-Ratio Estimate (~4 chars/token)"
  },
  "estimated_cost_usd": 0.0,
  "sources_count": 0,
  "sources_summary": [],
  "error": "Invalid request: 'question' must be a non-empty string."
}
```

---

## 4. Usage Summary API Endpoint (`GET /api/metrics`)

- **Endpoint**: `GET /api/metrics`
- **Response**:
  ```json
  {
    "total_requests": 42,
    "successful_requests": 41,
    "failed_requests": 1,
    "cache_hits": 18,
    "cache_misses": 24,
    "cache_hit_rate": "42.86%",
    "total_tokens": 6480,
    "tokens_measurement_type": "Character-Ratio Estimate (~4 chars/token)",
    "estimated_total_cost_usd": 0.003145,
    "average_latency_ms": 185.42
  }
  ```

---

## 5. Security & Sensitive Information Defense

- **Zero Secret Exposure**: API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `QDRANT_API_KEY`, `INGEST_API_KEY`) and raw headers are strictly excluded from all log statements, cache keys, and metrics payloads.
- **Safe Truncation**: Questions in logs are safely truncated to a maximum of 120 characters.
