"""
Uniform Metadata Tagger and Legal Clause Extractor for SiteSafe RAG.
Extracts section numbers, standardizes trade classifications, and creates uniform TaggedChunk objects.
"""

import re
from typing import List, Dict, Any, Optional
from app.models.schemas import ChunkMetadata, TaggedChunk

SECTION_PATTERNS = [
    r"(?i)(?:IBC|CBC|UPC|NEC|NYC\s*EC|NYC\s*PC)?\s*Section\s+[\d]+(?:\.[\d]+)*[A-Za-z]?",
    r"(?i)Article\s+[\d]+(?:\.[\d]+)*(?:\([A-Za-z0-9]+\))*",
    r"(?i)Division\s+[\d]+(?:\s+[\d]+)*",
    r"(?i)Section\s+[\d]{2}\s+[\d]{2}\s+[\d]{2}(?:\s*§?[\d\.]+)*",
    r"(?i)NCR\s*#?[\w\-]+",
    r"(?i)Report\s*#?[\w\-]+",
    r"(?i)Item\s+[\d]+",
]

TRADE_KEYWORDS = {
    "Electrical": ["conduit", "pvc", "emt", "rmc", "wiring", "nec", "circuit", "gfci", "breaker", "electrical", "raceway", "ampere", "panelboard"],
    "Fire Safety": ["firestop", "sprinkler", "intumescent", "fire barrier", "nfpa", "smoke", "fire-resistance", "f-rating", "t-rating", "flame", "combustible", "wui", "ember"],
    "Structural": ["concrete", "psi", "rebar", "compressive strength", "post-tensioned", "slab", "stairway", "handrail", "seismic", "footing", "shear wall", "slump", "beam", "deck"],
    "Plumbing": ["plumbing", "upc", "drainage", "vent", "dwv", "hydrostatic", "pipe", "water supply", "backflow", "rpz", "copper", "potable"],
}

JURISDICTION_KEYWORDS = {
    "California": ["california", "title 24", "cbc", "oshpd"],
    "NYC": ["nyc", "new york city", "title 27"],
}


class MetadataTagger:
    def __init__(self):
        self.compiled_section_patterns = [re.compile(p) for p in SECTION_PATTERNS]

    def extract_clause_number(self, text: str, default_val: str = "General") -> str:
        """Finds the first legal clause or section reference in the text."""
        for pattern in self.compiled_section_patterns:
            match = pattern.search(text)
            if match:
                return match.group(0).strip()
        return default_val

    def infer_trade(self, text: str, doc_title: str, default_trade: str = "General") -> str:
        """Infers construction discipline from document title and text cues."""
        combined = f"{doc_title} {text}".lower()
        for trade, keywords in TRADE_KEYWORDS.items():
            if any(kw in combined for kw in keywords):
                return trade
        return default_trade

    def infer_jurisdiction(self, text: str, doc_title: str, default_jur: str = "National") -> str:
        """Infers statutory jurisdiction from document title and text cues."""
        combined = f"{doc_title} {text}".lower()
        for jur, keywords in JURISDICTION_KEYWORDS.items():
            if any(kw in combined for kw in keywords):
                return jur
        return default_jur

    def infer_doc_type(self, text: str, doc_title: str, default_type: str = "Code") -> str:
        """Infers document category (Code, Project Spec, Inspection Log)."""
        combined = f"{doc_title} {text}".lower()
        if any(k in combined for k in ["spec", "specification", "division 0", "division 2"]):
            return "Project Spec"
        if any(k in combined for k in ["inspection", "ncr", "audit", "field log", "observation", "slump log"]):
            return "Inspection Log"
        return default_type

    def tag_chunks(
        self,
        doc_id: str,
        doc_title: str,
        chunks: List[Dict[str, Any]],
        override_trade: Optional[str] = None,
        override_jurisdiction: Optional[str] = None,
        override_doc_type: Optional[str] = None,
        default_page: int = 1,
    ) -> List[TaggedChunk]:
        """Tags a list of raw chunk dictionaries with uniform metadata."""
        tagged: List[TaggedChunk] = []
        total_chunks = len(chunks)

        for chunk in chunks:
            text = chunk.get("text", "")
            idx = chunk.get("chunk_index", 0)

            clause = self.extract_clause_number(text, default_val=f"{doc_title} §{idx+1}")
            trade = override_trade or self.infer_trade(text, doc_title)
            jurisdiction = override_jurisdiction or self.infer_jurisdiction(text, doc_title)
            doc_type = override_doc_type or self.infer_doc_type(text, doc_title)

            metadata = ChunkMetadata(
                source_doc_id=doc_id,
                doc_title=doc_title,
                doc_type=doc_type,
                jurisdiction=jurisdiction,
                trade=trade,
                section_clause=clause,
                page_number=default_page,
                chunk_index=idx,
                total_chunks=total_chunks,
                char_start=chunk.get("char_start", 0),
                char_end=chunk.get("char_end", len(text)),
            )

            chunk_id = f"{doc_id}_chunk_{idx}"
            tagged.append(TaggedChunk(
                chunk_id=chunk_id,
                content=text,
                metadata=metadata,
            ))

        return tagged
