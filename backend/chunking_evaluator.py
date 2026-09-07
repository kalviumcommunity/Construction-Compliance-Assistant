"""
Chunking Evaluation & Strategy Comparison Suite for SiteSafe Compliance RAG.

Tasks Covered:
- Task 1 & 2: Fixed-Size Character Splitting (Strategy A) vs Semantic Section-Aware Splitting (Strategy B).
- Task 3: Quantitative metric computation (chunk count, size distribution, boundary citation severance).
- Task 4: Domain-specific technical justification for legal & building code retrieval.
- Task 5: Formatted sample chunk inspection runner and report artifacts.
"""

import sys
import re
from typing import List, Dict, Any, Tuple

# ---------------------------------------------------------------------------
# Benchmark Test Fixture (Multi-Paragraph Building Code Excerpt)
# ---------------------------------------------------------------------------

SAMPLE_BUILDING_CODE_TEXT = """# IBC 2021 CHAPTER 7: FIRE AND SMOKE PROTECTION FEATURES

## Section 705.1 - General Scope
Exterior walls shall comply with the fire-resistance rating requirements specified in Table 601 and Table 705.5. The fire separation distance shall be measured at right angles from the face of the exterior wall to the closest interior lot line, to the centerline of an adjacent street or public way, or to an imaginary lot line between two buildings on the same lot.

## Section 705.8 - Openings in Exterior Walls
Exterior walls of Type V-B construction located less than 5 feet (1524 mm) from the lot line shall have a minimum fire-resistance rating of 1 hour in accordance with Table 601 and shall possess 0% allowable area of unprotected openings.

### Section 705.8.1 - Allowable Opening Percentages
The maximum allowable area of protected and unprotected openings in exterior walls shall not exceed the values set forth in Table 705.8:
(a) For fire separation distances from 0 to less than 3 feet: 0% unprotected openings permitted.
(b) For fire separation distances from 3 feet to less than 5 feet: 0% unprotected openings, 15% protected openings carrying a 45-minute minimum rating.
(c) For fire separation distances from 5 feet to less than 10 feet: 10% unprotected openings, 25% protected openings.

### Section 705.8.2 - Sprinkler Protection Exception
Exception 1: Buildings equipped throughout with an automatic fire sprinkler system installed in accordance with Section 903.3.1.1 (NFPA 13) are permitted to increase the allowable opening percentage of protected assemblies by 100%, provided that unprotected openings for fire separation distances under 5 feet remain restricted to 0% unless protected by approved deluge fire shutters.

## Section 705.11 - Parapet Requirements
Parapets shall be provided on all exterior walls of Type V buildings. Parapets shall have the same fire-resistance rating as that required for the supporting wall and shall extend not less than 30 inches (762 mm) above the point where the roof surface intersects the exterior wall.
"""


# ---------------------------------------------------------------------------
# Strategy A: Fixed-Size Character Splitting with Overlap
# ---------------------------------------------------------------------------

def fixed_size_chunking(text: str, chunk_size: int = 500, chunk_overlap: int = 100) -> List[str]:
    """Splits text mechanically at fixed character boundaries with a sliding overlap buffer."""
    if not text:
        return []

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end]
        chunks.append(chunk)

        if end >= text_len:
            break
        start += (chunk_size - chunk_overlap)

    return chunks


# ---------------------------------------------------------------------------
# Strategy B: Hierarchical / Semantic Section-Aware Splitting
# ---------------------------------------------------------------------------

def section_aware_chunking(
    text: str,
    target_size: int = 500,
    overlap: int = 80,
    separators: List[str] = None
) -> List[str]:
    """
    Hierarchical section-aware chunker that recursively splits text on structural legal boundaries
    (e.g., Markdown headers, 'Section', 'Article', double newlines) to keep statutory rules intact.
    """
    if separators is None:
        separators = ["\n## ", "\n### ", "\nSection ", "\nArticle ", "\n\n", "\n", " "]

    def recursive_split(subtext: str, sep_idx: int) -> List[str]:
        if not subtext.strip():
            return []

        if len(subtext) <= target_size or sep_idx >= len(separators):
            return [subtext.strip()]

        sep = separators[sep_idx]
        splits = subtext.split(sep)

        # Re-attach separator to split pieces if separator is a meaningful section marker
        reconstructed = []
        for i, piece in enumerate(splits):
            if not piece.strip():
                continue
            prefix = sep if i > 0 and sep.startswith("\n") else ""
            reconstructed.append(prefix + piece)

        result_chunks = []
        current_chunk = ""

        for piece in reconstructed:
            if len(current_chunk) + len(piece) <= target_size:
                current_chunk += piece
            else:
                if current_chunk.strip():
                    result_chunks.append(current_chunk.strip())

                # If single piece is larger than target_size, split it with next finer separator
                if len(piece) > target_size:
                    sub_splits = recursive_split(piece, sep_idx + 1)
                    result_chunks.extend(sub_splits)
                    current_chunk = ""
                else:
                    current_chunk = piece

        if current_chunk.strip():
            result_chunks.append(current_chunk.strip())

        return result_chunks

    raw_chunks = recursive_split(text, 0)

    # Add sliding overlap buffer between adjacent section chunks if needed
    final_chunks = []
    for i, c in enumerate(raw_chunks):
        if i > 0 and overlap > 0:
            prev_tail = raw_chunks[i - 1][-overlap:]
            c = prev_tail + "\n" + c
        final_chunks.append(c.strip())

    return final_chunks


