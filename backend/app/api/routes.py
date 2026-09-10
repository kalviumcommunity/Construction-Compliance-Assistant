"""
FastAPI REST API Routes for SiteSafe Compliance Verification Assistant.
"""

import os
import re
import shutil
import tempfile
import time
from datetime import datetime, timezone
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Request

from app.config import settings
from app.models.schemas import (
    ComplianceQueryRequest,
    ComplianceResponse,
    DocumentSummary,
    SystemHealthResponse,
    IngestResponse,
    CorpusStats,
    QueryHistoryItem,
    ProjectSummary,
    InspectionFinding,
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

_projects_store: List[ProjectSummary] = [
    ProjectSummary(
        id="p1",
        name="Skyline Commercial Tower",
        location="Seattle, WA",
        status="active",
        document_count=24,
        last_updated="2026-09-10",
        compliance_score=97,
        active_codes=["IBC 2021", "NFPA 70 / NEC 2023", "UPC 2024"],
    ),
    ProjectSummary(
        id="p2",
        name="Harbor Point Medical Pavilion",
        location="San Francisco, CA",
        status="active",
        document_count=18,
        last_updated="2026-09-09",
        compliance_score=94,
        active_codes=["CBC Title 24", "NFPA 101", "OSHPD 1"],
    ),
    ProjectSummary(
        id="p3",
        name="Midtown Mixed-Use Residences",
        location="New York, NY",
        status="completed",
        document_count=36,
        last_updated="2026-08-30",
        compliance_score=99,
        active_codes=["NYC Building Code 2022", "NEC 2020"],
    ),
]

_inspections_store: List[InspectionFinding] = [
    InspectionFinding(
        id="ir-2024-089",
        project_id="p1",
        date="2026-09-09",
        inspector="Sarah Jenkins (PE, QA/QC Lead)",
        status="Non-Compliant / NCR Issued",
        findings_count=1,
        trade="Electrical",
        description="Schedule 40 PVC conduit routed through plenum return air without metallic encasement.",
        clause_reference="NEC § 300.22(C)(1)",
    ),
    InspectionFinding(
        id="ir-2024-092",
        project_id="p1",
        date="2026-09-08",
        inspector="David Vance (Senior Structural Inspector)",
        status="Passed / Approved",
        findings_count=0,
        trade="Structural",
        description="28-day cylinder compressive strength breaks verified at 4,850 psi exceeding 4,000 psi design minimum.",
        clause_reference="Spec 03 30 00 § 3.2",
    ),
    InspectionFinding(
        id="ir-2024-095",
        project_id="p1",
        date="2026-09-07",
        inspector="Carlos Rivera (Plumbing Inspector)",
        status="Passed / Approved",
        findings_count=0,
        trade="Plumbing",
        description="Hydrostatic rough DWV water test held for 30 minutes at 42-foot head with zero measurable water loss.",
        clause_reference="UPC § 312.2",
    ),
]


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
        indexed_documents=total_docs or len(rag_pipeline.get_document_summaries()),
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


@router.get("/history", response_model=List[QueryHistoryItem], tags=["Compliance"])
async def get_query_history():
    """Returns dynamic query history of all compliance checks evaluated by SiteSafe."""
    return _query_history


@router.get("/projects", response_model=List[ProjectSummary], tags=["Projects"])
async def get_active_projects():
    """Returns active projects and their code compliance portfolio."""
    return _projects_store


@router.get("/inspections", response_model=List[InspectionFinding], tags=["Inspections"])
async def get_inspections():
    """Returns active jobsite inspection audits, NCRs, and test reports."""
    return _inspections_store


@router.post(
    "/ingest/upload",
    response_model=IngestResponse,
    tags=["Ingestion"],
    dependencies=[Depends(verify_ingest_api_key), Depends(check_upload_rate_limit)],
)
async def upload_and_ingest_document(file: UploadFile = File(...)):
    """
    Secure document upload endpoint with API key verification and rate limiting.
    Enforces strict MIME validation, magic byte checks, size limit, and path traversal defense.
    """
    raw_filename = file.filename or "uploaded_document.txt"

    # Defend against Path Traversal (strip directories, restrict characters)
    basename = os.path.basename(raw_filename).strip()
    clean_filename = re.sub(r"[^a-zA-Z0-9_.-]", "_", basename)
    if not clean_filename or clean_filename.startswith("."):
        clean_filename = f"upload_{clean_filename.lstrip('.') or 'doc.txt'}"

    ext = os.path.splitext(clean_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{ext}'. Supported formats are: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Validate Content-Type / MIME Type
    content_type = (file.content_type or "").lower().split(";")[0].strip()
    valid_mimes = ALLOWED_MIME_TYPES.get(ext, set())
    if content_type and content_type not in valid_mimes:
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
                detail="Empty file uploaded. Please provide a valid document.",
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
        # Ensure text files do not contain binary executable headers (PE MZ or ELF)
        if content_bytes.startswith(b"MZ") or content_bytes.startswith(b"\x7fELF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Binary executable files are strictly prohibited.",
            )

    # Save to a temporary file for defensive parsing
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(content_bytes)
        tmp_path = tmp.name

    try:
        indexed_count, err = rag_pipeline.ingest_single_file(tmp_path)
        if err:
            logger.warning(f"Document parsing error for '{clean_filename}': {err}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Document parsing failed. Ensure file content is valid and uncorrupted.",
            )

        # Securely copy to corpus directory with boundary check
        if os.path.exists(settings.CORPUS_DIR):
            corpus_dir_abs = os.path.abspath(settings.CORPUS_DIR)
            target_path = os.path.abspath(os.path.join(corpus_dir_abs, clean_filename))
            # Verify target strictly resides inside corpus directory
            if not target_path.startswith(corpus_dir_abs + os.sep):
                logger.error(f"Path traversal detected: {target_path} is outside {corpus_dir_abs}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid filename: Path traversal attempt rejected.",
                )
            shutil.copy2(tmp_path, target_path)

        return IngestResponse(
            status="success",
            message=f"Document '{clean_filename}' successfully ingested and indexed.",
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal re-indexing failure occurred. Please consult server logs.",
        )


@router.get("/stats", response_model=CorpusStats, tags=["Knowledge Base"])
async def get_corpus_statistics():
    """Returns dataset metrics, total chunks, and trade breakdown."""
    return rag_pipeline.get_corpus_stats()
