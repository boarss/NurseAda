"""Fallback triage supplements stay aligned with CDSS recommendation_engine."""
from app.services.fallback_triage import run_fallback_triage


def test_fallback_cough_includes_supplement_line():
    r = run_fallback_triage("I have a bad cough for weeks")
    assert "Cough" in str(r.inferred_codes)
    texts = " ".join(r.suggestions).lower()
    assert "cough" in texts
    assert "two weeks" in texts or "2 weeks" in texts


def test_fallback_chest_pain_emergency():
    r = run_fallback_triage("I have chest pain")
    assert r.severity == "emergency"
    assert any("112" in s or "emergency" in s.lower() for s in r.suggestions)
