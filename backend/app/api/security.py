"""
API Security, Authentication, and Rate Limiting for SiteSafe Endpoints.
Protects vector database and embedding API quota from abuse or accidental spamming.
"""

import time
import secrets
import logging
from collections import defaultdict
from typing import Dict, List, Optional
from fastapi import Header, HTTPException, Request, status

from app.config import settings

logger = logging.getLogger("sitesafe.security")

# In-memory sliding window rate limiter: ip -> list of timestamps
_upload_request_timestamps: Dict[str, List[float]] = defaultdict(list)


def verify_ingest_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> str:
    """
    Validates API key for mutating endpoints (upload, reindex).
    Uses constant-time comparison to prevent timing attacks.
    Ensures vector store and embedding quota cannot be spammed.
    """
    expected_key = settings.INGEST_API_KEY
    if not expected_key:
        # Strict mode: fail closed if no key is configured
        logger.warning("Ingest endpoint rejected: INGEST_API_KEY is not configured on server.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: Document ingestion key is not configured.",
        )

    if not x_api_key or not secrets.compare_digest(x_api_key, expected_key):
        logger.warning("Unauthorized ingestion attempt: missing or invalid X-API-Key header.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized. A valid 'X-API-Key' header is required for document ingestion and reindexing.",
        )

    return x_api_key


def check_upload_rate_limit(request: Request) -> None:
    """
    Sliding window rate limiter: permits up to RATE_LIMIT_UPLOAD_PER_MINUTE
    requests per minute per client IP address.
    """
    client_ip = request.client.host if request.client else "unknown-client"
    now = time.time()
    one_minute_ago = now - 60.0

    # Prune old timestamps
    timestamps = [ts for ts in _upload_request_timestamps[client_ip] if ts > one_minute_ago]
    _upload_request_timestamps[client_ip] = timestamps

    limit = settings.RATE_LIMIT_UPLOAD_PER_MINUTE
    if len(timestamps) >= limit:
        logger.warning(f"Upload rate limit exceeded for client {client_ip} ({len(timestamps)} requests in 60s).")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: maximum {limit} document uploads per minute allowed. Please wait before retrying.",
        )

    # Record current request
    _upload_request_timestamps[client_ip].append(now)


# In-memory sliding window rate limiter for compliance verification: ip -> list of timestamps
_verify_request_timestamps: Dict[str, List[float]] = defaultdict(list)


def check_verify_rate_limit(request: Request) -> None:
    """
    Sliding window rate limiter: permits up to RATE_LIMIT_VERIFY_PER_MINUTE
    requests per minute per client IP address.
    """
    client_ip = request.client.host if request.client else "unknown-client"
    now = time.time()
    one_minute_ago = now - 60.0

    # Prune old timestamps
    timestamps = [ts for ts in _verify_request_timestamps[client_ip] if ts > one_minute_ago]
    _verify_request_timestamps[client_ip] = timestamps

    limit = settings.RATE_LIMIT_VERIFY_PER_MINUTE
    if len(timestamps) >= limit:
        logger.warning(f"Verify rate limit exceeded for client {client_ip} ({len(timestamps)} requests in 60s).")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Compliance verification rate limit exceeded: maximum {limit} requests per minute allowed. Please wait before retrying.",
        )

    # Record current request
    _verify_request_timestamps[client_ip].append(now)

