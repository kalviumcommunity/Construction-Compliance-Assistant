"""
CLI Evaluation Runner Script for SiteSafe Construction Compliance Assistant.
Runs benchmark evaluation test set against the live RAG pipeline, prints a formatted
Markdown report, and saves full scored results to backend/eval/evaluation_results.json.
"""

import os
import sys
import json
import logging

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from eval.evaluator import RAGEvaluator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("sitesafe.run_evaluation")


def main():
    dataset_path = os.path.join(backend_dir, "eval", "test_dataset.json")
    output_path = os.path.join(backend_dir, "eval", "evaluation_results.json")

    logger.info(f"Initializing RAG Evaluator with dataset: {dataset_path}")
    evaluator = RAGEvaluator(dataset_path=dataset_path)

    logger.info("Executing end-to-end evaluation suite...")
    report = evaluator.run_suite()

    # Save output to evaluation_results.json
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    logger.info(f"Full evaluation results exported to: {output_path}")

    # Format Markdown summary report for console & walkthrough documentation
    summary = report["summary"]
    print("\n" + "=" * 80)
    print("SITESAFE RAG END-TO-END EVALUATION SUMMARY REPORT")
    print("=" * 80)
    print(f"Total Test Cases Evaluated : {summary['total_test_cases']}")
    print(f"Overall Correctness Rate   : {summary['overall_correctness_rate']}%")
    print(f"Overall Grounding Score    : {summary['overall_grounding_score']}%")
    print(f"Citation Accuracy Rate     : {summary['overall_citation_accuracy']}%")
    print(f"Guardrail Refusal Accuracy : {summary['guardrail_refusal_accuracy']}%")
    print("-" * 80)
    print("FAILURE BREAKDOWN BY ROOT CAUSE:")
    if summary["failure_breakdown"]:
        for cause, count in summary["failure_breakdown"].items():
            print(f" - {cause}: {count}")
    else:
        print(" - None! All test cases passed successfully.")
    print("=" * 80)

    print("\nPER-QUESTION EVALUATION DETAILS:")
    print("-" * 80)
    for res in report["per_question_results"]:
        status_icon = "[PASS]" if res["correctness_score"] == 1.0 else "[FAIL]"
        print(f"{status_icon} {res['id']} ({res['category']}): '{res['query'][:65]}...'")
        print(f"       Expected: {res['expected_verdict']} | Generated: {res['generated_verdict']}")
        print(f"       Correctness: {res['correctness_score']} | Grounding: {res['grounding_score']} | Citation Accuracy: {res['citation_accuracy']}")
        if res["rewritten_query"]:
            print(f"       Rewritten Query: '{res['rewritten_query']}'")
        if res["failure_reason"] != "NONE":
            print(f"       Failure Reason: {res['failure_reason']}")
        print()

    print("=" * 80)


if __name__ == "__main__":
    main()
