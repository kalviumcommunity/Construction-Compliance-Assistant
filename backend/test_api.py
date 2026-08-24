"""
Verification script for FastAPI compliance endpoints using FastAPI TestClient / httpx.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200, f"Health failed: {response.text}"
    data = response.json()
    print("[PASS] Health Check Passed:", data["service"], f"({data['indexed_documents']} indexed docs)")


def test_documents():
    response = client.get("/api/documents")
    assert response.status_code == 200, f"Documents failed: {response.text}"
    docs = response.json()
    assert len(docs) > 0, "No documents returned"
    print(f"[PASS] Documents Check Passed: {len(docs)} regulatory documents found.")


def test_non_compliant_plenum_pvc():
    payload = {
        "query": "Can we install 1-inch Schedule 40 PVC conduit for low-voltage lighting in the ceiling return air plenum?",
        "trade": "Electrical",
        "jurisdiction": "National",
        "document_type": "Code",
        "top_k": 5,
    }
    response = client.post("/api/verify-compliance", json=payload)
    assert response.status_code == 200, f"Verification failed: {response.text}"
    res = response.json()
    print("\n--- Test 1: Plenum PVC Conduit ---")
    print(f"Verdict: {res['verdict']}")
    print(f"Confidence: {res['confidence_score']}")
    print(f"Summary: {res['summary']}")
    print(f"Citations ({len(res['citations'])}): {[c['clause_number'] for c in res['citations']]}")
    assert res["verdict"] == "Non-Compliant", f"Expected Non-Compliant, got {res['verdict']}"
    assert len(res["citations"]) > 0, "Expected at least one citation"


def test_compliant_concrete_psi():
    payload = {
        "query": "Cylinder break tests achieved 4,850 psi at 28 days for elevated post-tensioned deck slab. Is this compliant?",
        "trade": "Structural",
        "jurisdiction": "National",
        "document_type": "Project Spec",
        "top_k": 5,
    }
    response = client.post("/api/verify-compliance", json=payload)
    assert response.status_code == 200, f"Verification failed: {response.text}"
    res = response.json()
    print("\n--- Test 2: Concrete Compressive Strength ---")
    print(f"Verdict: {res['verdict']}")
    print(f"Confidence: {res['confidence_score']}")
    print(f"Summary: {res['summary']}")
    assert res["verdict"] == "Compliant", f"Expected Compliant, got {res['verdict']}"


def test_ambiguous_out_of_scope():
    payload = {
        "query": "What is the allowable paint hue for the janitor closet door hinges?",
        "trade": "All",
        "jurisdiction": "All",
        "document_type": "All",
        "top_k": 3,
    }
    response = client.post("/api/verify-compliance", json=payload)
    assert response.status_code == 200, f"Verification failed: {response.text}"
    res = response.json()
    print("\n--- Test 3: Out-of-Scope / Ambiguous Query ---")
    print(f"Verdict: {res['verdict']}")
    print(f"Summary: {res['summary']}")
    assert res["verdict"] == "Ambiguous/Insufficient Data", f"Expected Ambiguous/Insufficient Data, got {res['verdict']}"


if __name__ == "__main__":
    print("Running Construction Compliance Verification Suite...\n")
    test_health()
    test_documents()
    test_non_compliant_plenum_pvc()
    test_compliant_concrete_psi()
    test_ambiguous_out_of_scope()
    print("\nALL TESTS PASSED SUCCESSFULLY!")
