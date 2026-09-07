"""
Unit Test Suite for TokenAwareChunker.
Uses standard Python unittest framework to verify token bounds, overlap accuracy, and boundary continuity.
"""

import unittest
from token_chunker import TokenAwareChunker, EDGE_CASE_REGULATION_TEXT


class TestTokenAwareChunker(unittest.TestCase):
    def setUp(self):
        self.chunker = TokenAwareChunker(chunk_size_tokens=40, chunk_overlap_tokens=10)

    def test_1_token_bounds(self):
        """Asserts that no generated chunk exceeds chunk_size_tokens."""
        chunks = self.chunker.chunk_text(EDGE_CASE_REGULATION_TEXT)
        self.assertGreater(len(chunks), 1)
        for c in chunks:
            self.assertLessEqual(c["token_count"], self.chunker.chunk_size_tokens)

    def test_2_overlap_verification(self):
        """Asserts that the first N tokens of Chunk i+1 match the last N tokens of Chunk i."""
        chunks = self.chunker.chunk_text(EDGE_CASE_REGULATION_TEXT)
        overlap_size = self.chunker.chunk_overlap_tokens

        for i in range(len(chunks) - 1):
            tokens_curr = chunks[i]["token_ids"]
            tokens_next = chunks[i+1]["token_ids"]

            last_n_of_curr = tokens_curr[-overlap_size:]
            first_n_of_next = tokens_next[:overlap_size]

            self.assertEqual(last_n_of_curr, first_n_of_next)

    def test_3_short_text_passthrough(self):
        """Asserts that input text smaller than chunk_size_tokens returns exactly 1 chunk with 0 overlap."""
        short_text = "IBC Section 705.8 requires fire-resistance rating."
        chunks = self.chunker.chunk_text(short_text)
        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0]["chunk_index"], 0)
        self.assertEqual(chunks[0]["overlap_token_count"], 0)

    def test_4_boundary_continuity(self):
        """Asserts that full text words are preserved across the chunk sequence without token loss."""
        chunks = self.chunker.chunk_text(EDGE_CASE_REGULATION_TEXT)
        self.assertTrue(any("EXCEPT WHERE" in c["text"] for c in chunks))
        self.assertTrue(any("strictly prohibited" in c["text"] for c in chunks))


if __name__ == "__main__":
    unittest.main()
