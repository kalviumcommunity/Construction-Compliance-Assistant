"""
FastAPI REST API Routes for SiteSafe Compliance Verification Assistant.
"""

import asyncio
import json
import os
import re
import shutil
import tempfile
import time
from datetime import datetime, timezone
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Request
from fastapi.responses import StreamingResponse

from app.config import settings
from app.models.schemas import (
    ComplianceQueryRequest,
    ComplianceResponse,
    ComplianceVerdict,
    SimpleQueryRequest,
    StructuredQueryResponse,
    QuerySourceInfo,
    DocumentSummary,
    SystemHealthResponse,
    IngestResponse,
    CorpusStats,
    QueryHistoryItem,
    ProjectSummary,
    InspectionFinding,
    CreateProjectRequest,
    DeleteProjectResponse,
)
from app.rag.pipeline import rag_pipeline
from app.api.security import (
    verify_ingest_api_key,
    check_upload_rate_limit,
    check_verify_rate_limit,
)

logger = logging.getLogger("sitesafe.routes")

router = APIRouter(prefix="/api", tags=["Construction Compliance"])

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_EXTENSIONS = {".pdf", ".html", ".htm", ".md", ".txt"}
ALLOWED_MIME_TYPES = {
    ".pdf": {"application/pdf", "application/x-pdf", "application/octet-stream"},
    ".html": {"text/html", "application/xhtml+xml"},
    ".htm": {"text/html", "application/xhtml+xml"},
    ".md": {"text/markdown", "text/x-markdown", "text/plain", "application/octet-stream"},
    ".txt": {"text/plain", "text/markdown", "application/octet-stream"},
}

# Live dynamic repositories
_query_history: List[QueryHistoryItem] = [
    QueryHistoryItem(
        id="h-init-1",
        query="Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?",
        trade="Electrical",
        verdict="Non-Compliant",
        confidence=98,
        date="2026-09-08T10:00:00Z",
        sources_count=2,
        project_id="p1",
    ),
    QueryHistoryItem(
        id="h-init-2",
        query="Cylinder break tests achieved 4,850 psi at 28 days for elevated post-tensioned deck slab. Is this compliant?",
        trade="Structural",
        verdict="Compliant",
        confidence=97,
        date="2026-09-09T14:30:00Z",
        sources_count=1,
        project_id="p1",
    ),
    QueryHistoryItem(
        id="h-init-3",
        query="Did our 30-minute hydrostatic water test with 42-foot static head satisfy rough drainage requirements?",
        trade="Plumbing",
        verdict="Compliant",
        confidence=98,
        date="2026-09-10T09:15:00Z",
        sources_count=1,
        project_id="p1",
    ),
]

_projects_store: List[ProjectSummary] = []

_inspections_store: List[InspectionFinding] = []



@router.get("/health", response_model=SystemHealthResponse, tags=["System"])
async def get_system_health():
    """Health status, vector database metrics, and active trade taxonomy."""
    total_docs = rag_pipeline.vector_store.count()
    gemini_key = (
        settings.GEMINI_API_KEY
        or settings.GOOGLE_API_KEY
        or os.getenv("GEMINI_API_KEY", "")
        or os.getenv("GOOGLE_API_KEY", "")
    )
    has_gemini = bool(
        gemini_key
        and not gemini_key.startswith("your-")
        and not gemini_key.startswith("placeholder")
        and len(gemini_key.strip()) > 10
    )

    openai_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
    has_openai = bool(
        openai_key
        and openai_key.startswith("sk-")
        and not openai_key.startswith("sk-placeholder")
    )

    if has_gemini:
        provider = "gemini"
        active_model = settings.GEMINI_MODEL_NAME
    elif has_openai:
        provider = "openai"
        active_model = settings.OPENAI_MODEL_NAME
    else:
        provider = "rules"
        active_model = "expert-rule-engine-fallback"

    return SystemHealthResponse(
        status="healthy",
        service=settings.APP_NAME,
        vector_store="Qdrant Hybrid (Dense + BM25 Sparse RRF)",
        collection_name=settings.QDRANT_COLLECTION,
        indexed_documents=len(rag_pipeline.get_document_summaries()),
        openai_configured=has_openai,
        gemini_configured=has_gemini,
        llm_provider=provider,
        model=active_model,
        trades=["Structural", "Fire Safety", "Electrical", "Plumbing"],
        jurisdictions=["National", "California", "NYC"],
        document_types=["Code", "Project Spec", "Inspection Log"],
    )


@router.get("/documents", response_model=List[DocumentSummary], tags=["Knowledge Base"])
async def list_documents():
    """Returns list of indexed construction codes, project specs, and inspection reports."""
    return rag_pipeline.get_document_summaries()


