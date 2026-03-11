"""Integration-style tests for /chat triage and emergency flows."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.agents.orchestrator import AgentOrchestrator


client = TestClient(app)


def _make_chat_request(message: str) -> dict:
    return {
        "messages": [
            {"role": "user", "content": message},
        ]
    }


@pytest.mark.asyncio
async def test_chat_triage_mild_symptom_returns_disclaimer():
    resp = client.post("/chat", json=_make_chat_request("I have a mild headache and fever"))
    assert resp.status_code == 200
    data = resp.json()
    reply = data["reply"]
    assert reply
    # Should not be emergency wording
    assert "emergency" in reply.lower() or "consult" in reply.lower() or "not a substitute" in reply.lower()


@pytest.mark.asyncio
async def test_chat_triage_emergency_symptom_emergency_wording():
    resp = client.post("/chat", json=_make_chat_request("I have chest pain and can't breathe"))
    assert resp.status_code == 200
    data = resp.json()
    reply = data["reply"].lower()
    # Emergency flows should clearly advise immediate care
    assert "emergency" in reply or "112" in reply or "seek care immediately" in reply


