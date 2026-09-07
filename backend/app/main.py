"""
FastAPI Server Entry Point for SiteSafe Construction Compliance Assistant.
"""

import sys
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.config import settings
from app.api.routes import router
from app.rag.pipeline import rag_pipeline

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sitesafe.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes vector store and indexes authoritative corpus on startup."""
    logger.info("Starting up SiteSafe Construction Compliance Assistant...")
    try:
        count, errors = rag_pipeline.ingest_default_corpus(force_recreate=False)
        logger.info(f"Vector store ready: {count} chunks indexed in '{settings.QDRANT_COLLECTION}'.")
        if errors:
            logger.warning(f"Corpus ingestion notes: {errors}")
    except Exception as e:
        logger.error(f"Startup initialization error: {e}", exc_info=True)
    yield
    logger.info("Shutting down SiteSafe Construction Compliance Assistant.")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Production-grade Construction Regulatory Compliance RAG Application. "
        "Verifies field conditions against statutory Building Codes (IBC, NEC, UPC), "
        "Project Specifications, and Historical Inspection Logs with strict context grounding, "
        "precise source citations, and deterministic safe refusal."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS middleware for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
