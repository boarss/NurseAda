import pytest
import importlib

import app.agents.triage_agent as triage_module
from app.agents.triage_agent import TriageAgent

generate_response_module = importlib.import_module("app.clinical.generate_response")


@pytest.mark.asyncio
async def test_triage_agent_returns_clinical_trace_metadata():
    # Force local fallback path so the test does not depend on external CDSS availability.
    triage_module.GATEWAY_CDSS_URL = ""
    agent = TriageAgent()
    result = await agent.execute("I have chest pain and can't breathe", context={"locale": "en"})
    assert result.metadata is not None
    trace = result.metadata.get("clinical_trace")
    assert trace is not None
    assert isinstance(trace.get("extracted_symptoms"), list)
    diagnosis = trace.get("diagnosis", {})
    assert diagnosis.get("severity") in ("low", "medium", "high", "emergency", "unknown")
    assert isinstance(trace.get("red_flags", []), list)
    assert "shap" in diagnosis
    assert diagnosis.get("shap") is None


@pytest.mark.asyncio
async def test_triage_agent_includes_red_flags_on_fallback():
    triage_module.GATEWAY_CDSS_URL = ""
    agent = TriageAgent()
    result = await agent.execute("My face is drooping and speech is slurred", context={"locale": "en"})
    trace = (result.metadata or {}).get("clinical_trace", {})
    diagnosis = trace.get("diagnosis", {})
    red_flags = trace.get("red_flags", [])
    assert diagnosis.get("severity") == "emergency"
    assert red_flags


@pytest.mark.asyncio
async def test_triage_agent_propagates_cdss_shap(monkeypatch):
    triage_module.GATEWAY_CDSS_URL = "http://cdss.test"
    triage_module.GATEWAY_KNOWLEDGE_URL = ""

    shap_payload = {
        "explains_model": "cdss_logistic_triage",
        "predicted_class": "emergency",
        "base_value": 0.1,
        "top_contributions": [
            {"feature": "Emergency symptoms (emergency)", "value": 1.0, "shap": 0.5},
        ],
    }

    class FakeResponse:
        status_code = 200

        def json(self):
            return {
                "severity": "emergency",
                "suggestions": ["Seek emergency care now."],
                "inferred_codes": [{"system": "ICD-10", "code": "R00", "display": "Emergency symptoms"}],
                "confidence": 0.9,
                "reasoning": "test",
                "severity_probabilities": {"low": 0.0, "medium": 0.0, "high": 0.1, "emergency": 0.9},
                "red_flags": [],
                "shap": shap_payload,
            }

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, json=None, timeout=None):
            return FakeResponse()

    monkeypatch.setattr(triage_module.httpx, "AsyncClient", lambda **kwargs: FakeClient())
    agent = TriageAgent()
    result = await agent.execute("chest pain", context={"locale": "en"})
    diagnosis = (result.metadata or {}).get("clinical_trace", {}).get("diagnosis", {})
    assert diagnosis.get("shap") == shap_payload


@pytest.mark.asyncio
async def test_generate_response_falls_back_without_llm(monkeypatch):
    monkeypatch.setattr(generate_response_module, "GATEWAY_LLM_URL", "")
    artifact = {
        "severity": "high",
        "confidence": 0.8,
        "reasoning": "Symptoms suggest respiratory concern.",
        "suggestions": ["Seek urgent medical attention today."],
        "inferred_codes": [{"system": "ICD-10", "code": "R06", "display": "Respiratory concern"}],
    }
    text = await generate_response_module.generate_response(artifact, locale="en")
    assert "high" in text.lower()
    assert "recommend" in text.lower()
