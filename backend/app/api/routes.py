"""
FastAPI REST API Routes for SiteSafe Compliance Verification Assistant.
"""

import os
import shutil
import tempfile
import logging
from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.config import settings
from app.models.schemas import (
    ComplianceQueryRequest,
    ComplianceResponse,
    DocumentSummary,
    SystemHealthResponse,
    IngestResponse,
    CorpusStats,
)
from app.rag.pipeline import rag_pipeline
from app.api.security import verify_ingest_api_key, check_upload_rate_limit

logger = logging.getLogger("sitesafe.routes")

router = APIRouter(prefix="/api", tags=["Construction Compliance"])


@router.get("/health", response_model=SystemHealthResponse, tags=["System"])
async def get_system_health():
    """Health status, vector database metrics, and active trade taxonomy."""
    total_docs = rag_pipeline.vector_store.count()
    has_key = bool(
        settings.OPENAI_API_KEY
        and settings.OPENAI_API_KEY.startswith("sk-")
        and not settings.OPENAI_API_KEY.startswith("sk-placeholder")
    )

    return SystemHealthResponse(
        status="healthy",
        service=settings.APP_NAME,
        vector_store="Qdrant Hybrid (Dense + BM25 Sparse RRF)",
        collection_name=settings.QDRANT_COLLECTION,
        indexed_documents=total_docs or len(rag_pipeline.get_document_summaries()),
        openai_configured=has_key,
        model=settings.OPENAI_MODEL_NAME if has_key else "expert-rule-engine-fallback",
        trades=["Structural", "Fire Safety", "Electrical", "Plumbing"],
        jurisdictions=["National", "California", "NYC"],
        document_types=["Code", "Project Spec", "Inspection Log"],
    )


@router.get("/documents", response_model=List[DocumentSummary], tags=["Knowledge Base"])
async def list_documents():
    """Returns list of indexed construction codes, project specs, and inspection reports."""
    return rag_pipeline.get_document_summaries()


@router.post("/verify-compliance", response_model=ComplianceResponse, tags=["Compliance"])
async def verify_compliance(payload: ComplianceQueryRequest):
    """
    Evaluates field observation against authoritative construction codes.
    Executes hybrid dense + BM25 sparse search and returns grounded verdicts
    with source citations, verbatim quotes, and confidence scores.
    """
    try:
        response = rag_pipeline.verify_compliance(payload)
        return response
    except Exception as e:
        logger.error(f"Error evaluating compliance: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance verification engine error: {str(e)}",
        )


@router.post(
    "/ingest/upload",
    response_model=IngestResponse,
    tags=["Ingestion"],
    dependencies=[Depends(verify_ingest_api_key), Depends(check_upload_rate_limit)],
)
async def upload_and_ingest_document(file: UploadFile = File(...)):
    """
    Secure document upload endpoint with API key verification and rate limiting.
    Supports PDF, Markdown, HTML, and Plain Text files.
    """
    filename = file.filename or "uploaded_document"
    ext = os.path.splitext(filename)[1].lower()

    supported = {".pdf", ".html", ".htm", ".md", ".txt"}
    if ext not in supported:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{ext}'. Supported formats are: {', '.join(supported)}",
        )

    # Save to temporary file for defensive parsing
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        indexed_count, err = rag_pipeline.ingest_single_file(tmp_path)
        if err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Document parsing failed: {err}",
            )

        # Also copy to corpus directory for persistence if exists
        if os.path.exists(settings.CORPUS_DIR):
            target_path = os.path.join(settings.CORPUS_DIR, filename)
            shutil.copy2(tmp_path, target_path)

        return IngestResponse(
            status="success",
            message=f"Document '{filename}' successfully ingested and indexed.",
            documents_ingested=1,
            chunks_indexed=indexed_count,
            errors=[],
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post(
    "/reindex",
    response_model=IngestResponse,
    tags=["Ingestion"],
    dependencies=[Depends(verify_ingest_api_key)],
)
async def reindex_corpus():
    """Forces complete re-indexing of all regulatory documents in the knowledge base."""
    try:
        count, errors = rag_pipeline.ingest_default_corpus(force_recreate=True)
        return IngestResponse(
            status="success",
            message=f"Corpus reindexed successfully into '{settings.QDRANT_COLLECTION}'.",
            documents_ingested=len(rag_pipeline.get_document_summaries()),
            chunks_indexed=count,
            errors=errors,
        )
    except Exception as e:
        logger.error(f"Re-indexing failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/stats", response_model=CorpusStats, tags=["Knowledge Base"])
async def get_corpus_statistics():
    """Returns dataset metrics, total chunks, and trade breakdown."""
    return rag_pipeline.get_corpus_stats()