@router.post(
    "/verify-compliance",
    response_model=ComplianceResponse,
    tags=["Compliance"],
    dependencies=[Depends(check_verify_rate_limit)],
)
async def verify_compliance(payload: ComplianceQueryRequest):
    """
    Evaluates field observation against authoritative construction codes.
    Executes hybrid dense + BM25 sparse search and returns grounded verdicts
    with source citations, verbatim quotes, and confidence scores.
    Rate-limited per client IP to safeguard API quota and resources.
    """
    try:
        response = rag_pipeline.verify_compliance(payload)

        # Record dynamically to live query history
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            history_item = QueryHistoryItem(
                id=f"h-{int(time.time() * 1000)}",
                query=payload.query,
                trade=payload.trade if payload.trade and payload.trade != "All" else "General",
                verdict=response.verdict.value,
                confidence=int(response.confidence_score * 100),
                date=now_iso,
                sources_count=len(response.citations),
                project_id="p1",
            )
            _query_history.insert(0, history_item)
            # Keep history to last 100 queries
            if len(_query_history) > 100:
                _query_history.pop()
        except Exception as log_err:
            logger.warning(f"Failed to record query to in-memory history: {log_err}")

        return response
    except Exception as e:
        logger.error(f"Error evaluating compliance: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Compliance verification engine encountered an internal error. Please consult system logs.",
        )


async def _stream_query_generator(payload: SimpleQueryRequest):
    """
    Asynchronous Server-Sent Events (SSE) generator for RAG query execution.
    Streams initial metadata, sources, and progressive answer tokens.
    """
    try:
        if not payload.question or not isinstance(payload.question, str) or not payload.question.strip():
            err_json = json.dumps({"detail": "Invalid request: 'question' must be a non-empty string."})
            yield f"event: error\ndata: {err_json}\n\n"
            return

        req = ComplianceQueryRequest(
            query=payload.question.strip(),
            trade=payload.trade or "All",
            jurisdiction=payload.jurisdiction or "All",
            document_type=payload.document_type or "All",
            top_k=payload.top_k or 5,
            conversation_history=payload.conversation_history or [],
        )

        response = rag_pipeline.verify_compliance(req)

        sources: List[Dict[str, Any]] = []
        if response.retrieved_chunks:
            for chunk in response.retrieved_chunks:
                sources.append({
                    "document": chunk.doc_title,
                    "document_filename": chunk.document_filename,
                    "chunk_id": chunk.chunk_id,
                    "chunk_index": chunk.chunk_index,
                    "clause_number": chunk.clause_number,
                    "page": chunk.page_or_section,
                    "trade": chunk.trade,
                    "direct_quote": chunk.text[:250] + ("..." if len(chunk.text) > 250 else ""),
                })

        is_refusal = (response.verdict == ComplianceVerdict.INSUFFICIENT_DATA)
        api_status = "refusal" if is_refusal else "success"

        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            history_item = QueryHistoryItem(
                id=f"h-{int(time.time() * 1000)}",
                query=payload.question.strip(),
                trade=payload.trade if payload.trade and payload.trade != "All" else "General",
                verdict=response.verdict.value if hasattr(response.verdict, "value") else str(response.verdict),
                confidence=int(response.confidence_score * 100),
                date=now_iso,
                sources_count=len(sources),
                project_id="p1",
            )
            _query_history.insert(0, history_item)
            if len(_query_history) > 100:
                _query_history.pop()
        except Exception as log_err:
            logger.warning(f"Failed to record streaming query to history: {log_err}")

        meta_payload = {
            "status": api_status,
            "verdict": response.verdict.value if hasattr(response.verdict, "value") else str(response.verdict),
            "confidence_score": response.confidence_score,
            "summary": response.summary,
            "technical_analysis": response.technical_analysis,
            "sources": sources,
            "citations": [c.model_dump() if hasattr(c, "model_dump") else c.dict() for c in response.citations],
            "recommended_actions": response.recommended_actions,
            "metadata": response.search_metadata,
        }
        yield f"event: metadata\ndata: {json.dumps(meta_payload)}\n\n"

        answer_text = f"{response.summary}\n\n{response.technical_analysis}"
        words = answer_text.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            token_payload = json.dumps({"token": token, "index": i})
            yield f"event: token\ndata: {token_payload}\n\n"
            await asyncio.sleep(0.012)

        yield f"event: done\ndata: {json.dumps({'status': 'completed'})}\n\n"
    except Exception as e:
        logger.error(f"Error streaming query: {e}", exc_info=True)
        err_payload = json.dumps({"detail": "An internal server error occurred while streaming query."})
        yield f"event: error\ndata: {err_payload}\n\n"


