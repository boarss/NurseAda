"""
Fallback triage when CDSS is not configured. Mirrors CDSS triage logic
so users always receive medical advice when describing symptoms.
"""
import re
from dataclasses import dataclass


@dataclass
class FallbackTriageResult:
    severity: str
    suggestions: list[str]
    inferred_codes: list[dict]
    confidence: float
    reasoning: str


# Symptom patterns → (severity, code, display, suggestion)
# DKA/ketone aligned with DKA playbook, ketone conversation, pathways-to-prevention
TRIAGE_RULES = [
    (r"\b(dka|diabetic ketoacidosis|ketoacidosis)\b", "emergency", "E10.10", "DKA", "Seek emergency care now. DKA is life-threatening. Call 112 or go to the nearest emergency department."),
    (r"\b(fruity breath|kussmaul|ketones?.*(?:high|large|moderate)|high ketones?|large ketones?)\b", "emergency", "E10.10", "DKA symptoms", "Seek emergency care now. These can indicate DKA. Call 112 or go to the nearest emergency department."),
    (r"\b(chest pain|can't breathe|unconscious|stroke|severe bleed|overdose|suicide|convulsion|seizure)\b", "emergency", "R00", "Emergency symptoms", "Seek emergency care now. Call 112 or go to the nearest emergency department."),
    (r"\b(severe pain|difficulty breathing|shortness of breath)\b", "high", "R06", "Respiratory/cardiac concern", "Seek urgent medical attention today. If worsening, go to emergency."),
    (r"\b(high fever|fever over 39|fever 39)\b", "high", "R50.9", "Fever (high)", "Rest, fluids, and fever reducer as directed. See a provider if fever persists >3 days or you have other worrying symptoms."),
    (r"\b(severe headache|worst headache|sudden headache)\b", "high", "R51", "Severe headache", "Rest in a quiet place. If sudden or worst-ever headache, seek urgent care."),
    (r"\b(vomiting blood|coughing blood|blood in stool)\b", "high", "R58", "Bleeding", "Seek urgent medical care. Do not delay."),
    (r"\b(ketones?|blood ketone|urine ketone)\b", "high", "R82.2", "Ketones", "Check blood sugar. If ketones are moderate/large with high blood sugar, seek urgent care. If small, follow sick-day plan: fluids, insulin per provider. Call your diabetes team."),
    (r"\b(diabetes.*(?:vomit|vomiting|nausea)|high blood sugar.*(?:sick|ill|vomit))\b", "high", "E11", "Diabetes + illness", "Illness with diabetes requires extra monitoring. Check ketones. Follow sick-day plan. Seek care if ketones are moderate/large or you cannot keep fluids down."),
    (r"\b(fever|temperature)\b", "medium", "R50.9", "Fever", "Rest and fluids. Consider paracetamol. See a provider if fever is high or lasts more than 3 days."),
    (r"\b(cough|coughing)\b", "medium", "R05", "Cough", "Rest, fluids, honey (if safe for you). See a provider if cough is severe or lasts >2 weeks."),
    (r"\b(headache|head ache)\b", "medium", "R51", "Headache", "Rest, hydration, pain relief as appropriate. Seek care if severe or sudden."),
    (r"\b(diarrhea|diarrhoea|loose stool)\b", "medium", "R19.7", "Diarrhea", "Stay hydrated (ORS if available). Avoid fatty foods. See a provider if severe or bloody."),
    (r"\b(pain|hurt|aching|ache)\b", "medium", "R52", "Pain", "Rest and over-the-counter pain relief if appropriate. Describe location and duration to a provider if it persists."),
    (r"\b(tired|fatigue|weak)\b", "low", "R53", "Tiredness", "Rest, good sleep, and hydration. If prolonged, a provider can check for causes."),
    (r"\b(sick|unwell|don't feel well|feel bad|nausea|vomit|dizzy|rash|swell)\b", "low", "R69", "General symptoms", "Rest and monitor. If symptoms worsen or persist, consult a healthcare provider."),
]

DEFAULT_SEVERITY = "low"
DEFAULT_CODE = {"system": "ICD-10", "code": "R69", "display": "Unknown cause"}
DEFAULT_SUGGESTION = "I'd recommend sharing your symptoms with a healthcare provider for a proper assessment. This is not a diagnosis."


def run_fallback_triage(query: str) -> FallbackTriageResult:
    """Run triage when CDSS is unavailable. Returns severity, suggestions, and reasoning."""
    text = (query or "").strip().lower()
    if not text:
        return FallbackTriageResult(
            severity=DEFAULT_SEVERITY,
            suggestions=[DEFAULT_SUGGESTION],
            inferred_codes=[DEFAULT_CODE],
            confidence=0.0,
            reasoning="I didn't receive enough detail to assess.",
        )

    severity_order = {"emergency": 4, "high": 3, "medium": 2, "low": 1}
    matched_severity = DEFAULT_SEVERITY
    matched_suggestions: list[str] = []
    matched_codes: list[dict] = []
    reasoning_parts: list[str] = []

    for pattern, severity, code, display, suggestion in TRIAGE_RULES:
        if re.search(pattern, text, re.I):
            if severity_order.get(severity, 0) >= severity_order.get(matched_severity, 0):
                matched_severity = severity
            matched_suggestions.append(suggestion)
            matched_codes.append({"system": "ICD-10", "code": code, "display": display})
            reasoning_parts.append(f"Your description suggests {display} ({severity} severity).")

    if not matched_suggestions:
        matched_suggestions = [DEFAULT_SUGGESTION]
        matched_codes = [DEFAULT_CODE]
        reasoning_parts = ["I'm giving general guidance based on what you shared."]

    confidence = 0.7 if matched_codes and matched_codes[0] != DEFAULT_CODE else 0.4
    if matched_severity == "emergency":
        confidence = 0.95

    return FallbackTriageResult(
        severity=matched_severity,
        suggestions=matched_suggestions,
        inferred_codes=matched_codes,
        confidence=confidence,
        reasoning=" ".join(reasoning_parts) if reasoning_parts else "General assessment.",
    )
