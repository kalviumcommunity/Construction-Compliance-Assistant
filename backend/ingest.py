"""
Ingestion pipeline for Construction Compliance Knowledge Base.
Sets up Qdrant in Hybrid Retrieval mode (Dense Vector + BM25 Sparse Vector)
with metadata filtering (Trade, Jurisdiction, Document Type).
"""

import os
import sys
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("compliance_ingest")

COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "construction_compliance")
QDRANT_PATH = os.getenv("QDRANT_PATH", os.path.join(os.path.dirname(__file__), "qdrant_storage"))
QDRANT_URL = os.getenv("QDRANT_URL", None)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Import mock dataset
try:
    from backend.mock_data import MOCK_REGULATORY_DOCUMENTS
except ImportError:
    from mock_data import MOCK_REGULATORY_DOCUMENTS


def get_qdrant_client():
    """Instantiate a local or remote Qdrant client."""
    from qdrant_client import QdrantClient

    if QDRANT_URL:
        logger.info(f"Connecting to remote Qdrant at {QDRANT_URL}")
        return QdrantClient(url=QDRANT_URL, api_key=os.getenv("QDRANT_API_KEY", None))
    else:
        logger.info(f"Using local persistent Qdrant storage at {QDRANT_PATH}")
        os.makedirs(QDRANT_PATH, exist_ok=True)
        return QdrantClient(path=QDRANT_PATH)


def get_dense_embeddings_fn():
    """
    Returns dense embedding function.
    Uses OpenAI text-embedding-3-small if key is available,
    otherwise uses local FastEmbed text embedding as a fallback.
    """
    if OPENAI_API_KEY and OPENAI_API_KEY.startswith("sk-"):
        try:
            from langchain_openai import OpenAIEmbeddings

            logger.info("Using OpenAIEmbeddings (text-embedding-3-small)")
            embeddings = OpenAIEmbeddings(
                model="text-embedding-3-small",
                openai_api_key=OPENAI_API_KEY,
            )
            return lambda texts: embeddings.embed_documents(texts), lambda q: embeddings.embed_query(q), 1536
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAIEmbeddings: {e}. Falling back to FastEmbed.")

    try:
        from fastembed import TextEmbedding

        logger.info("Using local FastEmbed dense model (BAAI/bge-small-en-v1.5, dim 384)")
        model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        return (
            lambda texts: [list(v) for v in model.embed(texts)],
            lambda q: list(list(model.embed([q]))[0]),
            384,
        )
    except Exception as e:
        logger.error(f"FastEmbed dense model init failed: {e}")
        # Deterministic pseudo-embedding for emergency offline testing
        import hashlib
        import numpy as np

        def pseudo_embed(text: str, dim: int = 384):
            np.random.seed(int(hashlib.md5(text.encode()).hexdigest(), 16) % (2**32))
            vec = np.random.randn(dim)
            return (vec / np.linalg.norm(vec)).tolist()

        return (
            lambda texts: [pseudo_embed(t) for t in texts],
            lambda q: pseudo_embed(q),
            384,
        )


def get_sparse_embeddings_fn():
    """Returns BM25 sparse embedding function using FastEmbed."""
    try:
        from fastembed import SparseTextEmbedding

        logger.info("Using FastEmbed BM25 sparse model (Qdrant/bm25)")
        model = SparseTextEmbedding(model_name="Qdrant/bm25")
        return (
            lambda texts: list(model.embed(texts)),
            lambda q: list(model.embed([q]))[0],
        )
    except Exception as e:
        logger.warning(f"FastEmbed BM25 init failed: {e}. Using token-frequency fallback.")

        class SimpleSparseVector:
            def __init__(self, indices, values):
                self.indices = indices
                self.values = values

            def as_object(self):
                return {"indices": self.indices, "values": self.values}

        def simple_sparse_embed(text: str):
            words = text.lower().split()
            word_counts = {}
            for w in words:
                clean = "".join(c for c in w if c.isalnum())
                if clean:
                    idx = abs(hash(clean)) % 100000
                    word_counts[idx] = word_counts.get(idx, 0) + 1.0
            indices = list(word_counts.keys())
            values = list(word_counts.values())
            return SimpleSparseVector(indices, values)

        return (
            lambda texts: [simple_sparse_embed(t) for t in texts],
            lambda q: simple_sparse_embed(q),
        )


