"""
Text Cleaning, Boilerplate Stripping, & Hyphenation Healing Engine for SiteSafe RAG.

Tasks Covered:
- Task 1 & 2: DocumentCleaner module with Unicode NFKC normalization, boilerplate stripping,
  line-wrap hyphenation healing, and whitespace collapse.
- Task 3: Batch corpus cleaning pipeline with metadata metrics tracking.
- Task 4: Before & After verification suite with 3 realistic noisy construction fixtures.
- Task 5: Zero-dependency standard library implementation.
"""

import re
import unicodedata
from typing import List, Dict, Any, Optional

# Standard boilerplate patterns in statutory codes, specs, and municipal exports
DEFAULT_BOILERPLATE_PATTERNS = [
    # Page numbers: Page 12 of 340, Page 12, - 12 -, [Page 12], PAGE 142 OF 850
    r"(?i)(?:page\s+\d+(?:\s+of\s+\d+)?|\[page\s+\d+\]|^\s*-\s*\d+\s*-\s*$)",
    # Confidentiality and corporate disclaimers
    r"(?i)CONFIDENTIAL\s*-\s*TOWER\s+B\s+SPECIFICATIONS.*",
    r"(?i)FOR\s+INTERNAL\s+CONSTRUCTION\s+USE\s+ONLY.*",
    # Repeated statutory document headers
    r"(?i)2021\s+INTERNATIONAL\s+BUILDING\s+CODE[®\s]*",
    r"(?i)CALIFORNIA\s+BUILDING\s+CODE\s*-\s*TITLE\s+24.*",
    # Breadcrumbs from HTML exports
    r"(?i)Home\s*>\s*Title\s+24\s*>\s*Chapter\s+\d+.*"
]


class DocumentCleaner:
    def __init__(self, boilerplate_patterns: Optional[List[str]] = None):
        patterns = boilerplate_patterns or DEFAULT_BOILERPLATE_PATTERNS
        self.compiled_boilerplate = [re.compile(p, re.MULTILINE) for p in patterns]

    def normalize_unicode(self, text: str) -> str:
        """Applies Unicode NFKC normalization and replaces non-standard characters."""
        if not text:
            return ""

        # Apply Unicode NFKC normalization
        normalized = unicodedata.normalize("NFKC", text)

        # Replace non-breaking spaces and zero-width spaces
        normalized = normalized.replace("\u00a0", " ").replace("\u200b", "")

        # Normalize curly/typographer quotes to standard ASCII equivalents
        quote_map = {
            "“": '"', "”": '"', "„": '"',
            "‘": "'", "’": "'", "‚": "'", "`": "'",
            "—": "-", "–": "-", "―": "-"
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

        # Case 1: Word split across newline with hyphen at end of line (e.g. "re-\nquirements" -> "requirements")
        # Matches lowercase/uppercase letter + hyphen + newline + spaces + lowercase letter
        healed = re.sub(r"(\b[a-zA-Z]+)-\s*\n\s*([a-zA-Z]+\b)", r"\1\2", text)

        # Case 2: Multi-syllable compound broken across line break (e.g. "fire-re-\nsistance" -> "fire-resistance")
        healed = re.sub(r"(\b[a-zA-Z]+-[a-zA-Z]+)-\s*\n\s*([a-zA-Z]+\b)", r"\1\2", healed)

        return healed

    def normalize_whitespace(self, text: str) -> str:
        """Normalizes line breaks, collapses multi-spaces, and strips runaway newlines."""
        if not text:
            return ""

        # Convert carriage returns \r\n to standard \n
        normalized = text.replace("\r\n", "\n").replace("\r", "\n")

        # Collapse multiple horizontal spaces/tabs into a single space per line
        normalized = re.sub(r"[ \t]+", " ", normalized)

        # Strip space at start and end of each line
        lines = [line.strip() for line in normalized.split("\n")]
        normalized = "\n".join(lines)

        # Collapse 3 or more consecutive newlines into standard double newlines (\n\n)
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)

        return normalized.strip()

    def clean_document(self, text: Any, custom_patterns: Optional[List[str]] = None) -> str:
        """Executes full cleaning pipeline deterministically."""
        if text is None:
            return ""
        if not isinstance(text, str):
            text = str(text)

        t1 = self.normalize_unicode(text)
        t2 = self.strip_boilerplate(t1, custom_patterns)
        t3 = self.fix_broken_hyphenations(t2)
        t4 = self.normalize_whitespace(t3)
        return t4


