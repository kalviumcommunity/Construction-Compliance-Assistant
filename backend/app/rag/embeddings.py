"""
Embedding Functions for SiteSafe RAG Pipeline.
Dense Vector: OpenAI text-embedding-3-small (1536d) with FastEmbed BGE-small-en-v1.5 (384d) fallback.
Sparse Vector: FastEmbed BM25 with term-frequency fallback.
"""

import os
import hashlib
import logging
from typing import List, Callable, Tuple, Any
import numpy as np

from app.config import settings

logger = logging.getLogger("sitesafe.embeddings")


_cached_fastembed_dense = None
_cached_fastembed_sparse = None


def get_dense_embeddings_fn() -> Tuple[Callable[[List[str]], List[List[float]]], Callable[[str], List[float]], int]:
    """
    Returns (embed_documents_fn, embed_query_fn, dimension).
    Prioritizes configured EMBEDDING_PROVIDER:
    - 'gemini': Google text-embedding-004 (768d)
    - 'openai': OpenAI text-embedding-3-small (1536d)
    - 'fastembed' (default): FastEmbed BAAI/bge-small-en-v1.5 (local ONNX, 384d)
    Falls back to FastEmbed, then deterministic pseudo-vectors for offline CI.
    """
    global _cached_fastembed_dense
    provider = (settings.EMBEDDING_PROVIDER or "fastembed").lower()

    # Optional Gemini dense embeddings
    if provider == "gemini":
        gemini_key = (
            settings.GEMINI_API_KEY
            or settings.GOOGLE_API_KEY
            or os.getenv("GEMINI_API_KEY", "")
            or os.getenv("GOOGLE_API_KEY", "")
        )
        if gemini_key and not gemini_key.startswith("your-") and not gemini_key.startswith("placeholder") and len(gemini_key.strip()) > 10:
            try:
                from langchain_google_genai import GoogleGenerativeAIEmbeddings

                logger.info(f"Initializing Google Gemini embeddings ({settings.GEMINI_EMBEDDING_MODEL}, dim 768)...")
                gemini_embeddings = GoogleGenerativeAIEmbeddings(
                    model=settings.GEMINI_EMBEDDING_MODEL,
                    google_api_key=gemini_key,
                )
                return (
                    lambda texts: gemini_embeddings.embed_documents(texts),
                    lambda q: gemini_embeddings.embed_query(q),
                    768,
                )
            except Exception as e:
                logger.warning(f"GoogleGenerativeAIEmbeddings failed to initialize: {e}. Falling back to FastEmbed.")

    # Optional OpenAI dense embeddings
    if provider == "openai":
        key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
        if key and key.startswith("sk-") and not key.startswith("sk-placeholder"):
            try:
                from langchain_openai import OpenAIEmbeddings

                logger.info("Initializing OpenAI text-embedding-3-small dense embeddings...")
                embeddings = OpenAIEmbeddings(
                    model=settings.OPENAI_EMBEDDING_MODEL,
                    openai_api_key=key,
                )
                return (
                    lambda texts: embeddings.embed_documents(texts),
                    lambda q: embeddings.embed_query(q),
                    1536,
                )
            except Exception as e:
                logger.warning(f"OpenAIEmbeddings failed to initialize: {e}. Falling back to FastEmbed.")

    try:
        from fastembed import TextEmbedding

        if _cached_fastembed_dense is None:
            logger.info(f"Using local FastEmbed dense model ({settings.FASTEMBED_DENSE_MODEL}, dim 384)...")
            _cached_fastembed_dense = TextEmbedding(model_name=settings.FASTEMBED_DENSE_MODEL)
        model = _cached_fastembed_dense
        return (
            lambda texts: [list(v) for v in model.embed(texts)],
            lambda q: list(list(model.embed([q]))[0]),
            384,
        )
    except Exception as e:
        logger.warning(f"FastEmbed dense init failed: {e}. Using deterministic fallback vector generator.")

        def pseudo_embed(text: str, dim: int = 384) -> List[float]:
            seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16)
            np.random.seed(seed)
            vec = np.random.randn(dim).astype(np.float32)
            norm = np.linalg.norm(vec)
            return (vec / (norm if norm > 0 else 1.0)).tolist()

        return (
            lambda texts: [pseudo_embed(t) for t in texts],
            lambda q: pseudo_embed(q),
            384,
        )


def get_sparse_embeddings_fn() -> Tuple[Callable[[List[str]], List[Any]], Callable[[str], Any]]:
    """
    Returns (embed_documents_sparse_fn, embed_query_sparse_fn).
    Uses FastEmbed BM25 sparse model with term-frequency fallback.
    """
    global _cached_fastembed_sparse
    try:
        from fastembed import SparseTextEmbedding

        if _cached_fastembed_sparse is None:
            logger.info(f"Using FastEmbed BM25 sparse model ({settings.FASTEMBED_SPARSE_MODEL})...")
            _cached_fastembed_sparse = SparseTextEmbedding(model_name=settings.FASTEMBED_SPARSE_MODEL)
        model = _cached_fastembed_sparse
        return (
            lambda texts: list(model.embed(texts)),
            lambda q: list(model.embed([q]))[0],
        )
    except Exception as e:
        logger.warning(f"FastEmbed BM25 init failed: {e}. Using token-frequency sparse fallback.")

        class SimpleSparseVector:
            def __init__(self, indices: List[int], values: List[float]):
                self.indices = indices
                self.values = values

        def simple_sparse_embed(text: str) -> SimpleSparseVector:
            words = text.lower().split()
            word_counts: dict = {}
            for w in words:
                clean = "".join(c for c in w if c.isalnum())
                if clean:
                    idx = abs(hash(clean)) % 50000
                    word_counts[idx] = word_counts.get(idx, 0.0) + 1.0
            indices = list(word_counts.keys())
            values = list(word_counts.values())
            return SimpleSparseVector(indices, values)

        return (
            lambda texts: [simple_sparse_embed(t) for t in texts],
            lambda q: simple_sparse_embed(q),
        )
