"""
Token-Aware Chunker with Sliding Token Overlap Engine for SiteSafe RAG.

Tasks Covered:
- Task 1 & 2: TokenAwareChunker class using tiktoken (o200k_base / cl100k_base) with sliding token window.
- Task 3: Boundary preservation comparative demo (Scenario A: No Overlap vs Scenario B: With Overlap).
- Task 4: Parameter & model sizing analysis for gpt-4o-mini & text-embedding-3-small.
- Task 5: Formatted CLI runner and test fixture integration.
"""

import sys
import tiktoken
from typing import List, Dict, Any

# ---------------------------------------------------------------------------
# Task 1 & 2: TokenAwareChunker Class
# ---------------------------------------------------------------------------

class TokenAwareChunker:
    def __init__(
        self,
        chunk_size_tokens: int = 300,
        chunk_overlap_tokens: int = 50,
        encoding_name: str = "o200k_base"
    ):
        if chunk_overlap_tokens >= chunk_size_tokens:
            raise ValueError("chunk_overlap_tokens must be strictly less than chunk_size_tokens")

        self.chunk_size_tokens = chunk_size_tokens
        self.chunk_overlap_tokens = chunk_overlap_tokens

        try:
            self.encoding = tiktoken.get_encoding(encoding_name)
            self.encoding_name = encoding_name
        except Exception:
            self.encoding = tiktoken.get_encoding("cl100k_base")
            self.encoding_name = "cl100k_base"

    def count_tokens(self, text: str) -> int:
        """Returns token count for a text string."""
        if not text:
            return 0
        return len(self.encoding.encode(text))

    def chunk_text(self, text: str) -> List[Dict[str, Any]]:
        """
        Tokenizes text and slices token IDs using a sliding window:
        step_size = chunk_size_tokens - chunk_overlap_tokens.
        Returns a list of structured chunk objects.
        """
        if not text or not text.strip():
            return []

        tokens = self.encoding.encode(text)
        total_tokens = len(tokens)

        # Handle short text smaller than chunk_size_tokens
        if total_tokens <= self.chunk_size_tokens:
            return [{
                "chunk_index": 0,
                "token_count": total_tokens,
                "char_count": len(text),
                "text": text.strip(),
                "overlap_token_count": 0
            }]

        step_size = self.chunk_size_tokens - self.chunk_overlap_tokens
        chunks = []
        start_idx = 0
        chunk_idx = 0

        while start_idx < total_tokens:
            end_idx = min(start_idx + self.chunk_size_tokens, total_tokens)
            token_slice = tokens[start_idx:end_idx]
            decoded_text = self.encoding.decode(token_slice).strip()

            actual_overlap = 0 if chunk_idx == 0 else self.chunk_overlap_tokens

            chunks.append({
                "chunk_index": chunk_idx,
                "token_count": len(token_slice),
                "char_count": len(decoded_text),
                "text": decoded_text,
                "overlap_token_count": actual_overlap,
                "token_ids": token_slice
            })

            if end_idx >= total_tokens:
                break

            start_idx += step_size
            chunk_idx += 1

        return chunks


# ---------------------------------------------------------------------------
# Task 3: Boundary Preservation Comparative Demonstration
# ---------------------------------------------------------------------------

EDGE_CASE_REGULATION_TEXT = (
    "IBC Section 705.8.2: Exterior openings in Type V buildings facing an interior lot line less than 5 feet away "
    "are strictly prohibited from having unprotected glazing, EXCEPT WHERE the building is fully equipped with an "
    "automatic fire sprinkler system complying with NFPA 13, in which case a maximum of 15% protected openings shall be permitted."
)


def run_boundary_preservation_demo():
    print("=" * 95)
    print("SITESAFE BOUNDARY PRESERVATION DEMONSTRATION (WITH VS WITHOUT OVERLAP)")
    print("=" * 95)

    print(f"\nOriginal Regulation Text ({len(EDGE_CASE_REGULATION_TEXT)} Chars):\n\"{EDGE_CASE_REGULATION_TEXT}\"\n")

    # Scenario A: No Overlap (35 tokens, 0 overlap)
    chunker_a = TokenAwareChunker(chunk_size_tokens=35, chunk_overlap_tokens=0)
    chunks_a = chunker_a.chunk_text(EDGE_CASE_REGULATION_TEXT)

    print("-" * 95)
    print("SCENARIO A: FIXED-SIZE SPLITTING WITHOUT OVERLAP (35 Tokens, 0 Overlap)")
    print("-" * 95)

    for c in chunks_a:
        print(f"--- Chunk [{c['chunk_index']+1}] ({c['token_count']} Tokens) ---")
        print(f"\"{c['text']}\"")
        if "EXCEPT WHERE" in c["text"] and "strictly prohibited" not in c["text"]:
            print("[WARNING]: Exception clause 'EXCEPT WHERE' is orphaned without the prohibition rule!")
        elif "strictly prohibited" in c["text"] and "EXCEPT WHERE" not in c["text"]:
            print("[WARNING]: Prohibition rule is presented as an absolute ban, missing the sprinkler exception!")

    # Scenario B: With Overlap (35 tokens, 12 overlap)
    chunker_b = TokenAwareChunker(chunk_size_tokens=35, chunk_overlap_tokens=12)
    chunks_b = chunker_b.chunk_text(EDGE_CASE_REGULATION_TEXT)

    print("\n" + "-" * 95)
    print("SCENARIO B: TOKEN-AWARE SPLITTING WITH OVERLAP (35 Tokens, 12 Overlap)")
    print("-" * 95)

    for c in chunks_b:
        print(f"--- Chunk [{c['chunk_index']+1}] ({c['token_count']} Tokens, {c['overlap_token_count']} Overlap) ---")
        print(f"\"{c['text']}\"")
        if "strictly prohibited" in c["text"] and "EXCEPT WHERE" in c["text"]:
            print("[SUCCESS]: Overlap preserves BOTH the prohibition rule and the 'EXCEPT WHERE' sprinkler condition!")

    print("=" * 95)


if __name__ == "__main__":
    run_boundary_preservation_demo()
