"""
Triage logic: symptom → severity, suggestions, and inferred codes for transparency.
Uses simple rules; can be extended with SNOMED-CT/ICD-10 lookup.
"""
from dataclasses import dataclass
import re

@dataclass
class TriageResult:
    severity: str  # low | medium | high | emergency
    suggestions: list[str]
    inferred_codes: list[dict]  # e.g. [{"system": "ICD-10", "code": "R50", "display": "Fever"}]
    confidence: float  # 0–1
    reasoning: str  # short explanation so users see the system is aware


# Symptom phrase patterns → (severity, ICD-10-like code, display, suggestion)
# Format: (regex or keyword, severity, code, display, suggestion)
# DKA/ketone content aligned with DKA playbook, ketone conversation, pathways-to-prevention
TRIAGE_RULES = [
    # Emergency – DKA, ketone crisis
    (r"\b(dka|diabetic ketoacidosis|ketoacidosis)\b", "emergency", "E10.10", "DKA", "Seek emergency care now. DKA is life-threatening. Call 112 or go to the nearest emergency department."),
    (r"\b(fruity breath|kussmaul|ketones.*(?:high|large|moderate)|high ketones|large ketones)\b", "emergency", "E10.10", "DKA symptoms", "Seek emergency care now. These can indicate DKA. Call 112 or go to the nearest emergency department."),
    (r"\b(chest pain|can't breathe|unconscious|stroke|severe bleed|overdose|suicide|convulsion|seizure)\b", "emergency", "R00", "Emergency symptoms", "Seek emergency care now. Call 112 or go to the nearest emergency department."),
    (r"\b(severe pain|difficulty breathing|shortness of breath)\b", "high", "R06", "Respiratory/cardiac concern", "Seek urgent medical attention today. If worsening, go to emergency."),
    # High
    (r"\b(high fever|fever over 39|fever 39)\b", "high", "R50.9", "Fever (high)", "Rest, fluids, and fever reducer as directed. See a provider if fever persists >3 days or you have other worrying symptoms."),
    (r"\b(severe headache|worst headache|sudden headache)\b", "high", "R51", "Severe headache", "Rest in a quiet place. If sudden or worst-ever headache, seek urgent care."),
    (r"\b(vomiting blood|coughing blood|blood in stool)\b", "high", "R58", "Bleeding", "Seek urgent medical care. Do not delay."),
    # High – diabetes/ketone concerns (pre-DKA)
    (r"\b(ketones?|blood ketone|urine ketone)\b", "high", "R82.2", "Ketones", "Check blood sugar. If ketones are moderate/large with high blood sugar, seek urgent care. If small, follow sick-day plan: fluids, insulin per provider. Call your diabetes team."),
    (r"\b(diabetes.*(?:vomit|vomiting|nausea)|high blood sugar.*(?:sick|ill|vomit))\b", "high", "E11", "Diabetes + illness", "Illness with diabetes requires extra monitoring. Check ketones. Follow sick-day plan. Seek care if ketones are moderate/large or you cannot keep fluids down."),
    # Medium
    (r"\b(fever|temperature)\b", "medium", "R50.9", "Fever", "Rest and fluids. Consider paracetamol. See a provider if fever is high or lasts more than 3 days."),
    (r"\b(cough| coughing)\b", "medium", "R05", "Cough", "Rest, fluids, honey (if safe for you). See a provider if cough is severe or lasts >2 weeks."),
    (r"\b(headache|head ache)\b", "medium", "R51", "Headache", "Rest, hydration, pain relief as appropriate. Seek care if severe or sudden."),
    (r"\b(diarrhea|diarrhoea|loose stool)\b", "medium", "R19.7", "Diarrhea", "Stay hydrated (ORS if available). Avoid fatty foods. See a provider if severe or bloody."),
    (r"\b(pain|hurt|aching)\b", "medium", "R52", "Pain", "Rest and over-the-counter pain relief if appropriate. Describe location and duration to a provider if it persists."),
    # Low / catch-all
    (r"\b(tired|fatigue|weak)\b", "low", "R53", "Tiredness", "Rest, good sleep, and hydration. If prolonged, a provider can check for causes."),
]

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
        )

    SEVERITY_ORDER = {"emergency": 4, "high": 3, "medium": 2, "low": 1}
    matched_severity = DEFAULT_SEVERITY
    matched_suggestions: list[str] = []
    matched_codes: list[dict] = []
    reasoning_parts: list[str] = []

    for pattern, severity, code, display, suggestion in TRIAGE_RULES:
        if re.search(pattern, text, re.I):
            if SEVERITY_ORDER.get(severity, 0) >= SEVERITY_ORDER.get(matched_severity, 0):
                matched_severity = severity
            matched_suggestions.append(suggestion)
            matched_codes.append({"system": "ICD-10", "code": code, "display": display})
            reasoning_parts.append(f"Your description suggests {display} ({severity} severity).")

    if not matched_suggestions:
        matched_suggestions = [DEFAULT_SUGGESTION]
        matched_codes = [DEFAULT_CODE]
        reasoning_parts = ["I'm giving general guidance based on what you shared."]

    # Confidence: higher if we matched something specific
    confidence = 0.7 if matched_codes and matched_codes[0] != DEFAULT_CODE else 0.4
    if matched_severity == "emergency":
        confidence = 0.95

    return TriageResult(
        severity=matched_severity,
        suggestions=matched_suggestions,
        inferred_codes=matched_codes,
        confidence=confidence,
        reasoning=" ".join(reasoning_parts) if reasoning_parts else "General assessment.",
    )
