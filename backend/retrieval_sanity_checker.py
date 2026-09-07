import os
import json
import numpy as np
from typing import List, Dict, Any

from similarity_ranker import compute_similarities, embed_texts

def run_retrieval_sanity_tests() -> Dict[str, Any]:
    """
    Retrieval Sanity Test Suite (Tasks 1-4).
    Validates known query-chunk relevance and identifies edge/borderline cases.
    """
    print("=" * 80)
    print("SITESAFE RETRIEVAL QUALITY & SANITY VERIFICATION SUITE")
    print("=" * 80)

    # Candidate Corpus (Diverse Construction & Admin Chunks)
    corpus = [
        {
            "id": "chunk_fire_01",
            "text": "IBC 2021 Section 705.8: Exterior walls of Type V construction located less than 5 feet from the lot line shall have a minimum fire-resistance rating of 1 hour and must have 0% unprotected openings.",
            "metadata": {"doc": "IBC_2021.pdf", "section": "705.8", "trade": "Fire Safety"}
        },
        {
            "id": "chunk_struct_01",
            "text": "ACI 318 Section 26.5.3: Cast-in-place concrete footings require high-sulfate resistant concrete with a minimum 28-day compressive strength of 4,500 psi and 7 consecutive days of wet curing.",
            "metadata": {"doc": "Tower_B_Specs.md", "section": "03 30 00", "trade": "Structural"}
        },
        {
            "id": "chunk_elec_01",
            "text": "NEC 2023 Article 210.8(B): Ground-Fault Circuit-Interrupter (GFCI) protection shall be provided for all 125V through 250V receptacles on temporary construction power distributions.",
            "metadata": {"doc": "NEC_2023.pdf", "section": "210.8(B)", "trade": "Electrical"}
        },
        {
            "id": "chunk_plumb_01",
            "text": "IPC 2021 Section 604.4: Maximum flow rates for plumbing fixtures shall not exceed 1.6 gallons per flushing cycle for water closets and 0.5 gpm for public lavatory faucets.",
            "metadata": {"doc": "IPC_2021.pdf", "section": "604.4", "trade": "Plumbing"}
        },
        {
            "id": "chunk_admin_01",
            "text": "All site personnel must submit weekly safety sign-in sheets and daily shift log timesheets to the trailer office by 5:00 PM Friday.",
            "metadata": {"doc": "Site_Admin_Policy.txt", "section": "Admin 1.2", "trade": "Administrative"}
        },
        {
            "id": "chunk_fire_02_ambiguous",
            "text": "General Construction Site Policy: Temporary open flames, hot work, and site heaters require daily fire watch sign-off logs submitted to the safety trailer.",
            "metadata": {"doc": "Site_Safety_Manual.pdf", "section": "Section 4.1", "trade": "Safety/Admin"}
        }
    ]

    corpus_texts = [c["text"] for c in corpus]
    corpus_matrix = embed_texts(corpus_texts)

    # Task 1: Known Relevance Test Cases
    test_cases = [
        {
            "test_id": "TEST-01",
            "name": "Fire Wall Setback Query",
            "query": "What are the fire rating requirements and allowable window openings for an exterior wall built 4 feet from a lot line?",
            "expected_top_id": "chunk_fire_01",
            "expected_top_trade": "Fire Safety",
            "expected_last_id": "chunk_admin_01",
            "category": "Standard Direct Match"
        },
        {
            "test_id": "TEST-02",
            "name": "Concrete Curing Query",
            "query": "How many days of wet curing are required for foundation concrete footings to reach compressive strength?",
            "expected_top_id": "chunk_struct_01",
            "expected_top_trade": "Structural",
            "expected_last_id": "chunk_admin_01",
            "category": "Standard Direct Match"
        },
        {
            "test_id": "TEST-03",
            "name": "Temporary Power GFCI Query",
            "query": "Are GFCI receptacles mandatory for temporary construction site power supply?",
            "expected_top_id": "chunk_elec_01",
            "expected_top_trade": "Electrical",
            "expected_last_id": "chunk_admin_01",
            "category": "Standard Direct Match"
        },
        # Task 3: Edge / Surprising Case
        {
            "test_id": "TEST-04",
            "name": "Borderline / Ambiguous Fire Inspection Query",
            "query": "Who must review daily fire logs for site safety approval?",
            "expected_top_id": "chunk_fire_02_ambiguous",
            "expected_top_trade": "Safety/Admin",
            "expected_last_id": "chunk_plumb_01",
            "category": "Borderline Keyword Overlap / Multi-Domain Ambiguity"
        }
    ]

    passed_tests = 0
    failed_tests = 0
    test_results = []

    print("-" * 80)
    for tc in test_cases:
        query_text = tc["query"]
        q_vec = embed_texts([query_text])[0]
        scores = compute_similarities(q_vec, corpus_matrix, metric="cosine")

        ranked_indices = np.argsort(scores)[::-1]
        
        top_idx = ranked_indices[0]
        top_chunk = corpus[top_idx]
        top_score = float(scores[top_idx])

        last_idx = ranked_indices[-1]
        last_chunk = corpus[last_idx]
        last_score = float(scores[last_idx])

        # Task 2: Confirm related ranks above unrelated
        passed_top = (top_chunk["id"] == tc["expected_top_id"])
        passed_last = (last_chunk["id"] == tc["expected_last_id"])
        
        is_success = passed_top and passed_last
        if is_success:
            passed_tests += 1
            status = "PASS"
        else:
            failed_tests += 1
            status = "FAIL / SURPRISING"

        result_entry = {
            "test_id": tc["test_id"],
            "name": tc["name"],
            "category": tc["category"],
            "query": query_text,
            "status": status,
            "top_ranked_id": top_chunk["id"],
            "top_ranked_doc": top_chunk["metadata"]["doc"],
            "top_ranked_trade": top_chunk["metadata"]["trade"],
            "top_score": round(top_score, 4),
            "expected_top_id": tc["expected_top_id"],
            "least_ranked_id": last_chunk["id"],
            "least_score": round(last_score, 4),
            "delta_score": round(top_score - last_score, 4)
        }
        test_results.append(result_entry)

        print(f"\n[{status}] {tc['test_id']}: {tc['name']} ({tc['category']})")
        print(f"  Query:            \"{query_text}\"")
        print(f"  Top Ranked Match: {top_chunk['metadata']['doc']} ({top_chunk['metadata']['section']}) - Score: {top_score:.4f}")
        print(f"  Least Match:      {last_chunk['metadata']['doc']} ({last_chunk['metadata']['section']}) - Score: {last_score:.4f}")
        print(f"  Delta Margin:     {top_score - last_score:.4f}")

    print("\n" + "=" * 80)
    print("SANITY REPORT SUMMARY")
    print("=" * 80)
    print(f"Total Tests Executed: {len(test_cases)}")
    print(f"Tests Passed:         {passed_tests}")
    print(f"Tests Flagged/Failed: {failed_tests}")
    print("-" * 80)

    summary_data = {
        "total_tests": len(test_cases),
        "passed": passed_tests,
        "failed": failed_tests,
        "results": test_results
    }

    with open("retrieval_sanity_report.json", "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)

    return summary_data

if __name__ == "__main__":
    run_retrieval_sanity_tests()
