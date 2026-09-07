"""
Token-Aware Chunker with Sliding Window and Table Preservation Engine.
Ensures legal rule-exception clauses are preserved with token overlap,
and avoids splitting Markdown tables down the middle to maintain tabular compliance dimensions.
"""

import re
import tiktoken
from typing import List, Dict, Any, Tuple


class TokenAwareChunker:
    def __init__(
        self,
        chunk_size_tokens: int = 300,
        chunk_overlap_tokens: int = 50,
        encoding_name: str = "o200k_base",
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
        """Counts tokens for a text string using the initialized BPE tokenizer."""
        if not text:
            return 0
        return len(self.encoding.encode(text))

    def _is_table_line(self, line: str) -> bool:
        """Detects if a single line is part of a markdown table."""
        s = line.strip()
        return bool(s.startswith("|") and s.endswith("|") and s.count("|") >= 2)

    def _extract_semantic_blocks(self, text: str) -> List[Dict[str, Any]]:
        """
        Parses document text into atomic semantic blocks:
        - 'paragraph': regular prose/rules
        - 'table': atomic markdown table block
        """
        lines = text.split("\n")
        blocks: List[Dict[str, Any]] = []
        current_table_lines: List[str] = []
        current_text_lines: List[str] = []

        def flush_text():
            if current_text_lines:
                content = "\n".join(current_text_lines).strip()
                if content:
                    blocks.append({"type": "paragraph", "content": content})
                current_text_lines.clear()

        def flush_table():
            if current_table_lines:
                table_str = "\n".join(current_table_lines).strip()
                if table_str:
                    blocks.append({"type": "table", "content": table_str, "lines": list(current_table_lines)})
                current_table_lines.clear()

        for line in lines:
            if self._is_table_line(line):
                flush_text()
                current_table_lines.append(line)
            else:
                flush_table()
                current_text_lines.append(line)

        flush_text()
        flush_table()
        return blocks

    def _split_oversized_table(self, table_lines: List[str], max_tokens: int) -> List[str]:
        """
        If a table exceeds max_tokens, splits row-by-row while preserving
        the header and separator on every sub-chunk so column headers are never lost.
        """
        if len(table_lines) <= 2:
            return ["\n".join(table_lines)]

        header = table_lines[0]
        separator = table_lines[1]
        data_rows = table_lines[2:]

        header_tokens = self.count_tokens(f"{header}\n{separator}")
        available_tokens = max(50, max_tokens - header_tokens)

        sub_tables: List[str] = []
        current_rows: List[str] = []
        current_tokens = 0

        for row in data_rows:
            row_tokens = self.count_tokens(row)
            if current_rows and (current_tokens + row_tokens > available_tokens):
                sub_tables.append("\n".join([header, separator] + current_rows))
                current_rows = [row]
                current_tokens = row_tokens
            else:
                current_rows.append(row)
                current_tokens += row_tokens

        if current_rows:
            sub_tables.append("\n".join([header, separator] + current_rows))

        return sub_tables

    def chunk_text(self, text: str) -> List[Dict[str, Any]]:
        """
        Performs token-aware chunking with sliding overlap while keeping
        Markdown tables atomic and preserving table headers.
        """
        if not text or not text.strip():
            return []

        blocks = self._extract_semantic_blocks(text)
        chunks: List[Dict[str, Any]] = []
        current_chunk_text = ""
        chunk_idx = 0

        for block in blocks:
            b_type = block["type"]
            b_content = block["content"]
            b_tokens = self.count_tokens(b_content)

            if b_type == "table":
                # Handle Table Block: Must remain atomic if possible
                if b_tokens > self.chunk_size_tokens:
                    # Oversized table: flush pending text, then split by rows with headers preserved
                    if current_chunk_text.strip():
                        chunks.append({
                            "chunk_index": chunk_idx,
                            "token_count": self.count_tokens(current_chunk_text),
                            "char_count": len(current_chunk_text),
                            "text": current_chunk_text.strip(),
                            "has_table": False,
                        })
                        chunk_idx += 1
                        current_chunk_text = ""

                    sub_tables = self._split_oversized_table(block["lines"], self.chunk_size_tokens)
                    for sub in sub_tables:
                        chunks.append({
                            "chunk_index": chunk_idx,
                            "token_count": self.count_tokens(sub),
                            "char_count": len(sub),
                            "text": sub.strip(),
                            "has_table": True,
                        })
                        chunk_idx += 1
                    continue

                # Normal table fits within a chunk
                curr_tokens = self.count_tokens(current_chunk_text)
                if curr_tokens + b_tokens <= self.chunk_size_tokens:
                    current_chunk_text = (current_chunk_text + "\n\n" + b_content).strip()
                else:
                    # Finalize current chunk, start table in fresh chunk
                    if current_chunk_text.strip():
                        chunks.append({
                            "chunk_index": chunk_idx,
                            "token_count": curr_tokens,
                            "char_count": len(current_chunk_text),
                            "text": current_chunk_text.strip(),
                            "has_table": False,
                        })
                        chunk_idx += 1
                    current_chunk_text = b_content

            else:
                # Regular paragraph block
                # If paragraph fits in current chunk, add it
                curr_tokens = self.count_tokens(current_chunk_text)
                if curr_tokens + b_tokens <= self.chunk_size_tokens:
                    current_chunk_text = (current_chunk_text + "\n\n" + b_content).strip()
                else:
                    # Need to split or start new chunk
                    if current_chunk_text.strip():
                        chunks.append({
                            "chunk_index": chunk_idx,
                            "token_count": curr_tokens,
                            "char_count": len(current_chunk_text),
                            "text": current_chunk_text.strip(),
                            "has_table": False,
                        })
                        chunk_idx += 1
                        current_chunk_text = ""

                    # If paragraph itself is larger than chunk size, use sliding token window
                    if b_tokens > self.chunk_size_tokens:
                        p_tokens = self.encoding.encode(b_content)
                        step_size = self.chunk_size_tokens - self.chunk_overlap_tokens
                        start_idx = 0
                        while start_idx < len(p_tokens):
                            end_idx = min(start_idx + self.chunk_size_tokens, len(p_tokens))
                            slice_text = self.encoding.decode(p_tokens[start_idx:end_idx]).strip()
                            chunks.append({
                                "chunk_index": chunk_idx,
                                "token_count": end_idx - start_idx,
                                "char_count": len(slice_text),
                                "text": slice_text,
                                "has_table": False,
                            })
                            chunk_idx += 1
                            if end_idx >= len(p_tokens):
                                break
                            start_idx += step_size
                    else:
                        current_chunk_text = b_content

        if current_chunk_text.strip():
            chunks.append({
                "chunk_index": chunk_idx,
                "token_count": self.count_tokens(current_chunk_text),
                "char_count": len(current_chunk_text),
                "text": current_chunk_text.strip(),
                "has_table": False,
            })

        return chunks
