"""Tests for CDSS triage logic."""
import pytest
from app.triage_logic import run_triage, TriageResult


def test_triage_emergency():
    r = run_triage("I have chest pain")
    assert r.severity == "emergency"
    assert r.suggestions
    assert "emergency" in r.suggestions[0].lower() or "112" in r.suggestions[0]
    assert 0.0 <= r.confidence <= 1.0


def test_triage_fever():
    r = run_triage("I have a fever")
    assert r.severity in ("medium", "high")
    assert r.suggestions
    assert r.inferred_codes
    assert r.reasoning
    assert 0.0 <= r.confidence <= 1.0


def test_triage_empty():
    r = run_triage("")
    assert r.severity == "low"
    assert r.confidence == 0.0
    assert r.severity_probabilities is None


def test_triage_headache():
    r = run_triage("severe headache")
    assert r.severity in ("high", "medium")
    assert any("headache" in s.lower() or "provider" in s.lower() for s in r.suggestions)
    assert 0.0 <= r.confidence <= 1.0


def test_triage_uses_extracted_symptoms_from_context():
    r = run_triage(
        "I feel unwell",
        context={"extracted_symptoms": [{"term": "chest pain"}, {"term": "can't breathe"}]},
    )
    assert r.severity == "emergency"
    assert any("emergency" in s.lower() or "112" in s for s in r.suggestions)


def test_triage_probabilities_sum_to_one():
    r = run_triage("I have chest pain and high fever")
    assert r.severity_probabilities is not None
    probs = r.severity_probabilities
    assert set(probs.keys()) == {"low", "medium", "high", "emergency"}
    total = sum(probs.values())
    assert total == pytest.approx(1.0, abs=1e-6)
    for value in probs.values():
        assert 0.0 <= value <= 1.0


@pytest.mark.parametrize(
    ("query", "expected_severity"),
    [
        ("My face is drooping and my speech is slurred", "emergency"),
        ("I have hives with wheezing", "emergency"),
        ("This is the worst headache of my life", "high"),
        ("I have back pain and can't urinate", "high"),
        ("Bleeding while pregnant", "high"),
        ("I'm pregnant and have heavy bleeding", "emergency"),
        ("My baby is under 3 months and has a fever", "high"),
        ("I want to kill myself", "emergency"),
    ],
)
def test_triage_red_flags(query: str, expected_severity: str):
    r = run_triage(query)
    assert r.severity == expected_severity
    assert r.red_flags
    assert "red flag" in r.reasoning.lower()


def test_triage_shap_payload_chest_pain():
    r = run_triage("I have chest pain")
    assert r.shap is not None
    assert r.shap.get("explains_model") == "cdss_logistic_triage"
    assert r.shap.get("predicted_class") in ("low", "medium", "high", "emergency")
    top = r.shap.get("top_contributions") or []
    assert top
    assert len(top) <= 12
    for row in top:
        assert "feature" in row and "value" in row and "shap" in row
        assert row["value"] in (0.0, 1.0)
        assert isinstance(row["shap"], (int, float)) and row["shap"] == row["shap"]  # finite
    assert isinstance(r.shap.get("base_value"), (int, float))


def test_triage_shap_empty_query():
    r = run_triage("")
    assert r.shap is None
