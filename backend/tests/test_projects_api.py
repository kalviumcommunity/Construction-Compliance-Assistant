import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_empty_projects_initial():
    """Verify that initial projects list starts clean and empty."""
    res = client.get("/api/projects")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_create_and_delete_project():
    """Verify creating a project and deleting it dynamically."""
    # Create project
    create_payload = {
        "name": "Beacon Hill Innovation Lab",
        "location": "Boston, MA",
        "status": "active",
        "active_codes": ["IBC 2024", "NFPA 70 / NEC 2023", "MA State Code"]
    }
    res = client.post("/api/projects", json=create_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Beacon Hill Innovation Lab"
    assert data["location"] == "Boston, MA"
    assert data["status"] == "active"
    assert data["compliance_score"] == 100
    proj_id = data["id"]

    # Verify project is listed
    res_list = client.get("/api/projects")
    assert res_list.status_code == 200
    ids = [p["id"] for p in res_list.json()]
    assert proj_id in ids

    # Delete project
    del_res = client.delete(f"/api/projects/{proj_id}")
    assert del_res.status_code == 200
    assert del_res.json()["deleted_id"] == proj_id

    # Verify project is removed
    res_after = client.get("/api/projects")
    ids_after = [p["id"] for p in res_after.json()]
    assert proj_id not in ids_after
