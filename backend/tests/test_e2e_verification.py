"""
End-to-End Verification Test Suite for SiteSafe Construction Compliance Assistant.
Tests the complete 14-step RAG lifecycle:
1. System Health Check
2. Dynamic Document Upload & Indexing
3. Vector Index Verification
4. Single-Turn RAG Query
5. Grounded Compliance Verification & Answer Generation
6. Progressive Answer Streaming (SSE)
7. Citation Mapping & Source Extraction
8. Original Source Chunk Inspection
9. Hallucination Refusal Guardrail
10. Conversational Multi-Turn Follow-up
11. Query Cache Hit Validation
12. Structured Audit Logging & Metrics API Verification
"""

import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

HEADERS = {"X-API-Key": settings.INGEST_API_KEY}


def test_full_e2e_rag_lifecycle():
    # --------------------------------------------------------------------------
    # STEP 1: Start Services & Check System Health
    # --------------------------------------------------------------------------
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["status"] == "healthy"
    assert "Qdrant" in health_data["vector_store"]
    initial_doc_count = health_data["indexed_documents"]

    # --------------------------------------------------------------------------
    # STEP 2: Upload & Index Document at Runtime
    # --------------------------------------------------------------------------
    e2e_doc_content = (
        "SECTION 26 55 00 - SPECIAL EMERGENCY INVERTER LIGHTING SPECIFICATIONS\n\n"
        "1.01 SUMMARY\n"
        "A. Provide central emergency lighting inverter systems for life safety illumination.\n\n"
        "2.01 BATTERY BACKUP RUNTIME REQUIREMENTS\n"
        "A. Emergency inverter battery backup system shall provide 100% rated load capacity "
        "for a MINIMUM duration of 90 MINUTES upon primary AC power failure in compliance with NFPA 101.\n"
        "B. Transfer time from normal utility power to battery emergency mode shall NOT exceed 50 milliseconds.\n"
    )
    upload_res = client.post(
        "/api/upload",
        files={"file": ("spec_div_26_55_00_e2e_emergency_inverter.txt", e2e_doc_content.encode("utf-8"), "text/plain")},
        headers=HEADERS,
    )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert upload_data["status"] == "success"
    assert upload_data["chunks_indexed"] > 0

    # --------------------------------------------------------------------------
    # STEP 3: Verify Vector Index Update
    # --------------------------------------------------------------------------
    docs_res = client.get("/api/documents")
    assert docs_res.status_code == 200
    docs_list = docs_res.json()
    assert len(docs_list) >= initial_doc_count

    # --------------------------------------------------------------------------
    # STEP 4, 5 & 6: Ask Question, Retrieve Context, Generate Grounded Answer
    # --------------------------------------------------------------------------
    query_payload = {
        "question": "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?",
        "trade": "Electrical",
        "top_k": 5,
    }
    query_res = client.post("/api/query", json=query_payload)
    assert query_res.status_code == 200
    query_data = query_res.json()
    assert query_data["status"] == "success"
    assert query_data["answer"] != ""
    assert query_data["verdict"] in ["Non-Compliant", "Compliant"]

    # --------------------------------------------------------------------------
    # STEP 7: Progressive Answer Streaming (SSE)
    # --------------------------------------------------------------------------
    stream_payload = {
        "question": "Cylinder break tests achieved 4,850 psi at 28 days for elevated post-tensioned deck slab. Is this compliant?",
        "trade": "Structural",
        "stream": True,
    }
    stream_res = client.post("/api/query", json=stream_payload)
    assert stream_res.status_code == 200
    assert "text/event-stream" in stream_res.headers["content-type"]
    stream_content = stream_res.text
    assert "event: metadata" in stream_content
    assert "event: token" in stream_content
    assert "event: done" in stream_content

    # --------------------------------------------------------------------------
    # STEP 8, 9 & 10: Display Citations, Open Citation & Verify Retrieved Chunk
    # --------------------------------------------------------------------------
    assert len(query_data["sources"]) > 0
    top_source = query_data["sources"][0]
    assert top_source["chunk_id"] != ""
    assert top_source["direct_quote"] != ""

    # --------------------------------------------------------------------------
    # STEP 11: Weak Context / Out-of-Scope Safe Refusal Guardrail
    # --------------------------------------------------------------------------
    refusal_payload = {
        "question": "What standard size acoustic ceiling tile pattern is approved for executive restrooms?",
        "trade": "General",
    }
    refusal_res = client.post("/api/query", json=refusal_payload)
    assert refusal_res.status_code == 200
    refusal_data = refusal_res.json()
    assert refusal_data["status"] == "refusal"
    assert refusal_data["verdict"] == "Ambiguous/Insufficient Data"

    # --------------------------------------------------------------------------
    # STEP 12: Conversational Multi-Turn Follow-up
    # --------------------------------------------------------------------------
    conv_payload = {
        "question": "What alternative metallic conduit options are permitted instead?",
        "trade": "Electrical",
        "conversation_history": [
            {
                "question": "Can we install 1-inch Schedule 40 PVC conduit for low-voltage controls in the drop-ceiling return air plenum?",
                "answer": "PVC conduit is non-compliant in return air plenums per NEC 300.22(C).",
            }
        ],
    }
    conv_res = client.post("/api/query", json=conv_payload)
    assert conv_res.status_code == 200
    conv_data = conv_res.json()
    assert conv_data["status"] in ["success", "refusal"]

    # --------------------------------------------------------------------------
    # STEP 13: Query Cache Hit Verification
    # --------------------------------------------------------------------------
    repeat_res = client.post("/api/query", json=query_payload)
    assert repeat_res.status_code == 200
    repeat_data = repeat_res.json()
    assert repeat_data["metadata"].get("cache_hit") is True

    # --------------------------------------------------------------------------
    # STEP 14: Structured Logging & Metrics API Verification
    # --------------------------------------------------------------------------
    metrics_res = client.get("/api/metrics")
    assert metrics_res.status_code == 200
    metrics_data = metrics_res.json()
    assert metrics_data["total_requests"] >= 3
    assert metrics_data["cache_hits"] >= 1
    assert metrics_data["total_tokens"] > 0
    assert metrics_data["estimated_total_cost_usd"] >= 0.0
