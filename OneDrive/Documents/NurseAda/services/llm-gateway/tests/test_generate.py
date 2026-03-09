import os

from fastapi.testclient import TestClient


def test_generate_mock_provider():
    os.environ["LLM_PROVIDER"] = "mock"

    from app.main import app  # noqa: E402

    client = TestClient(app)
    r = client.post(
        "/generate",
        json={
            "messages": [{"role": "user", "content": "I have a fever"}],
            "guardrailProfile": "primary_care_v1",
            "traceId": "test-trace",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body["content"], str) and len(body["content"]) > 0
    assert body["model"] == "mock"
    assert 0.0 <= float(body["confidence"]) <= 1.0

