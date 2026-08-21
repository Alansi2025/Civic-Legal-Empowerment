import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["ieee_7000_privacy_enforced"] is True


def test_api_triage_flow():
    payload = {
        "citizen_id": "test_citizen_1",
        "language": "English",
        "raw_text": "I want to file an RTI to inspect public road works expenditure in Ward 10."
    }
    response = client.post("/api/triage", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["pathway"] == "RTI Act 2005"
    assert "Public Information Officer" in data["public_authority"]


def test_api_draft_flow():
    intake = {
        "citizen_id": "test_citizen_1",
        "language": "English",
        "raw_text": "RTI query for road expenditure"
    }
    triage = {
        "pathway": "RTI Act 2005",
        "public_authority": "Public Works Department",
        "statutory_sections": ["Section 6(1) RTI"],
        "confidence_score": 0.95,
        "summary": "Summary text",
        "follow_up_questions": [],
        "requires_more_info": False
    }
    response = client.post("/api/draft", json={"intake": intake, "triage": triage})
    assert response.status_code == 200
    data = response.json()
    assert "draft_id" in data
    assert len(data["statutory_queries"]) >= 3


def test_api_consent_scan_and_verify():
    # Scan
    scan_res = client.post("/api/consent/scan", json={"text": "Aadhaar 9876 5432 1098"})
    assert scan_res.status_code == 200
    assert scan_res.json()["has_pii"] is True
    assert "XXXX-XXXX-1098" in scan_res.json()["redacted_text"]

    # Verify
    consent_payload = {
        "draft_id": "DRAFT-TEST-API",
        "citizen_signature_name": "Citizen Ramesh",
        "consent_acknowledged": True,
        "privacy_hash": scan_res.json()["privacy_hash"]
    }
    ver_res = client.post("/api/consent/verify", json=consent_payload)
    assert ver_res.status_code == 200
    assert ver_res.json()["verified"] is True
    assert "IEEE7000-TOKEN-" in ver_res.json()["consent_token"]


def test_api_supervisor_logs():
    res = client.get("/api/agents/supervisor/logs")
    assert res.status_code == 200
    data = res.json()
    assert data["supervisor_status"] == "ACTIVE_SUPERVISION"
    assert "total_events_logged" in data