def clean_corpus(documents: List[Dict[str, Any]], cleaner: Optional[DocumentCleaner] = None) -> List[Dict[str, Any]]:
    """Applies DocumentCleaner across a batch of document records with metadata enrichment."""
    engine = cleaner or DocumentCleaner()
    cleaned_docs = []

    for doc in documents:
        raw_content = doc.get("raw_content", "") or ""
        cleaned_content = engine.clean_document(raw_content)

        raw_len = len(raw_content)
        cleaned_len = len(cleaned_content)
        comp_ratio = round(1.0 - (cleaned_len / raw_len), 4) if raw_len > 0 else 0.0

        meta = dict(doc.get("metadata", {}))
        meta["raw_char_count"] = raw_len
        meta["cleaned_char_count"] = cleaned_len
        meta["compression_ratio"] = comp_ratio

        cleaned_docs.append({
            "doc_id": doc.get("doc_id", ""),
            "source": doc.get("source", ""),
            "content": cleaned_content,
            "metadata": meta
        })

    return cleaned_docs


# ---------------------------------------------------------------------------
# Task 4: Before & After Verification Suite
# ---------------------------------------------------------------------------

FIXTURE_A_PDF_CODE = """2021 INTERNATIONAL BUILDING CODE®
Page 142 of 850

IBC 2021 Section 705.8: Exterior walls of Type V-A con-
struction located less than 5 feet from the lot line shall have a minimum fire-re-
sistance rat-
ing of 1 hour and must have 0%\u00a0unprotected openings.

- 142 -
"""

FIXTURE_B_HTML_ZONING = """Home > Title 24 > Chapter 7 > Municipal Zoning Export

Municipal Zoning Bylaws Section 4.2:
All commercial structures built within Zone C-2 must maintain a \u201csetback\u201d distance of 15 feet.



Table 4.2.1: Side Setbacks
Zone C-2 Commercial: 5.0 feet.
"""

FIXTURE_C_SITE_SPEC = """SECTION 03 30 00 - CAST-IN-PLACE CONCRETE
CONFIDENTIAL - TOWER B SPECIFICATIONS - FOR INTERNAL USE ONLY

1.1 PERFORMANCE REQUIREMENTS
A. Structural concrete footings shall achieve f'c = 4,000 psi.\t\t\tSlump range: 4 inches +/- 1 inch.

CONFIDENTIAL - TOWER B SPECIFICATIONS - FOR INTERNAL USE ONLY
"""


def run_verification_suite():
    cleaner = DocumentCleaner()

    print("=" * 95)
    print("SITESAFE TEXT CLEANING & BOILERPLATE STRIPPING VERIFICATION SUITE")
    print("=" * 95)

    fixtures = [
        ("Fixture A (PDF Code Excerpt with Page Numbers & Hyphenation)", FIXTURE_A_PDF_CODE),
        ("Fixture B (HTML Zoning Export with Breadcrumbs & Unicode Quotes)", FIXTURE_B_HTML_ZONING),
        ("Fixture C (Site Spec Amendment with Confidentiality Disclaimers)", FIXTURE_C_SITE_SPEC)
    ]

    for label, raw_text in fixtures:
        print("\n" + "-" * 95)
        print(f"VERIFICATION: {label}")
        print("-" * 95)

        cleaned_text = cleaner.clean_document(raw_text)
        raw_chars = len(raw_text)
        cleaned_chars = len(cleaned_text)
        comp_ratio = round((1.0 - cleaned_chars / raw_chars) * 100, 2) if raw_chars > 0 else 0.0

        print(f"Original Chars: {raw_chars} | Cleaned Chars: {cleaned_chars} | Noise Reduction: {comp_ratio}%")
        print("\n--- RAW INPUT ---")
        print(repr(raw_text[:150]))
        print("\n--- CLEANED OUTPUT ---")
        print(cleaned_text)

    print("=" * 95)


if __name__ == "__main__":
    run_verification_suite()
