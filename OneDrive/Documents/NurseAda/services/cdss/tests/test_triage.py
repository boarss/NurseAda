from fastapi.testclient import TestClient

from app.main import app


def test_triage_non_emergency():
    client = TestClient(app)
    r = client.post("/triage", json={"text": "I have a mild headache", "traceId": "t1"})
    assert r.status_code == 200
    body = r.json()
    assert body["severity"] in {"mild", "moderate", "emergency"}
    assert isinstance(body["reasons"], list)


def test_triage_emergency_flag():
    client = TestClient(app)
    r = client.post("/triage", json={"text": "sudden chest pain and difficulty breathing", "traceId": "t2"})
    assert r.status_code == 200
    body = r.json()
    assert body["emergency"] is True
    assert body["severity"] == "emergency"

