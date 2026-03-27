"""Golden-style checks for deterministic triage recommendations."""
import pytest

from app.recommendation_engine import build_recommendations


def test_recommendations_emergency_base():
    r = build_recommendations(
        "emergency",
        [{"system": "ICD-10", "code": "R00", "display": "Emergency symptoms"}],
    )
    assert r[0].lower().startswith("seek emergency")
    assert any("112" in s for s in r)


def test_recommendations_cough_supplement():
    r = build_recommendations(
        "medium",
        [{"system": "ICD-10", "code": "R05", "display": "Cough"}],
    )
    assert any("cough" in s.lower() for s in r)
    assert any("two weeks" in s.lower() or "2 weeks" in s.lower() for s in r)


def test_recommendations_diarrhea_supplement():
    r = build_recommendations(
        "medium",
        [{"system": "ICD-10", "code": "R19.7", "display": "Diarrhea"}],
    )
    assert any("rehydration" in s.lower() or "fluids" in s.lower() for s in r)


def test_recommendations_headache_supplement_not_duplicate_pain():
    r = build_recommendations(
        "medium",
        [{"system": "ICD-10", "code": "R51", "display": "Headache"}],
    )
    assert any("headache" in s.lower() for s in r)
    assert not any("note where and how long the pain" in s.lower() for s in r)


@pytest.mark.parametrize(
    ("severity", "codes"),
    [
        ("low", [{"system": "ICD-10", "code": "R53", "display": "Tiredness"}]),
        ("high", [{"system": "ICD-10", "code": "R58", "display": "Bleeding"}]),
    ],
)
def test_recommendations_supplements_for_severity(severity, codes):
    r = build_recommendations(severity, codes)
    assert len(r) >= 2
    assert all(isinstance(s, str) and s.strip() for s in r)
