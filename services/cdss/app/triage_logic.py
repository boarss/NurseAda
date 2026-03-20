"""
Triage logic: symptom → severity, suggestions, and inferred codes for transparency.
Uses simple rules; can be extended with SNOMED-CT/ICD-10 lookup.
"""
from dataclasses import dataclass

from app.diagnosis_engine import diagnose
from app.recommendation_engine import build_recommendations

@dataclass
class TriageResult:
    severity: str  # low | medium | high | emergency
    suggestions: list[str]
    inferred_codes: list[dict]  # e.g. [{"system": "ICD-10", "code": "R50", "display": "Fever"}]
    confidence: float  # 0–1
    reasoning: str  # short explanation so users see the system is aware
    severity_probabilities: dict[str, float] | None = None
    red_flags: list[dict] | None = None
    shap: dict | None = None


# Default when no rule matches
DEFAULT_SEVERITY = "low"
DEFAULT_CODE = {"system": "ICD-10", "code": "R69", "display": "Unknown cause"}
DEFAULT_SUGGESTION = "I'd recommend sharing your symptoms with a healthcare provider for a proper assessment. This is not a diagnosis."


def run_triage(query: str, context: dict | None = None) -> TriageResult:
    """Run triage: infer severity, suggestions, and codes so recommendations are transparent."""
    context = context or {}
    text = (query or "").strip().lower()
    if not text:
        return TriageResult(
            severity=DEFAULT_SEVERITY,
            suggestions=[DEFAULT_SUGGESTION],
            inferred_codes=[DEFAULT_CODE],
            confidence=0.0,
            reasoning="No symptom description provided.",
            severity_probabilities=None,
            red_flags=None,
            shap=None,
        )

    diagnosis = diagnose(text, context)
    matched_severity = diagnosis.severity or DEFAULT_SEVERITY
    matched_codes = diagnosis.inferred_codes or [DEFAULT_CODE]
    matched_suggestions = build_recommendations(matched_severity, matched_codes)
    reasoning_parts = diagnosis.reasoning_parts or ["I'm giving general guidance based on what you shared."]
    confidence = diagnosis.confidence

    return TriageResult(
        severity=matched_severity,
        suggestions=matched_suggestions,
        inferred_codes=matched_codes,
        confidence=confidence,
        reasoning=" ".join(reasoning_parts) if reasoning_parts else "General assessment.",
        severity_probabilities=diagnosis.severity_probabilities,
        red_flags=diagnosis.red_flags,
        shap=diagnosis.shap,
    )
