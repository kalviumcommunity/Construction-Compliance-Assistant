"""
Multi-Format Document Ingestion Engine for SiteSafe Compliance RAG.

Tasks Covered:
- Task 1: Standardized LoadedDocument model & format parsers (PDF, HTML, MD, TXT).
- Task 2: Error handling & graceful degradation for corrupt, unreadable, or unsupported files.
- Task 3: Source identity tracking for precise citation references.
- Task 4: Intake confirmation inspection utility with formatted console reporting.
"""

import os
import sys
import uuid
import hashlib
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

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
        return snippet[:100] + ("..." if len(snippet) > 100 else "")


class DocumentLoader:
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = base_dir or os.getcwd()

    def parse_pdf(self, file_path: str, rel_path: str) -> LoadedDocument:
        """Extracts text from PDF file page-by-page using pypdf."""
        if not PdfReader:
            raise ImportError("pypdf package is required for PDF parsing.")

        try:
            reader = PdfReader(file_path)
            if len(reader.pages) == 0:
                raise ValueError("PDF file contains 0 pages or empty stream.")

            extracted_pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    extracted_pages.append(text.strip())

            full_text = "\n\n".join(extracted_pages).strip()
            if not full_text:
                # If page extraction returned blank text stream
                raise ValueError("Unable to extract text stream from PDF pages.")

            stat = os.stat(file_path)
            doc_id = hashlib.sha256(f"{rel_path}_{stat.st_size}".encode()).hexdigest()[:16]

            return LoadedDocument(
                doc_id=doc_id,
                content=full_text,
                source=rel_path,
                file_type="pdf",
                metadata={
                    "page_count": len(reader.pages),
                    "byte_size": stat.st_size,
                    "filename": os.path.basename(file_path)
                }
            )
        except Exception as e:
            raise ValueError(f"Unable to extract page stream: {str(e)}")

    def parse_html(self, file_path: str, rel_path: str) -> LoadedDocument:
        """Parses HTML file using BeautifulSoup, stripping scripts, styles, and navigation."""
        if not BeautifulSoup:
            raise ImportError("beautifulsoup4 package is required for HTML parsing.")

        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            raw_html = f.read()

        soup = BeautifulSoup(raw_html, "html.parser")

        # Strip unneeded elements
        for element in soup(["script", "style", "nav", "header", "footer", "head"]):
            element.decompose()

        clean_text = soup.get_text(separator="\n", strip=True)
        stat = os.stat(file_path)
        doc_id = hashlib.sha256(f"{rel_path}_{stat.st_size}".encode()).hexdigest()[:16]

        title = soup.title.string if soup.title else os.path.basename(file_path)

        return LoadedDocument(
            doc_id=doc_id,
            content=clean_text,
            source=rel_path,
            file_type="html",
            metadata={
                "title": title,
                "byte_size": stat.st_size,
                "filename": os.path.basename(file_path)
            }
        )

    def parse_markdown_txt(self, file_path: str, rel_path: str, ext: str) -> LoadedDocument:
        """Reads plain text / markdown file with UTF-8 normalization."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(file_path, "r", encoding="latin-1", errors="replace") as f:
                content = f.read()

        stat = os.stat(file_path)
        doc_id = hashlib.sha256(f"{rel_path}_{stat.st_size}".encode()).hexdigest()[:16]

        return LoadedDocument(
            doc_id=doc_id,
            content=content.strip(),
            source=rel_path,
            file_type=ext.replace(".", ""),
            metadata={
                "byte_size": stat.st_size,
                "filename": os.path.basename(file_path)
            }
        )

    def load_file(self, file_path: str) -> LoadedDocument:
        """Loads a single document file with format routing and error checks."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file extension '{ext}'")

        rel_path = os.path.relpath(file_path, self.base_dir).replace("\\", "/")

        if ext == ".pdf":
            return self.parse_pdf(file_path, rel_path)
        elif ext in {".html", ".htm"}:
            return self.parse_html(file_path, rel_path)
        elif ext in {".md", ".txt"}:
            return self.parse_markdown_txt(file_path, rel_path, ext)
        else:
            raise ValueError(f"No parser available for extension '{ext}'")

    def load_directory(self, dir_path: str) -> List[LoadedDocument]:
        """Scans directory and loads supported documents, gracefully handling failures."""
        if not os.path.exists(dir_path):
            logger.error(f"Directory path does not exist: {dir_path}")
            return []

        loaded_documents = []

        for root, _, files in os.walk(dir_path):
            for file_name in files:
                full_path = os.path.join(root, file_name)
                rel_path = os.path.relpath(full_path, self.base_dir).replace("\\", "/")
                ext = os.path.splitext(file_name)[1].lower()

                # Filter unsupported extensions
                if ext not in SUPPORTED_EXTENSIONS:
                    logger.warning(f"[SKIPPED - UNSUPPORTED FORMAT]: {rel_path} - Extension '{ext}' not in supported list")
                    continue

                # Load with defensive error handling
                try:
                    doc = self.load_file(full_path)
                    loaded_documents.append(doc)
                    logger.info(f"[SUCCESSFUL INTAKE]: {rel_path} ({doc.file_type.upper()}, {doc.word_count} words)")
                except Exception as e:
                    logger.warning(f"[SKIPPED - PARSE FAILURE]: {rel_path} - {str(e)}")

        return loaded_documents


# ---------------------------------------------------------------------------
# Task 4: Intake Confirmation & Inspection Utility
# ---------------------------------------------------------------------------

def confirm_intake(documents: List[LoadedDocument]):
    """Prints a formatted console table summarizing ingested document metrics and text previews."""
    print("\n" + "=" * 105)
    print("SITESAFE DOCUMENT INTAKE CONFIRMATION & INSPECTION REPORT")
    print("=" * 105)

    header_fmt = "{:<35} | {:<8} | {:<7} | {:<7} | {:<40}"
    row_fmt = "{:<35} | {:<8} | {:<7} | {:<7} | {:<40}"
    print(header_fmt.format("Document Source Path", "Format", "Chars", "Words", "Text Snippet Preview (First 100 Chars)"))
    print("-" * 115)

    for doc in documents:
        print(row_fmt.format(
            doc.source[:35],
            doc.file_type.upper(),
            doc.char_count,
            doc.word_count,
            doc.snippet_preview[:40]
        ))

    print("=" * 105)
    print(f"Total Successfully Ingested Documents: {len(documents)}")
    print("=" * 105)


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sample_corpus_dir = os.path.join(script_dir, "sample_corpus")

    print(f"Initializing Document Loader for directory: {sample_corpus_dir}")
    loader = DocumentLoader(base_dir=script_dir)
    docs = loader.load_directory(sample_corpus_dir)
    confirm_intake(docs)


if __name__ == "__main__":
    main()
