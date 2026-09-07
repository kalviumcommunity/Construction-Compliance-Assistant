"""
Uniform Chunk Metadata Data Model, Automated Tagging Engine, & Reverse Traceability Suite.

Tasks Covered:
- Task 1 & 3: Standardized ChunkMetadata & TaggedChunk Pydantic v2 data models with uniform schema consistency.
- Task 2: Automated clause & section extractor regex engine.
- Task 4: Reverse lookup traceability verification engine (source doc byte-slice validation).
- Task 5: 3-Document sample tagging test runner and audit card logging.
"""

import sys
import re
import hashlib
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Task 1 & Task 3: Pydantic v2 Uniform Metadata Data Models
# ---------------------------------------------------------------------------

class ChunkMetadata(BaseModel):
    source_doc_id: str = Field(..., description="Unique filename or document identifier.")
    doc_type: str = Field(..., description="Category (building_code, project_spec, inspection_log).")
    jurisdiction: str = Field(default="National", description="Statutory jurisdiction.")
    trade: str = Field(default="General", description="Trade discipline.")
    section_clause: str = Field(default="General", description="Governing clause or section number.")
    page_number: int = Field(default=1, ge=1, description="Source document page number.")
    chunk_index: int = Field(..., ge=0, description="Sequential 0-indexed position within parent document.")
    total_chunks: int = Field(..., ge=1, description="Total chunks produced from parent document.")
    char_start: int = Field(..., ge=0, description="Global character start offset in original document.")
    char_end: int = Field(..., ge=0, description="Global character end offset in original document.")


class TaggedChunk(BaseModel):
    chunk_id: str = Field(..., description="Deterministic unique chunk identifier.")
    content: str = Field(..., description="The actual text content of the chunk.")
    metadata: ChunkMetadata = Field(..., description="Uniform metadata payload.")


# ---------------------------------------------------------------------------
# Task 2: Automated Metadata Tagger & Section Extractor
# ---------------------------------------------------------------------------

class MetadataTagger:
    # Regex patterns for automated legal section & division extraction
    SECTION_PATTERNS = [
        r"(?i)Section\s+\d+(?:\.\d+)*",
        r"(?i)Article\s+\d+(?:\.\d+)*",
        r"(?i)Division\s+\d+(?:\s+\d+)*",
        r"(?i)Item\s+\d+",
        r"(?i)CSI\s+Section\s+\d+"
    ]

    def __init__(self):
        self.compiled_patterns = [re.compile(p) for p in self.SECTION_PATTERNS]

    def extract_section_clause(self, text: str, default_val: str = "General") -> str:
        """Extracts the first matching legal section / clause reference from text."""
        for pattern in self.compiled_patterns:
            match = pattern.search(text)
            if match:
                return match.group(0).strip()
        return default_val

    def tag_document(
        self,
        doc_id: str,
        content: str,
        doc_type: str,
        jurisdiction: str = "National",
        trade: str = "General",
        page_number: int = 1,
        max_chunk_chars: int = 400
    ) -> List[TaggedChunk]:
        """
        Splits parent document into chunks, calculates character offsets, extracts sections,
        and generates uniform TaggedChunk instances.
        """
        if not content:
            return []

        paragraphs = content.split("\n\n")
        raw_chunks = []
        start_offset = 0

        for p in paragraphs:
            p_strip = p.strip()
            if not p_strip:
                continue

            p_start = content.find(p_strip, start_offset)
            if p_start == -1:
                p_start = start_offset
            p_end = p_start + len(p_strip)
            start_offset = p_end

            raw_chunks.append({
                "content": p_strip,
                "start": p_start,
                "end": p_end
            })

        total_chunks = len(raw_chunks)
        tagged_chunks = []

        for idx, item in enumerate(raw_chunks):
            chunk_text = item["content"]
            section = self.extract_section_clause(chunk_text, default_val=f"Section {idx+1}")

            metadata = ChunkMetadata(
                source_doc_id=doc_id,
                doc_type=doc_type,
                jurisdiction=jurisdiction,
                trade=trade,
                section_clause=section,
                page_number=page_number,
                chunk_index=idx,
                total_chunks=total_chunks,
                char_start=item["start"],
                char_end=item["end"]
            )

            chunk_id = f"{doc_id}_chunk_{idx}"
            tagged_chunks.append(TaggedChunk(
                chunk_id=chunk_id,
                content=chunk_text,
                metadata=metadata
            ))

        return tagged_chunks


# ---------------------------------------------------------------------------
# Task 4: Reverse Traceability Verification Engine
# ---------------------------------------------------------------------------