def setup_and_ingest_collection(force_recreate: bool = False):
    """
    Creates hybrid Qdrant collection (Dense + BM25 Sparse) and ingests mock documents.
    """
    from qdrant_client import models

    client = get_qdrant_client()
    embed_docs_dense, embed_query_dense, dense_dim = get_dense_embeddings_fn()
    embed_docs_sparse, embed_query_sparse = get_sparse_embeddings_fn()

    collections = client.get_collections().collections
    collection_names = [c.name for c in collections]

    if force_recreate and COLLECTION_NAME in collection_names:
        logger.info(f"Recreating existing collection: {COLLECTION_NAME}")
        client.delete_collection(COLLECTION_NAME)
        collection_names.remove(COLLECTION_NAME)

    if COLLECTION_NAME not in collection_names:
        logger.info(f"Creating new hybrid collection '{COLLECTION_NAME}' with dense dim={dense_dim}")
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config={
                "dense": models.VectorParams(
                    size=dense_dim,
                    distance=models.Distance.COSINE,
                )
            },
            sparse_vectors_config={
                "sparse": models.SparseVectorParams(
                    index=models.SparseIndexParams(
                        on_disk=False,
                    )
                )
            },
        )

        # Create payload indexes for fast filtering
        client.create_payload_index(COLLECTION_NAME, "trade", models.PayloadSchemaType.KEYWORD)
        client.create_payload_index(COLLECTION_NAME, "jurisdiction", models.PayloadSchemaType.KEYWORD)
        client.create_payload_index(COLLECTION_NAME, "document_type", models.PayloadSchemaType.KEYWORD)
        client.create_payload_index(COLLECTION_NAME, "clause_number", models.PayloadSchemaType.KEYWORD)

    # Check count
    count_info = client.count(COLLECTION_NAME)
    if count_info.count > 0 and not force_recreate:
        logger.info(f"Collection '{COLLECTION_NAME}' already contains {count_info.count} documents.")
        return client, count_info.count

    logger.info(f"Ingesting {len(MOCK_REGULATORY_DOCUMENTS)} regulatory documents...")
    texts = [doc["content"] for doc in MOCK_REGULATORY_DOCUMENTS]
    dense_vectors = embed_docs_dense(texts)
    sparse_vectors_raw = embed_docs_sparse(texts)

    points = []
    for idx, (doc, dense_vec, sparse_vec) in enumerate(zip(MOCK_REGULATORY_DOCUMENTS, dense_vectors, sparse_vectors_raw)):
        # Normalize sparse vector structure
        if hasattr(sparse_vec, "indices") and hasattr(sparse_vec, "values"):
            indices = list(sparse_vec.indices)
            values = [float(v) for v in sparse_vec.values]
        elif isinstance(sparse_vec, dict):
            indices = sparse_vec.get("indices", [])
            values = sparse_vec.get("values", [])
        else:
            indices = getattr(sparse_vec, "indices", [])
            values = getattr(sparse_vec, "values", [])

        point = models.PointStruct(
            id=idx + 1,
            vector={
                "dense": dense_vec,
                "sparse": models.SparseVector(indices=indices, values=values),
            },
            payload={
                "id": doc["id"],
                "doc_title": doc["doc_title"],
                "clause_number": doc["clause_number"],
                "document_type": doc["document_type"],
                "jurisdiction": doc["jurisdiction"],
                "trade": doc["trade"],
                "page_or_section": doc["page_or_section"],
                "content": doc["content"],
            },
        )
        points.append(point)

    client.upsert(collection_name=COLLECTION_NAME, points=points)
    total_count = client.count(COLLECTION_NAME).count
    logger.info(f"Successfully ingested {len(points)} documents. Total in collection: {total_count}")
    return client, total_count


if __name__ == "__main__":
    force = "--recreate" in sys.argv
    setup_and_ingest_collection(force_recreate=force)