@router.post(
    "/query/stream",
    tags=["Compliance"],
    dependencies=[Depends(check_verify_rate_limit)],
)
async def process_query_stream(payload: SimpleQueryRequest):
    """
    Evaluates user question against RAG pipeline and returns progressive SSE stream.
    """
    return StreamingResponse(
        _stream_query_generator(payload),
        media_type="text/event-stream",
    )


@router.post(
    "/query",
    tags=["Compliance"],
    dependencies=[Depends(check_verify_rate_limit)],
)
async def process_query(payload: SimpleQueryRequest):
    """
    Evaluates user question against the authoritative RAG pipeline.
    Supports both non-streaming JSON responses and streaming SSE.
    """
    if payload.stream:
        return StreamingResponse(
            _stream_query_generator(payload),
            media_type="text/event-stream",
        )

    # 1. Validate question input
    if not payload.question or not isinstance(payload.question, str) or not payload.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request: 'question' must be a non-empty string.",
        )

    try:
        req = ComplianceQueryRequest(
            query=payload.question.strip(),
            trade=payload.trade or "All",
            jurisdiction=payload.jurisdiction or "All",
            document_type=payload.document_type or "All",
            top_k=payload.top_k or 5,
            conversation_history=payload.conversation_history or [],
        )

        response = rag_pipeline.verify_compliance(req)

        # Build sources array
        sources: List[QuerySourceInfo] = []
        if response.retrieved_chunks:
            for chunk in response.retrieved_chunks:
                sources.append(
                    QuerySourceInfo(
                        document=chunk.doc_title,
                        document_filename=chunk.document_filename,
                        chunk_id=chunk.chunk_id,
                        chunk_index=chunk.chunk_index,
                        clause_number=chunk.clause_number,
                        page=chunk.page_or_section,
                        trade=chunk.trade,
                        direct_quote=chunk.text[:250] + ("..." if len(chunk.text) > 250 else ""),
                    )
                )

        # Determine status: "refusal" if safe refusal / insufficient data triggered, else "success"
        is_refusal = (response.verdict == ComplianceVerdict.INSUFFICIENT_DATA)
        api_status = "refusal" if is_refusal else "success"

        # Record dynamically to query history
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            history_item = QueryHistoryItem(
                id=f"h-{int(time.time() * 1000)}",
                query=payload.question.strip(),
                trade=payload.trade if payload.trade and payload.trade != "All" else "General",
                verdict=response.verdict.value,
                confidence=int(response.confidence_score * 100),
                date=now_iso,
                sources_count=len(sources),
                project_id="p1",
            )
            _query_history.insert(0, history_item)
            if len(_query_history) > 100:
                _query_history.pop()
        except Exception as log_err:
            logger.warning(f"Failed to record query to in-memory history: {log_err}")

        # Synthesize clear answer text combining verdict summary & technical analysis
        answer_text = f"{response.summary}\n\n{response.technical_analysis}"

        return StructuredQueryResponse(
            status=api_status,
            answer=answer_text,
            verdict=response.verdict,
            confidence_score=response.confidence_score,
            summary=response.summary,
            technical_analysis=response.technical_analysis,
            sources=sources,
            citations=response.citations,
            recommended_actions=response.recommended_actions,
            metadata=response.search_metadata,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing /api/query: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred while processing the query.",
        )


@router.get("/history", response_model=List[QueryHistoryItem], tags=["Compliance"])
async def get_query_history():
    """Returns dynamic query history of all compliance checks evaluated by SiteSafe."""
    return _query_history


@router.get("/projects", response_model=List[ProjectSummary], tags=["Projects"])
async def get_active_projects():
    """Returns active projects and their code compliance portfolio."""
    return _projects_store


@router.post("/projects", response_model=ProjectSummary, status_code=status.HTTP_201_CREATED, tags=["Projects"])
async def create_project(req: CreateProjectRequest):
    """Creates a new construction project portfolio."""
    clean_name = req.name.strip()
    clean_loc = req.location.strip()
    slug = re.sub(r"[^a-zA-Z0-9]", "", clean_name)[:8].lower() or "site"
    new_id = f"proj-{int(time.time())}-{slug}"

    project = ProjectSummary(
        id=new_id,
        name=clean_name,
        location=clean_loc,
        status=req.status or "active",
        document_count=0,
        last_updated=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        compliance_score=100,
        active_codes=req.active_codes if req.active_codes else ["IBC 2024", "NFPA 70 / NEC 2023"],
    )
    _projects_store.append(project)
    return project


