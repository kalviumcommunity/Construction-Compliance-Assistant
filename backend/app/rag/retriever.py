"""
Hybrid Dense + BM25 Sparse Retriever with Metadata Pre-Filtering and RRF.
Protects against wrong-discipline and cross-jurisdiction contamination.
"""

import logging
from typing import List, Optional
from qdrant_client import models

from app.config import settings
from app.models.schemas import RetrievedChunkInfo
from app.rag.embeddings import get_dense_embeddings_fn, get_sparse_embeddings_fn
from app.rag.vector_store import VectorStoreManager

logger = logging.getLogger("sitesafe.retriever")


class HybridRetriever:
    def __init__(self, vector_store: Optional[VectorStoreManager] = None):
        self.vector_store = vector_store or VectorStoreManager()
        self._embed_query_dense = None
        self._embed_query_sparse = None

    def _ensure_embeddings(self):
        if self._embed_query_dense is None:
            _, self._embed_query_dense, _ = get_dense_embeddings_fn()
        if self._embed_query_sparse is None:
            _, self._embed_query_sparse = get_sparse_embeddings_fn()

    def build_filter(
        self,
        trade: Optional[str] = "All",
        jurisdiction: Optional[str] = "All",
        doc_type: Optional[str] = "All",
    ) -> Optional[models.Filter]:
        """Constructs Qdrant FieldConditions for strict metadata pre-filtering."""
        conditions = []

        if trade and trade != "All":
            conditions.append(models.FieldCondition(key="trade", match=models.MatchValue(value=trade)))
        if jurisdiction and jurisdiction != "All":
            conditions.append(models.FieldCondition(key="jurisdiction", match=models.MatchValue(value=jurisdiction)))
        if doc_type and doc_type != "All":
            conditions.append(models.FieldCondition(key="document_type", match=models.MatchValue(value=doc_type)))

        if conditions:
            return models.Filter(must=conditions)
        return None

    def search(
        self,
        query: str,
        trade: str = "All",
        jurisdiction: str = "All",
        doc_type: str = "All",
        top_k: int = 5,
    ) -> List[RetrievedChunkInfo]:
        """
        Executes hybrid retrieval:
        1. Embeds query into Dense (semantic) and Sparse (BM25 lexical).
        2. Applies metadata pre-filter (Trade, Jurisdiction, DocType).
        3. Executes Qdrant Reciprocal Rank Fusion (RRF).
        4. Formats into uniform RetrievedChunkInfo models.
        """
        self._ensure_embeddings()
        client = self.vector_store.get_client()
        collection = self.vector_store.collection_name

        query_filter = self.build_filter(trade, jurisdiction, doc_type)

        # 1. Dense Vector
        dense_vec = self._embed_query_dense(query)

        # 2. Sparse Vector
        sparse_raw = self._embed_query_sparse(query)
        if hasattr(sparse_raw, "indices") and hasattr(sparse_raw, "values"):
            sparse_indices = list(sparse_raw.indices)
            sparse_values = [float(v) for v in sparse_raw.values]
        elif isinstance(sparse_raw, dict):
            sparse_indices = sparse_raw.get("indices", [])
            sparse_values = sparse_raw.get("values", [])
        else:
            sparse_indices = getattr(sparse_raw, "indices", [])
            sparse_values = getattr(sparse_raw, "values", [])

        sparse_vec = models.SparseVector(indices=sparse_indices, values=sparse_values)

        scored_points = []

        # 3. Hybrid Prefetch + RRF Search
        try:
            prefetch_queries = [
                models.Prefetch(
                    query=dense_vec,
                    using="dense",
                    filter=query_filter,
                    limit=top_k * 2,
                ),
                models.Prefetch(
                    query=sparse_vec,
                    using="sparse",
                    filter=query_filter,
                    limit=top_k * 2,
                ),
            ]

            query_response = client.query_points(
                collection_name=collection,
                prefetch=prefetch_queries,
                query=models.FusionQuery(fusion=models.Fusion.RRF),
                limit=top_k,
                with_payload=True,
            )
            scored_points = query_response.points
        except Exception as e:
            logger.warning(f"RRF hybrid query failed: {e}. Executing fallback dense search.")
            try:
                query_response = client.query_points(
                    collection_name=collection,
                    query=dense_vec,
                    using="dense",
                    query_filter=query_filter,
                    limit=top_k,
                    with_payload=True,
                )
                scored_points = query_response.points
            except Exception as e2:
                logger.error(f"Fallback search failed: {e2}")
                scored_points = []

        # 4. Map into RetrievedChunkInfo
        results: List[RetrievedChunkInfo] = []
        for pt in scored_points:
            payload = pt.payload or {}
            results.append(
                RetrievedChunkInfo(
                    chunk_id=str(payload.get("id", pt.id)),
                    doc_title=str(payload.get("doc_title", "Authoritative Document")),
                    clause_number=str(payload.get("clause_number", "General")),
                    document_type=str(payload.get("document_type", "Code")),
                    trade=str(payload.get("trade", "General")),
                    jurisdiction=str(payload.get("jurisdiction", "National")),
                    page_or_section=str(payload.get("page_or_section", "1")),
                    text=str(payload.get("content", "")),
                    score=round(float(pt.score or 0.0), 4),
                )
            )

        return results
