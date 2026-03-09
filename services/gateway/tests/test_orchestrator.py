"""
Tests for the agent orchestrator: intent routing and verified execution.
"""
import pytest
from app.agents.orchestrator import AgentOrchestrator, _detect_intent


def test_detect_intent_emergency():
    assert _detect_intent("I have chest pain") == "emergency"
    assert _detect_intent("can't breathe") == "emergency"
    assert _detect_intent("emergency!") == "emergency"


def test_detect_intent_medication():
    assert _detect_intent("drug interaction with aspirin") == "medication"
    assert _detect_intent("pharmacy near me") == "medication"


def test_detect_intent_lab():
    assert _detect_intent("my blood test results") == "lab"
    assert _detect_intent("lab work") == "lab"


def test_detect_intent_triage():
    assert _detect_intent("I have a headache") == "triage"
    assert _detect_intent("symptom check") == "triage"


def test_detect_intent_explain():
    assert _detect_intent("why did you say that?") == "explain"
    assert _detect_intent("explain your recommendation") == "explain"
    assert _detect_intent("how did you decide?") == "explain"


def test_detect_intent_general():
    assert _detect_intent("what is NurseAda?") == "general"
    assert _detect_intent("hello") == "general"


@pytest.mark.asyncio
async def test_orchestrator_returns_verified_reply():
    orch = AgentOrchestrator()
    reply = await orch.run("I have a mild headache", context={})
    assert reply
    assert len(reply) <= 8000
    # Should contain disclaimer for clinical content
    assert "not a substitute" in reply or "consult" in reply.lower() or "emergency" in reply.lower()


@pytest.mark.asyncio
async def test_orchestrator_rejects_invalid_input():
    orch = AgentOrchestrator()
    reply = await orch.run("", context={})
    assert "couldn't process" in reply or "rephrase" in reply.lower()