def demonstrate_traceability(chunk: TaggedChunk, raw_corpus: Dict[str, str]) -> Dict[str, Any]:
    """
    Performs reverse lookup: reads chunk offsets, slices the raw parent document,
    and verifies 100% character match against original source bytes.
    """
    source_id = chunk.metadata.source_doc_id
    char_start = chunk.metadata.char_start
    char_end = chunk.metadata.char_end

    if source_id not in raw_corpus:
        return {
            "status": "FAILED",
            "reason": f"Source document '{source_id}' not found in raw corpus."
        }

    raw_doc_text = raw_corpus[source_id]
    extracted_slice = raw_doc_text[char_start:char_end]

    # Verify exact match
    is_exact_match = (extracted_slice == chunk.content)

    return {
        "chunk_id": chunk.chunk_id,
        "source_doc_id": source_id,
        "section_clause": chunk.metadata.section_clause,
        "char_start": char_start,
        "char_end": char_end,
        "extracted_slice_preview": extracted_slice[:60] + "...",
        "is_exact_match": is_exact_match,
        "status": "VERIFIED: Traceback matches original source bytes" if is_exact_match else "FAILED: Mismatch"
    }


# ---------------------------------------------------------------------------
# Task 5: Sample Documents & Automated Test Runner
# ---------------------------------------------------------------------------

SAMPLE_RAW_CORPUS = {
    "IBC_2021_Fire_Safety.pdf": (
        "IBC 2021 Section 705.8: Exterior walls of Type V construction located less than 5 feet "
        "from the lot line shall have a minimum fire-resistance rating of 1 hour and 0% unprotected openings.\n\n"
        "Section 705.8.1: For fire separation distances between 3 and 5 feet, protected openings carrying "
        "a 45-minute minimum rating are permitted up to 15% wall area."
    ),
    "Tower_B_Cast_In_Place_Concrete.md": (
        "Division 03 30 00 - Cast-in-Place Concrete Specifications.\n\n"
        "Division 03 30 00 Section 2.1: Structural concrete footings shall achieve a specified compressive strength "
        "f'c of 4,000 psi at 28 days with maximum water-cement ratio w/cm = 0.45."
    ),
    "August_2026_Slump_Inspection.txt": (
        "Site QA/QC Field Report - Tower B West Elevation.\n\n"
        "Item 12: Slump test conducted at Gridline B per ASTM C143 measured 4.5 inches. Rebar spacing verified at 8 inches on center."
    )
}


def run_metadata_tagger_suite():
    print("=" * 95)
    print("SITESAFE CHUNK METADATA TAGGING & TRACEABILITY VERIFICATION SUITE")
    print("=" * 95)

    tagger = MetadataTagger()
    all_tagged_chunks = []

    # Tag all 3 sample documents
    doc_configs = [
        ("IBC_2021_Fire_Safety.pdf", "building_code", "California", "Fire Safety", 142),
        ("Tower_B_Cast_In_Place_Concrete.md", "project_spec", "Project Site", "Structural", 1),
        ("August_2026_Slump_Inspection.txt", "inspection_log", "Project Site", "QA/QC", 4)
    ]

    for doc_id, doc_type, juri, trade, page in doc_configs:
        raw_text = SAMPLE_RAW_CORPUS[doc_id]
        chunks = tagger.tag_document(
            doc_id=doc_id,
            content=raw_text,
            doc_type=doc_type,
            jurisdiction=juri,
            trade=trade,
            page_number=page
        )
        all_tagged_chunks.extend(chunks)

    # 1. Print Formatted Tagged Chunks
    print("\n[TAGGED CHUNK METADATA SCHEMA DISPLAY]")
    print("-" * 95)
    for c in all_tagged_chunks[:3]:
        print(f"\n---> Chunk ID: {c.chunk_id}")
        print(f"Content    : '{c.content[:70]}...'")
        print("JSON Metadata Schema:")
        print(c.metadata.model_dump_json(indent=2))

    # 2. Perform Reverse Traceability Audit
    print("\n" + "=" * 95)
    print("SOURCE TRACEABILITY REVERSE LOOKUP AUDIT")
    print("=" * 95)

    for c in all_tagged_chunks:
        trace_result = demonstrate_traceability(c, SAMPLE_RAW_CORPUS)
        print(f"\n[AUDIT CARD: {c.chunk_id}]")
        print(f"  Source Document : {trace_result['source_doc_id']} (Page {c.metadata.page_number})")
        print(f"  Section Clause  : {trace_result['section_clause']}")
        print(f"  Byte Offsets    : [{trace_result['char_start']}:{trace_result['char_end']}]")
        print(f"  Status          : {trace_result['status']}")
        assert trace_result["is_exact_match"], f"Traceability failure for chunk {c.chunk_id}"

    print("\n" + "=" * 95)
    print("ALL TRACEABILITY TESTS PASSED WITH 100% BYTE MATCH ACCURACY!")
    print("=" * 95)


if __name__ == "__main__":
    run_metadata_tagger_suite()
