"""
Configuration Settings for SiteSafe Construction Compliance Assistant.
"""

import os
from typing import List
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # App Settings
    BASE_DIR: str = str(BASE_DIR)
    APP_NAME: str = "SiteSafe Construction Compliance Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server Settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Security & Rate Limiting
    INGEST_API_KEY: str = "sitesafe-admin-key-2026"
    RATE_LIMIT_UPLOAD_PER_MINUTE: int = 15

    # Storage & Vector DB
    QDRANT_COLLECTION: str = "construction_compliance"
    QDRANT_PATH: str = os.path.join(BASE_DIR, "qdrant_storage")
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""

    # Document Corpus Directory
    CORPUS_DIR: str = os.path.join(BASE_DIR, "corpus")

    # LLM & Embedding Settings
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL_NAME: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    FASTEMBED_DENSE_MODEL: str = "BAAI/bge-small-en-v1.5"
    FASTEMBED_SPARSE_MODEL: str = "Qdrant/bm25"

    # Chunking Configuration
    CHUNK_SIZE_TOKENS: int = 300
    CHUNK_OVERLAP_TOKENS: int = 50
    TIKTOKEN_ENCODING: str = "o200k_base"

    class Config:
        env_file = os.path.join(BASE_DIR, ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
