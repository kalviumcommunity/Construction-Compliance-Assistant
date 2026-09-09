"""
Multi-Format Document Ingestion Engine with Defensive Integrity Checks.
Supports PDF, HTML, Markdown, and Plain Text files.
Gracefully handles corrupted, zero-byte, or unsupported files without halting pipelines.
"""

import os
import hashlib
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple

try:
    from pypdf import PdfReader
    logging.getLogger("pypdf").setLevel(logging.ERROR)
except ImportError:
    PdfReader = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

logger = logging.getLogger("sitesafe.loader")

SUPPORTED_EXTENSIONS = {".pdf", ".html", ".htm", ".md", ".txt"}


@dataclass
class LoadedDocument:
    doc_id: str
    content: str
    source: str
    file_type: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def char_count(self) -> int:
        return len(self.content)

    @property
    def word_count(self) -> int:
        return len(self.content.split())

    @property
    def snippet_preview(self) -> str:
        snippet = " ".join(self.content.split())
        return snippet[:120] + ("..." if len(snippet) > 120 else "")


class DocumentLoader:
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = base_dir or os.getcwd()

    def _check_file_integrity(self, file_path: str) -> os.stat_result:
        """Verifies file existence and ensures file is not 0 bytes."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File does not exist: {file_path}")
        stat = os.stat(file_path)
        if stat.st_size == 0:
            raise ValueError(f"Zero-byte empty file detected: {file_path}")
        return stat

    def parse_pdf(self, file_path: str, rel_path: str) -> LoadedDocument:
        """Extracts text page-by-page from PDF files using pypdf."""
        stat = self._check_file_integrity(file_path)
        if not PdfReader:
            raise ImportError("pypdf is required for PDF parsing.")

        try:
            reader = PdfReader(file_path)
            if len(reader.pages) == 0:
                raise ValueError("PDF file contains 0 pages.")

            extracted_pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    extracted_pages.append(text.strip())

            full_text = "\n\n".join(extracted_pages).strip()
            if not full_text:
                raise ValueError("PDF contains no extractable text (scanned image or empty streams).")

            doc_id = hashlib.sha256(f"{rel_path}_{stat.st_size}".encode()).hexdigest()[:16]
            title = os.path.splitext(os.path.basename(file_path))[0].replace("_", " ").title()

            return LoadedDocument(
                doc_id=doc_id,
                content=full_text,
                source=rel_path,
                file_type="pdf",
                metadata={
                    "title": title,
                    "page_count": len(reader.pages),
                    "byte_size": stat.st_size,
                    "filename": os.path.basename(file_path),
                },
            )
        except Exception as e:
            raise ValueError(f"Corrupted or invalid PDF structure: {str(e)}")

    def parse_html(self, file_path: str, rel_path: str) -> LoadedDocument:
        """Extracts sanitized readable text from HTML documents."""
        stat = self._check_file_integrity(file_path)
        if not BeautifulSoup:
            raise ImportError("beautifulsoup4 is required for HTML parsing.")

        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                raw_html = f.read()

            soup = BeautifulSoup(raw_html, "html.parser")
            for element in soup(["script", "style", "nav", "header", "footer", "head"]):
                element.decompose()

            clean_text = soup.get_text(separator="\n", strip=True)
            if not clean_text:
                raise ValueError("HTML file contained no extractable body text.")

            doc_id = hashlib.sha256(f"{rel_path}_{stat.st_size}".encode()).hexdigest()[:16]
            title = soup.title.string.strip() if soup.title and soup.title.string else os.path.basename(file_path)

            return LoadedDocument(
                doc_id=doc_id,
                content=clean_text,
                source=rel_path,
                file_type="html",
                metadata={
                    "title": title,
                    "byte_size": stat.st_size,
                    "filename": os.path.basename(file_path),
                },
            )
        except Exception as e:
            raise ValueError(f"HTML parsing failed: {str(e)}")

    def parse_markdown_txt(self, file_path: str, rel_path: str, ext: str) -> LoadedDocument:
        """Loads Markdown or Text files with encoding recovery."""
        stat = self._check_file_integrity(file_path)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(file_path, "r", encoding="latin-1", errors="replace") as f:
                content = f.read()

        clean_content = content.strip()
        if not clean_content:
            raise ValueError("File contains only whitespace or is empty.")

        doc_id = hashlib.sha256(f"{rel_path}_{stat.st_size}".encode()).hexdigest()[:16]
        title = os.path.splitext(os.path.basename(file_path))[0].replace("_", " ").title()

        return LoadedDocument(
            doc_id=doc_id,
            content=clean_content,
            source=rel_path,
            file_type=ext.replace(".", ""),
            metadata={
                "title": title,
                "byte_size": stat.st_size,
                "filename": os.path.basename(file_path),
            },
        )

    def _get_rel_path(self, file_path: str) -> str:
        """Returns relative path or filename if cross-drive on Windows."""
        try:
            return os.path.relpath(file_path, self.base_dir).replace("\\", "/")
        except ValueError:
            return os.path.basename(file_path)

    def load_file(self, file_path: str) -> LoadedDocument:
        """Loads a single document file with automatic format routing and error checks."""
        self._check_file_integrity(file_path)
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file format '{ext}'. Supported: {SUPPORTED_EXTENSIONS}")

        rel_path = self._get_rel_path(file_path)

        if ext == ".pdf":
            return self.parse_pdf(file_path, rel_path)
        elif ext in {".html", ".htm"}:
            return self.parse_html(file_path, rel_path)
        elif ext in {".md", ".txt"}:
            return self.parse_markdown_txt(file_path, rel_path, ext)
        else:
            raise ValueError(f"No parser available for extension '{ext}'")

    def load_directory(self, dir_path: str) -> Tuple[List[LoadedDocument], List[Dict[str, str]]]:
        """
        Recursively scans directory and loads documents.
        Returns tuple of (loaded_documents, failed_documents).
        """
        if not os.path.exists(dir_path):
            logger.warning(f"Corpus directory does not exist: {dir_path}")
            return [], [{"file": dir_path, "error": "Directory does not exist"}]

        loaded: List[LoadedDocument] = []
        failures: List[Dict[str, str]] = []

        for root, _, files in os.walk(dir_path):
            for file_name in files:
                full_path = os.path.join(root, file_name)
                rel_path = self._get_rel_path(full_path)
                ext = os.path.splitext(file_name)[1].lower()

                if ext not in SUPPORTED_EXTENSIONS:
                    logger.info(f"[SKIPPED UNSUPPORTED] {rel_path} ({ext})")
                    failures.append({"file": rel_path, "error": f"Unsupported format '{ext}'"})
                    continue

                try:
                    doc = self.load_file(full_path)
                    loaded.append(doc)
                    logger.info(f"[LOADED] {rel_path} ({doc.char_count} chars)")
                except Exception as e:
                    logger.warning(f"[CORRUPTION DETECTED] {rel_path}: {str(e)}")
                    failures.append({"file": rel_path, "error": str(e)})

        return loaded, failures
