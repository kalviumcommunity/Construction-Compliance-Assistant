"""
Master RAG Pipeline Coordinator for SiteSafe.
Orchestrates document loading, cleaning, chunking, tagging, vector indexing,
hybrid retrieval, and grounded compliance verification.
"""

import os
import time
import logging
from typing import List, Dict, Any, Tuple, Optional

from app.config import settings
from app.models.schemas import (
    ComplianceQueryRequest,
    ComplianceResponse,
    RetrievedChunkInfo,
    DocumentSummary,
    IngestResponse,
    CorpusStats,
)
from app.data.regulatory_corpus import REGULATORY_DOCUMENTS
from app.rag.document_loader import DocumentLoader, LoadedDocument
from app.rag.text_cleaner import DocumentCleaner
from app.rag.chunker import TokenAwareChunker
from app.rag.metadata_tagger import MetadataTagger
from app.rag.vector_store import VectorStoreManager
from app.rag.retriever import HybridRetriever
from app.rag.generator import ComplianceGenerator

logger = logging.getLogger("sitesafe.pipeline")


class RAGPipeline:
    def __init__(self):
        self.loader = DocumentLoader(base_dir=settings.BASE_DIR)
        self.cleaner = DocumentCleaner()
        self.chunker = TokenAwareChunker(
            chunk_size_tokens=settings.CHUNK_SIZE_TOKENS,
            chunk_overlap_tokens=settings.CHUNK_OVERLAP_TOKENS,
            encoding_name=settings.TIKTOKEN_ENCODING,
        )
        self.tagger = MetadataTagger()
        self.vector_store = VectorStoreManager()
        self.retriever = HybridRetriever(self.vector_store)
        self.generator = ComplianceGenerator()

    def ingest_default_corpus(self, force_recreate: bool = False) -> Tuple[int, List[str]]:
        """
        Ingests the built-in authoritative regulatory corpus plus any files
        present in backend/corpus/.
        """
        errors: List[str] = []
        chunks_to_index: List[Dict[str, Any]] = []

        # 1. Process built-in regulatory documents
        for doc in REGULATORY_DOCUMENTS:
            cleaned_text = self.cleaner.clean_document(doc["content"])
            raw_chunks = self.chunker.chunk_text(cleaned_text)

            for c in raw_chunks:
                chunks_to_index.append({
                    "id": f"{doc['id']}_c{c['chunk_index']}",
                    "doc_title": doc["doc_title"],
                    "clause_number": doc["clause_number"],
                    "document_type": doc["document_type"],
                    "jurisdiction": doc["jurisdiction"],
                    "trade": doc["trade"],
                    "page_or_section": doc["page_or_section"],
                    "content": c["text"],
                })

        # 2. Process file corpus in corpus_dir if available
        if os.path.exists(settings.CORPUS_DIR):
            loaded_docs, failures = self.loader.load_directory(settings.CORPUS_DIR)
            for fail in failures:
                errors.append(f"{fail['file']}: {fail['error']}")

            for l_doc in loaded_docs:
                cleaned_text = self.cleaner.clean_document(l_doc.content)
                raw_chunks = self.chunker.chunk_text(cleaned_text)
                tagged = self.tagger.tag_chunks(
                    doc_id=l_doc.doc_id,
                    doc_title=l_doc.metadata.get("title", os.path.basename(l_doc.source)),
                    chunks=raw_chunks,
                )
                for t in tagged:
                    chunks_to_index.append({
                        "id": t.chunk_id,
                        "doc_title": t.metadata.doc_title,
                        "clause_number": t.metadata.section_clause,
                        "document_type": t.metadata.doc_type,
                        "jurisdiction": t.metadata.jurisdiction,
                        "trade": t.metadata.trade,
                        "page_or_section": f"Page {t.metadata.page_number}",
                        "content": t.content,
                    })

        # 3. Initialize collection and index
        self.vector_store.initialize_collection(force_recreate=force_recreate)
        indexed_count = self.vector_store.upsert_chunks(chunks_to_index)
        logger.info(f"Ingestion complete: {len(chunks_to_index)} chunks indexed.")
        return indexed_count, errors

    def ingest_single_file(self, file_path: str) -> Tuple[int, Optional[str]]:
        """Ingests a single file into the live vector store with defensive validation."""
        try:
            doc = self.loader.load_file(file_path)
            cleaned = self.cleaner.clean_document(doc.content)
            raw_chunks = self.chunker.chunk_text(cleaned)
            tagged = self.tagger.tag_chunks(
                doc_id=doc.doc_id,
                doc_title=doc.metadata.get("title", os.path.basename(file_path)),
                chunks=raw_chunks,
            )

            chunks_data = [
                {
                    "id": t.chunk_id,
                    "doc_title": t.metadata.doc_title,
                    "clause_number": t.metadata.section_clause,
                    "document_type": t.metadata.doc_type,
                    "jurisdiction": t.metadata.jurisdiction,
                    "trade": t.metadata.trade,
                    "page_or_section": f"Page {t.metadata.page_number}",
                    "content": t.content,
                }
                for t in tagged
            ]

            indexed = self.vector_store.upsert_chunks(chunks_data)
            return indexed, None
        except Exception as e:
            logger.error(f"Failed to ingest file '{file_path}': {e}", exc_info=True)
            return 0, str(e)

    def verify_compliance(self, request: ComplianceQueryRequest) -> ComplianceResponse:
        """Executes full hybrid retrieval and grounded compliance analysis."""
        start_time = time.time()
        logger.info(
            f"Verifying compliance: query='{request.query}' trade='{request.trade}' jur='{request.jurisdiction}' doc='{request.document_type}'"
        )

        # 1. Retrieve hybrid chunks
        chunks = self.retriever.search(
            query=request.query,
            trade=request.trade or "All",
            jurisdiction=request.jurisdiction or "All",
            doc_type=request.document_type or "All",
            top_k=request.top_k,
        )

        # 2. Synthesize grounded answer
        llm_out = self.generator.generate_compliance_verdict(query=request.query, chunks=chunks)
        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return ComplianceResponse(
            verdict=llm_out.verdict,
            confidence_score=llm_out.confidence_score,
            summary=llm_out.summary,
            technical_analysis=llm_out.technical_analysis,
            citations=llm_out.citations,
            recommended_actions=llm_out.recommended_actions,
            retrieved_chunks=chunks,
            search_metadata={
                "elapsed_time_ms": elapsed_ms,
                "chunks_retrieved": len(chunks),
                "filters_applied": {
                    "trade": request.trade,
                    "jurisdiction": request.jurisdiction,
                    "document_type": request.document_type,
                    "top_k": request.top_k,
                },
                "retrieval_mode": "Hybrid (Dense + BM25 Sparse RRF)",
            },
        )

    def get_document_summaries(self) -> List[DocumentSummary]:
        """Returns list of all available authoritative documents."""
        summaries = []
        for doc in REGULATORY_DOCUMENTS:
            snippet = doc["content"][:180] + "..." if len(doc["content"]) > 180 else doc["content"]
            summaries.append(
                DocumentSummary(
                    id=doc["id"],
                    title=doc["doc_title"],
                    clause_number=doc["clause_number"],
                    trade=doc["trade"],
                    jurisdiction=doc["jurisdiction"],
                    document_type=doc["document_type"],
                    page_or_section=doc["page_or_section"],
                    summary_snippet=snippet,
                )
            )
        return summaries

    def get_corpus_stats(self) -> CorpusStats:
        """Returns distribution statistics across trades, jurisdictions, and types."""
        trades: Dict[str, int] = {}
        jurisdictions: Dict[str, int] = {}
        doc_types: Dict[str, int] = {}

        for doc in REGULATORY_DOCUMENTS:
            t = doc["trade"]
            j = doc["jurisdiction"]
            dt = doc["document_type"]
            trades[t] = trades.get(t, 0) + 1
            jurisdictions[j] = jurisdictions.get(j, 0) + 1
            doc_types[dt] = doc_types.get(dt, 0) + 1

        total_chunks = self.vector_store.count()
        return CorpusStats(
            total_documents=len(REGULATORY_DOCUMENTS),
            total_chunks=total_chunks or len(REGULATORY_DOCUMENTS),
            trades=trades,
            jurisdictions=jurisdictions,
            document_types=doc_types,
        )


# Global Pipeline Singleton
rag_pipeline = RAGPipeline()