@router.delete("/projects/{project_id}", response_model=DeleteProjectResponse, tags=["Projects"])
async def delete_project(project_id: str):
    """Deletes a project portfolio by ID and clears associated records."""
    global _projects_store, _inspections_store
    initial_len = len(_projects_store)
    _projects_store = [p for p in _projects_store if p.id != project_id]
    if len(_projects_store) == initial_len:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    # Clean up associated inspections
    _inspections_store = [i for i in _inspections_store if i.project_id != project_id]

    return DeleteProjectResponse(
        status="success",
        message=f"Project '{project_id}' was successfully deleted.",
        deleted_id=project_id,
    )



@router.get("/inspections", response_model=List[InspectionFinding], tags=["Inspections"])
async def get_inspections():
    """Returns active jobsite inspection audits, NCRs, and test reports."""
    return _inspections_store


async def _handle_file_upload(file: UploadFile) -> IngestResponse:
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing file in upload request.",
        )

    raw_filename = file.filename.strip()

    # Defend against Path Traversal (strip directories, restrict characters)
    basename = os.path.basename(raw_filename).strip()
    clean_filename = re.sub(r"[^a-zA-Z0-9_.-]", "_", basename)
    if not clean_filename or clean_filename.startswith("."):
        clean_filename = f"upload_{clean_filename.lstrip('.') or 'doc.txt'}"

    ext = os.path.splitext(clean_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format '{ext}'. Supported formats are: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Validate Content-Type / MIME Type
    content_type = (file.content_type or "").lower().split(";")[0].strip()
    valid_mimes = ALLOWED_MIME_TYPES.get(ext, set())
    if content_type and valid_mimes and content_type not in valid_mimes:
        logger.warning(f"MIME type mismatch for file '{clean_filename}': {content_type} not in {valid_mimes}")
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Invalid MIME type '{content_type}' for {ext} file.",
        )

    # Read content with strict size limitation (protect against DoS / memory exhaustion)
    try:
        content_bytes = await file.read(MAX_UPLOAD_SIZE + 1)
        if len(content_bytes) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE // (1024 * 1024)}MB.",
            )
        if len(content_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file uploaded. Please provide a valid non-empty document.",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded file content.",
        )

    # Magic byte validation to prevent disguised executables
    if ext == ".pdf":
        if not content_bytes.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF structure: Missing %PDF header.",
            )
    elif ext in {".txt", ".md", ".html", ".htm"}:
        if content_bytes.startswith(b"MZ") or content_bytes.startswith(b"\x7fELF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Binary executable files are strictly prohibited.",
            )

    # Save to a temporary file for parsing & indexing
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(content_bytes)
        tmp_path = tmp.name

    try:
        indexed_count, err = rag_pipeline.ingest_single_file(tmp_path, original_filename=clean_filename)
        if err:
            logger.error(f"Document processing or vector indexing failed for '{clean_filename}': {err}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Document parsing or vector indexing failed.",
            )

        # Securely copy to corpus directory with boundary check
        if os.path.exists(settings.CORPUS_DIR):
            corpus_dir_abs = os.path.abspath(settings.CORPUS_DIR)
            target_path = os.path.abspath(os.path.join(corpus_dir_abs, clean_filename))
            if not target_path.startswith(corpus_dir_abs + os.sep):
                logger.error(f"Path traversal detected: {target_path} is outside {corpus_dir_abs}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid filename: Path traversal attempt rejected.",
                )
            shutil.copy2(tmp_path, target_path)

        return IngestResponse(
            status="success",
            message=f"Document '{clean_filename}' successfully uploaded, processed, and indexed.",
            filename=clean_filename,
            documents_ingested=1,
            chunks_indexed=indexed_count,
            errors=[],
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post(
    "/upload",
    response_model=IngestResponse,
    tags=["Ingestion"],
    dependencies=[Depends(check_upload_rate_limit)],
)
async def upload_document(file: UploadFile = File(...)):
    """
    Public document upload endpoint for runtime ingestion and indexing.
    Processes uploaded PDF, Markdown, HTML, or Text files, extracts chunks,
    generates embeddings, and indexes content into live vector database for immediate searchability.
    """
    return await _handle_file_upload(file)


@router.post(
    "/ingest/upload",
    response_model=IngestResponse,
    tags=["Ingestion"],
    dependencies=[Depends(verify_ingest_api_key), Depends(check_upload_rate_limit)],
)
async def upload_and_ingest_document(file: UploadFile = File(...)):
    """
    Secure document upload endpoint with API key verification and rate limiting.
    """
    return await _handle_file_upload(file)


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal re-indexing failure occurred. Please consult server logs.",
        )


@router.get("/stats", response_model=CorpusStats, tags=["Knowledge Base"])
async def get_corpus_statistics():
    """Returns dataset metrics, total chunks, and trade breakdown."""
    return rag_pipeline.get_corpus_stats()
