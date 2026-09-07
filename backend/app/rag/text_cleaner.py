"""
Text Cleaning, Boilerplate Stripping, and Hyphenation Healing Engine.
Preserves Markdown tables, legal formatting, and clause structure.
"""

import re
import unicodedata
from typing import List, Dict, Any, Optional

DEFAULT_BOILERPLATE_PATTERNS = [
    # Page numbers: Page 12 of 340, Page 12, - 12 -, [Page 12], PAGE 142 OF 850
    r"(?i)(?:page\s+\d+(?:\s+of\s+\d+)?|\[page\s+\d+\]|^\s*-\s*\d+\s*-\s*$)",
    # Confidentiality and project disclaimers
    r"(?i)CONFIDENTIAL\s*-\s*.*(?:SPECIFICATIONS|PROJECT|USE ONLY).*",
    r"(?i)FOR\s+INTERNAL\s+CONSTRUCTION\s+USE\s+ONLY.*",
    # Repeated statutory document headers
    r"(?i)2021\s+INTERNATIONAL\s+BUILDING\s+CODE[®\s]*",
    r"(?i)CALIFORNIA\s+BUILDING\s+CODE\s*-\s*TITLE\s+24.*",
    # Breadcrumbs from HTML exports
    r"(?i)Home\s*>\s*Title\s+24\s*>\s*Chapter\s+\d+.*",
]


class DocumentCleaner:
    def __init__(self, boilerplate_patterns: Optional[List[str]] = None):
        patterns = boilerplate_patterns or DEFAULT_BOILERPLATE_PATTERNS
        self.compiled_boilerplate = [re.compile(p, re.MULTILINE) for p in patterns]

    def normalize_unicode(self, text: str) -> str:
        """Applies Unicode NFKC normalization and standardizes typographic symbols."""
        if not text:
            return ""

        normalized = unicodedata.normalize("NFKC", text)
        normalized = normalized.replace("\u00a0", " ").replace("\u200b", "")

        quote_map = {
            "“": '"', "”": '"', "„": '"',
            "‘": "'", "’": "'", "‚": "'", "`": "'",
            "—": "-", "–": "-", "―": "-",
        }
        for char, replacement in quote_map.items():
            normalized = normalized.replace(char, replacement)

        return normalized

    def strip_boilerplate(self, text: str, custom_patterns: Optional[List[str]] = None) -> str:
        """Strips running headers, footers, page numbers, and disclaimers."""
        if not text:
            return ""

        patterns = self.compiled_boilerplate
        if custom_patterns:
            patterns = patterns + [re.compile(p, re.MULTILINE) for p in custom_patterns]

        cleaned = text
        for pattern in patterns:
            cleaned = pattern.sub("", cleaned)

        return cleaned

    def fix_broken_hyphenations(self, text: str) -> str:
        """Heals hyphenated words split across line breaks (e.g. fire-re-\\nsistance -> fire-resistance)."""
        if not text:
            return ""

        # Simple split: "re-\nquirements" -> "requirements"
        healed = re.sub(r"(\b[a-zA-Z]+)-\s*\n\s*([a-zA-Z]+\b)", r"\1\2", text)
        # Compound split: "fire-re-\nsistance" -> "fire-resistance"
        healed = re.sub(r"(\b[a-zA-Z]+-[a-zA-Z]+)-\s*\n\s*([a-zA-Z]+\b)", r"\1\2", healed)
        return healed

    def normalize_whitespace(self, text: str) -> str:
        """
        Normalizes line breaks and collapses runaway newlines,
        carefully preserving markdown table syntax (| col1 | col2 |).
        """
        if not text:
            return ""

        normalized = text.replace("\r\n", "\n").replace("\r", "\n")

        lines = normalized.split("\n")
        cleaned_lines = []

        for line in lines:
            stripped = line.strip()
            # If line is part of a markdown table, preserve internal spacing/pipes
            if stripped.startswith("|") and stripped.endswith("|"):
                cleaned_lines.append(stripped)
            else:
                # Collapse excessive horizontal spaces
                cleaned_line = re.sub(r"[ \t]+", " ", stripped)
                cleaned_lines.append(cleaned_line)

        reconstructed = "\n".join(cleaned_lines)
        # Collapse 3 or more consecutive newlines to double newlines
        reconstructed = re.sub(r"\n{3,}", "\n\n", reconstructed)
        return reconstructed.strip()

    def clean_document(self, text: Any, custom_patterns: Optional[List[str]] = None) -> str:
        """Runs the complete cleaning pipeline deterministically."""
        if text is None:
            return ""
        if not isinstance(text, str):
            text = str(text)

        step1 = self.normalize_unicode(text)
        step2 = self.strip_boilerplate(step1, custom_patterns)
        step3 = self.fix_broken_hyphenations(step2)
        step4 = self.normalize_whitespace(step3)
        return step4

    def clean_corpus(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch cleans a list of raw document dictionaries with audit metrics."""
        cleaned_docs = []
        for doc in documents:
            raw = doc.get("raw_content", "") or doc.get("content", "") or ""
            cleaned = self.clean_document(raw)

            raw_len = len(raw)
            cleaned_len = len(cleaned)
            comp_ratio = round(1.0 - (cleaned_len / raw_len), 4) if raw_len > 0 else 0.0

            meta = dict(doc.get("metadata", {}))
            meta["raw_char_count"] = raw_len
            meta["cleaned_char_count"] = cleaned_len
            meta["compression_ratio"] = comp_ratio

            cleaned_docs.append({
                "doc_id": doc.get("doc_id", ""),
                "source": doc.get("source", ""),
                "content": cleaned,
                "metadata": meta,
            })
        return cleaned_docs
