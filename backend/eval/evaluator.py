"""
End-to-End RAG Evaluator for SiteSafe Construction Compliance Assistant.
Evaluates:
1. Verdict Correctness
2. Fact & Keyword Match Precision
3. Answer Context Grounding
4. Citation Accuracy & Metadata Verification
5. Hallucination Guardrail Refusal Enforcement
6. Root Cause Failure Classification
"""

import os
import json
import logging
from typing import List, Dict, Any, Tuple

from app.models.schemas import ComplianceQueryRequest, ComplianceResponse, ComplianceVerdict
from app.rag.pipeline import rag_pipeline

logger = logging.getLogger("sitesafe.evaluator")


class RAGEvaluator:
    """
    Evaluates RAG pipeline outputs against benchmark test dataset without
    altering pipeline execution or scoring artificially.
    """

    def __init__(self, dataset_path: str):
        self.dataset_path = dataset_path
        self.dataset = self._load_dataset()

    def _load_dataset(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Evaluation dataset file not found at: {self.dataset_path}")
        with open(self.dataset_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def evaluate_item(self, tc: Dict[str, Any]) -> Dict[str, Any]:
        """Runs single test case through RAG pipeline and evaluates quality metrics."""
        request = ComplianceQueryRequest(
            query=tc["query"],
            trade=tc.get("trade", "All"),
            jurisdiction=tc.get("jurisdiction", "All"),
            document_type=tc.get("document_type", "All"),
            top_k=tc.get("top_k", 5),
            conversation_history=tc.get("conversation_history", []),
        )

        response: ComplianceResponse = rag_pipeline.verify_compliance(request)

        # 1. Verdict Correctness Score (1.0 or 0.0)
        expected_verdict = tc["expected_verdict"]
        verdict_correct = (response.verdict.value == expected_verdict)
        correctness_score = 1.0 if verdict_correct else 0.0

        # 2. Fact & Keyword Match Score (0.0 to 1.0)
        combined_text = (response.summary + " " + response.technical_analysis).lower()
        expected_keywords = [kw.lower() for kw in tc.get("expected_keywords", [])]
        
        kw_matched = 0
        if expected_keywords:
            for kw in expected_keywords:
                if kw in combined_text:
                    kw_matched += 1
            keyword_score = round(kw_matched / len(expected_keywords), 4)
        else:
            keyword_score = 1.0

        # 3. Grounding Score (0.0 to 1.0)
        # Checks whether generated citations / claims are backed by retrieved context chunks
        grounding_score = 1.0
        retrieved_texts = " ".join([c.text for c in response.retrieved_chunks]).lower()

        if response.citations:
            grounded_quotes = 0
            for citation in response.citations:
                quote_snippet = citation.direct_quote.lower()[:40]
                if (
                    quote_snippet in retrieved_texts
                    or citation.clause_number.lower() in retrieved_texts
                    or any(citation.clause_number in c.clause_number for c in response.retrieved_chunks)
                ):
                    grounded_quotes += 1
            grounding_score = round(grounded_quotes / len(response.citations), 4)
        elif response.verdict == ComplianceVerdict.INSUFFICIENT_DATA:
            grounding_score = 1.0  # Safe refusal is correctly grounded

        # 4. Citation Accuracy & Quality Check
        citation_issues: List[str] = []
        citation_accuracy = 1.0

        if not response.citations:
            if response.verdict != ComplianceVerdict.INSUFFICIENT_DATA:
                citation_issues.append("Missing citations for conclusive compliance verdict.")
                citation_accuracy = 0.0
        else:
            for idx, cite in enumerate(response.citations):
                if cite.citation_index is not None and cite.citation_index < 1:
                    citation_issues.append(f"Invalid citation index {cite.citation_index}.")
                
                # Check if citation maps to an actual retrieved chunk
                matched_chunk = next(
                    (
                        c for c in response.retrieved_chunks
                        if (cite.chunk_id and c.chunk_id == cite.chunk_id)
                        or (cite.clause_number and cite.clause_number in c.clause_number)
                        or (cite.document_title and cite.document_title in c.doc_title)
                    ),
                    None,
                )
                if not matched_chunk:
                    citation_issues.append(f"Ungrounded citation [{cite.citation_index or idx+1}] not found in retrieved chunks.")
            
            if citation_issues:
                citation_accuracy = 0.0

        # 5. Failure Reason Classification
        failure_reason = "NONE"
        if not verdict_correct:
            if not response.retrieved_chunks:
                failure_reason = "RETRIEVAL_FAILURE"
            elif any(c.score < 0.01 for c in response.retrieved_chunks):
                failure_reason = "WEAK_CONTEXT"
            elif tc.get("conversation_history") and not response.search_metadata.get("was_rewritten"):
                failure_reason = "QUERY_REWRITING_FAILURE"
            else:
                failure_reason = "GENERATION_MISMATCH"
        elif citation_issues:
            failure_reason = "CITATION_MAPPING_ERROR"

        return {
            "id": tc["id"],
            "category": tc["category"],
            "query": tc["query"],
            "rewritten_query": response.search_metadata.get("rewritten_query"),
            "expected_verdict": expected_verdict,
            "generated_verdict": response.verdict.value,
            "correctness_score": correctness_score,
            "keyword_score": keyword_score,
            "grounding_score": grounding_score,
            "citation_accuracy": citation_accuracy,
            "citation_issues": citation_issues,
            "failure_reason": failure_reason,
            "retrieved_chunks_count": len(response.retrieved_chunks),
            "citations_count": len(response.citations),
            "elapsed_time_ms": response.search_metadata.get("elapsed_time_ms", 0),
            "summary": response.summary,
        }

    def run_suite(self) -> Dict[str, Any]:
        """Runs all test cases in dataset and produces comprehensive evaluation summary."""
        results = []
        for tc in self.dataset:
            res = self.evaluate_item(tc)
            results.append(res)

        total = len(results)
        correct_count = sum(1 for r in results if r["correctness_score"] == 1.0)
        overall_correctness = round((correct_count / total) * 100, 2) if total else 0.0

        avg_grounding = round(sum(r["grounding_score"] for r in results) / total * 100, 2) if total else 0.0
        avg_citation_acc = round(sum(r["citation_accuracy"] for r in results) / total * 100, 2) if total else 0.0

        # Refusal guardrail accuracy
        refusal_cases = [r for r in results if r["category"] in ["Hallucination Guardrail Refusal", "Adversarial Security"]]
        refusal_correct = sum(1 for r in refusal_cases if r["correctness_score"] == 1.0)
        refusal_accuracy = round((refusal_correct / len(refusal_cases)) * 100, 2) if refusal_cases else 100.0

        # Failure classification breakdown
        failure_breakdown: Dict[str, int] = {}
        for r in results:
            reason = r["failure_reason"]
            if reason != "NONE":
                failure_breakdown[reason] = failure_breakdown.get(reason, 0) + 1

        return {
            "summary": {
                "total_test_cases": total,
                "overall_correctness_rate": overall_correctness,
                "overall_grounding_score": avg_grounding,
                "overall_citation_accuracy": avg_citation_acc,
                "guardrail_refusal_accuracy": refusal_accuracy,
                "failure_breakdown": failure_breakdown,
            },
            "per_question_results": results,
        }
