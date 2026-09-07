"""
Unit Test Suite for DocumentCleaner and Corpus Cleaning Pipeline.
Uses Python standard unittest framework with zero external dependencies.
"""

import unittest
from text_cleaner import DocumentCleaner, clean_corpus


class TestDocumentCleaner(unittest.TestCase):
    def setUp(self):
        self.cleaner = DocumentCleaner()

    def test_1_unicode_normalization(self):
        raw = "The \u201csetback\u201d distance is 5\u00a0feet\u2014mandatory."
        expected = 'The "setback" distance is 5 feet-mandatory.'
        cleaned = self.cleaner.normalize_unicode(raw)
        self.assertEqual(cleaned, expected)

    def test_2_boilerplate_removal(self):
        raw = "2021 INTERNATIONAL BUILDING CODE®\nPage 142 of 850\nSection 705.8 applies.\n- 142 -"
        cleaned = self.cleaner.strip_boilerplate(raw)
        self.assertNotIn("2021 INTERNATIONAL BUILDING CODE®", cleaned)
        self.assertNotIn("Page 142 of 850", cleaned)
        self.assertNotIn("- 142 -", cleaned)
        self.assertIn("Section 705.8 applies.", cleaned)

    def test_3_hyphenation_healing(self):
        raw = "Minimum fire-re-\nsistance rat-\ning requirements for Type V-A con-\nstruction."
        cleaned = self.cleaner.fix_broken_hyphenations(raw)
        self.assertIn("fire-resistance", cleaned)
        self.assertIn("rating", cleaned)
        self.assertIn("construction", cleaned)

    def test_4_whitespace_collapse(self):
        raw = "Line 1.\t\t  Line 1 continuation.\r\n\n\n\n\nLine 2."
        cleaned = self.cleaner.normalize_whitespace(raw)
        self.assertNotIn("\r", cleaned)
        self.assertNotIn("\n\n\n", cleaned)
        self.assertEqual(cleaned, "Line 1. Line 1 continuation.\n\nLine 2.")

    def test_5_graceful_malformed_input(self):
        self.assertEqual(self.cleaner.clean_document(""), "")
        self.assertEqual(self.cleaner.clean_document(None), "")
        self.assertEqual(self.cleaner.clean_document(12345), "12345")

        corpus = [
            {"doc_id": "D1", "source": "s1.txt", "raw_content": "Valid content.", "metadata": {}},
            {"doc_id": "D2", "source": "s2.txt", "raw_content": None, "metadata": {}}
        ]
        cleaned_batch = clean_corpus(corpus, self.cleaner)
        self.assertEqual(len(cleaned_batch), 2)
        self.assertEqual(cleaned_batch[0]["content"], "Valid content.")
        self.assertEqual(cleaned_batch[1]["content"], "")


if __name__ == "__main__":
    unittest.main()