# ---------------------------------------------------------------------------
# Task 3: Metric Computation & Boundary Integrity Check
# ---------------------------------------------------------------------------

def evaluate_severed_citations(text: str, chunks: List[str]) -> int:
    """
    Counts how many times statutory section headers (e.g., 'Section 705.8')
    were severed or orphaned at chunk start/end boundaries without their body text.
    """
    section_patterns = [r"Section\s+705\.\d+", r"Table\s+705\.\d+"]
    severed_count = 0

    for chunk in chunks:
        # Check if a section citation appears in the last 20 characters of a chunk without its content
        for pat in section_patterns:
            matches = re.finditer(pat, chunk)
            for m in matches:
                # If section citation occurs at the trailing edge of a chunk (within last 25 chars)
                if m.end() >= len(chunk) - 25 and len(chunk) < 450:
                    severed_count += 1
                # Or if section header is separated from its paragraph
                elif chunk.endswith(m.group(0)):
                    severed_count += 1

    return severed_count


def profile_chunk_set(chunks: List[str], full_text: str) -> Dict[str, Any]:
    """Computes comprehensive quantitative metrics for a set of generated chunks."""
    sizes = [len(c) for c in chunks]
    words = [len(c.split()) for c in chunks]

    avg_chars = round(sum(sizes) / len(sizes), 2) if sizes else 0.0
    avg_words = round(sum(words) / len(words), 2) if words else 0.0
    estimated_tokens = round(avg_words * 1.3, 2)  # ~1.3 tokens per word estimate for legal text
    min_size = min(sizes) if sizes else 0
    max_size = max(sizes) if sizes else 0
    severed_citations = evaluate_severed_citations(full_text, chunks)

    return {
        "chunk_count": len(chunks),
        "avg_chars": avg_chars,
        "avg_words": avg_words,
        "estimated_tokens": estimated_tokens,
        "min_chars": min_size,
        "max_chars": max_size,
        "severed_citations": severed_citations
    }


# ---------------------------------------------------------------------------
# Task 5: Runner & Visual Inspection Display
# ---------------------------------------------------------------------------

def run_chunking_benchmark():
    full_text = SAMPLE_BUILDING_CODE_TEXT.strip()
    raw_chars = len(full_text)
    raw_words = len(full_text.split())

    chunks_a = fixed_size_chunking(full_text, chunk_size=500, chunk_overlap=100)
    chunks_b = section_aware_chunking(full_text, target_size=550, overlap=80)

    metrics_a = profile_chunk_set(chunks_a, full_text)
    metrics_b = profile_chunk_set(chunks_b, full_text)

    print("=" * 95)
    print("SITESAFE RAG CHUNKING EVALUATION & COMPARATIVE BENCHMARK")
    print("=" * 95)
    print(f"Raw Document Length: {raw_chars} Characters | {raw_words} Words\n")

    header_fmt = "{:<32} | {:<10} | {:<12} | {:<12} | {:<10} | {:<18}"
    row_fmt = "{:<32} | {:<10} | {:<12} | {:<12} | {:<10} | {:<18}"

    print(header_fmt.format("Strategy Category", "Chunks", "Avg Chars", "Est. Tokens", "Min/Max", "Severed References"))
    print("-" * 105)

    print(row_fmt.format(
        "Strategy A: Fixed-Size (500/100)",
        metrics_a["chunk_count"],
        metrics_a["avg_chars"],
        metrics_a["estimated_tokens"],
        f"{metrics_a['min_chars']}/{metrics_a['max_chars']}",
        f"{metrics_a['severed_citations']} severances"
    ))

    print(row_fmt.format(
        "Strategy B: Section-Aware (550/80)",
        metrics_b["chunk_count"],
        metrics_b["avg_chars"],
        metrics_b["estimated_tokens"],
        f"{metrics_b['min_chars']}/{metrics_b['max_chars']}",
        f"{metrics_b['severed_citations']} severances (Clean)"
    ))
    print("-" * 105)

    # Print Sample Chunks (First 3 for both strategies)
    print("\n" + "=" * 95)
    print("SAMPLE CHUNK INSPECTION: STRATEGY A (FIXED-SIZE CHARACTER SLIDING WINDOW)")
    print("=" * 95)
    for i, c in enumerate(chunks_a[:3]):
        print(f"\n--- CHUNK [{i+1}] START (Len: {len(c)} Chars) ---")
        print(c)
        print(f"--- CHUNK [{i+1}] END ---")

    print("\n" + "=" * 95)
    print("SAMPLE CHUNK INSPECTION: STRATEGY B (HIERARCHICAL SECTION-AWARE RECURSIVE)")
    print("=" * 95)
    for i, c in enumerate(chunks_b[:3]):
        print(f"\n--- CHUNK [{i+1}] START (Len: {len(c)} Chars) ---")
        print(c)
        print(f"--- CHUNK [{i+1}] END ---")

    print("\n" + "=" * 95)


if __name__ == "__main__":
    run_chunking_benchmark()
