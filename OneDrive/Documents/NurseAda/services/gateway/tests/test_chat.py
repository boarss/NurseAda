from fastapi.testclient import TestClient

from app.main import app


def test_chat_basic_response_shape():
    client = TestClient(app)
    r = client.post(
        "/chat",
        json={
            "messages": [{"role": "user", "content": "I have a headache for 2 days."}],
            "locale": "en",
            "country": "NG",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert "traceId" in body
    assert body["message"]["role"] == "assistant"
    assert isinstance(body["message"]["content"], str) and len(body["message"]["content"]) > 0
    assert isinstance(body["safety"]["emergency"], bool)
    assert 0.0 <= float(body["safety"]["confidence"]) <= 1.0
    assert isinstance(body["safety"]["disclaimers"], list)

