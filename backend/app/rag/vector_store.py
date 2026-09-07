"""
Qdrant Vector Store Manager for Hybrid Dense + Sparse Retrieval.
Handles collection creation, schema configuration, payload indexing, and batch upserts.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient, models

from app.config import settings
from app.rag.embeddings import get_dense_embeddings_fn, get_sparse_embeddings_fn

logger = logging.getLogger("sitesafe.vector_store")


class VectorStoreManager:
    def __init__(
        self,
        collection_name: Optional[str] = None,
        storage_path: Optional[str] = None,
        url: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self.collection_name = collection_name or settings.QDRANT_COLLECTION
        self.storage_path = storage_path or settings.QDRANT_PATH
        self.url = url or settings.QDRANT_URL
        self.api_key = api_key or settings.QDRANT_API_KEY
        self._client: Optional[QdrantClient] = None

    def get_client(self) -> QdrantClient:
        """Returns initialized Qdrant client."""
        if self._client is None:
            if self.url:
                logger.info(f"Connecting to remote Qdrant cluster at {self.url}...")
                self._client = QdrantClient(url=self.url, api_key=self.api_key or None)
            else:
                logger.info(f"Using local persistent Qdrant storage at {self.storage_path}...")
                os.makedirs(self.storage_path, exist_ok=True)
                self._client = QdrantClient(path=self.storage_path)
        return self._client

    def initialize_collection(self, force_recreate: bool = False) -> int:
        """
        Creates hybrid collection with dense and sparse vector indexes and payload filters.
        """
        client = self.get_client()
        _, _, dense_dim = get_dense_embeddings_fn()

        collections = [c.name for c in client.get_collections().collections]

        if force_recreate and self.collection_name in collections:
            logger.info(f"Recreating collection '{self.collection_name}'...")
            client.delete_collection(self.collection_name)
            collections.remove(self.collection_name)

        if self.collection_name not in collections:
            logger.info(f"Configuring hybrid collection '{self.collection_name}' (dense_dim={dense_dim})...")
            client.create_collection(
                collection_name=self.collection_name,
                vectors_config={
                    "dense": models.VectorParams(
                        size=dense_dim,
                        distance=models.Distance.COSINE,
                    )
                },
                sparse_vectors_config={
                    "sparse": models.SparseVectorParams(
                        index=models.SparseIndexParams(on_disk=False)
                    )
                },
            )

            # Create payload indices for fast pre-filtering
            client.create_payload_index(self.collection_name, "trade", models.PayloadSchemaType.KEYWORD)
            client.create_payload_index(self.collection_name, "jurisdiction", models.PayloadSchemaType.KEYWORD)
            client.create_payload_index(self.collection_name, "document_type", models.PayloadSchemaType.KEYWORD)
            client.create_payload_index(self.collection_name, "clause_number", models.PayloadSchemaType.KEYWORD)
            logger.info(f"Payload filter indexes initialized on collection '{self.collection_name}'.")

        try:
            return client.count(self.collection_name).count
        except Exception:
            return 0

    def upsert_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Embeds and indexes a list of chunk dictionaries into Qdrant.
        Each chunk must have: id, doc_title, clause_number, document_type,
        jurisdiction, trade, page_or_section, content.
        """
        if not chunks:
            return 0

        client = self.get_client()
        self.initialize_collection(force_recreate=False)

        embed_dense, _, _ = get_dense_embeddings_fn()
        embed_sparse, _ = get_sparse_embeddings_fn()

        texts = [c["content"] for c in chunks]
        dense_vectors = embed_dense(texts)
        sparse_vectors_raw = embed_sparse(texts)

        points = []
        for idx, (chunk, dense_vec, sparse_raw) in enumerate(zip(chunks, dense_vectors, sparse_vectors_raw)):
            if hasattr(sparse_raw, "indices") and hasattr(sparse_raw, "values"):
                indices = list(sparse_raw.indices)
                values = [float(v) for v in sparse_raw.values]
            elif isinstance(sparse_raw, dict):
                indices = sparse_raw.get("indices", [])
                values = sparse_raw.get("values", [])
            else:
                indices = getattr(sparse_raw, "indices", [])
                values = getattr(sparse_raw, "values", [])

            point = models.PointStruct(
                id=idx + 1 if isinstance(chunk.get("id"), int) else hash(chunk.get("id", str(idx))) % (2**63 - 1),
                vector={
                    "dense": dense_vec,
                    "sparse": models.SparseVector(indices=indices, values=values),
                },
                payload={
                    "id": chunk.get("id", str(idx)),
                    "doc_title": chunk.get("doc_title", "Document"),
                    "clause_number": chunk.get("clause_number", "General"),
                    "document_type": chunk.get("document_type", "Code"),
                    "jurisdiction": chunk.get("jurisdiction", "National"),
                    "trade": chunk.get("trade", "General"),
                    "page_or_section": chunk.get("page_or_section", "1"),
                    "content": chunk.get("content", ""),
                },
            )
            points.append(point)

        client.upsert(collection_name=self.collection_name, points=points)
        count = client.count(self.collection_name).count
        logger.info(f"Upserted {len(points)} points into '{self.collection_name}'. Total: {count}")
        return count

    def count(self) -> int:
        """Returns total document count in collection."""
        try:
            return self.get_client().count(self.collection_name).count
        except Exception:
            return 0
