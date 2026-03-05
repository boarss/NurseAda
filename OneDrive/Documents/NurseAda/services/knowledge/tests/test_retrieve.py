from fastapi.testclient import TestClient

from app.main import app


def test_retrieve_basic():
    client = TestClient(app)
    r = client.post("/retrieve", json={"query": "fever in adult", "topK": 3})
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body["items"], list)
    assert len(body["items"]) >= 1
    assert "title" in body["items"][0]

