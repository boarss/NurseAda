"""
Deterministic diagnosis engine for triage severity and inferred codes.
"""
from dataclasses import dataclass
from functools import lru_cache
import logging
import re
from random import Random

import numpy as np
from sklearn.linear_model import LogisticRegression
from app.red_flags import match_red_flags

logger = logging.getLogger(__name__)

SEVERITY_ORDER = {"emergency": 4, "high": 3, "medium": 2, "low": 1}
CLASS_ORDER = ["low", "medium", "high", "emergency"]
DEFAULT_CODE = {"system": "ICD-10", "code": "R69", "display": "Unknown cause"}
SHAP_TOP_K = 12

# Symptom phrase patterns -> (severity, ICD-10-like code, display)
TRIAGE_RULES = [
    (r"\b(dka|diabetic ketoacidosis|ketoacidosis)\b", "emergency", "E10.10", "DKA"),
    (r"\b(fruity breath|kussmaul|ketones.*(?:high|large|moderate)|high ketones|large ketones)\b", "emergency", "E10.10", "DKA symptoms"),
    (r"\b(chest pain|can't breathe|unconscious|stroke|severe bleed|overdose|suicide|convulsion|seizure)\b", "emergency", "R00", "Emergency symptoms"),
    (r"\b(severe pain|difficulty breathing|shortness of breath)\b", "high", "R06", "Respiratory/cardiac concern"),
    (r"\b(high fever|fever over 39|fever 39)\b", "high", "R50.9", "Fever (high)"),
    (r"\b(severe headache|worst headache|sudden headache)\b", "high", "R51", "Severe headache"),
    (r"\b(vomiting blood|coughing blood|blood in stool)\b", "high", "R58", "Bleeding"),
    (r"\b(ketones?|blood ketone|urine ketone)\b", "high", "R82.2", "Ketones"),
    (r"\b(diabetes.*(?:vomit|vomiting|nausea)|high blood sugar.*(?:sick|ill|vomit))\b", "high", "E11", "Diabetes + illness"),
    (r"\b(fever|temperature)\b", "medium", "R50.9", "Fever"),
    (r"\b(cough| coughing)\b", "medium", "R05", "Cough"),
    (r"\b(headache|head ache)\b", "medium", "R51", "Headache"),
    (r"\b(diarrhea|diarrhoea|loose stool)\b", "medium", "R19.7", "Diarrhea"),
    (r"\b(pain|hurt|aching)\b", "medium", "R52", "Pain"),
    (r"\b(tired|fatigue|weak)\b", "low", "R53", "Tiredness"),
]


@dataclass
class DiagnosisResult:
    severity: str
    inferred_codes: list[dict]
    confidence: float
    reasoning_parts: list[str]
    severity_probabilities: dict[str, float] | None = None
    red_flags: list[dict] | None = None
    shap: dict | None = None


def _context_symptom_text(context: dict) -> str:
    extracted = context.get("extracted_symptoms")
    if not isinstance(extracted, list):
        return ""
    terms: list[str] = []
    for item in extracted:
        if isinstance(item, dict):
            value = item.get("term") or item.get("name") or item.get("symptom")
            if isinstance(value, str):
                terms.append(value.strip().lower())
        elif isinstance(item, str):
            terms.append(item.strip().lower())
    return " ".join(t for t in terms if t)


def _severity_from_indices(indices: list[int]) -> str:
    if not indices:
        return "low"
    max_score = 0
    max_severity = "low"
    for idx in indices:
        severity = TRIAGE_RULES[idx][1]
        score = SEVERITY_ORDER.get(severity, 0)
        if score >= max_score:
            max_score = score
            max_severity = severity
    return max_severity


def _feature_vector_from_text(text: str) -> tuple[np.ndarray, list[int]]:
    features = np.zeros(len(TRIAGE_RULES), dtype=float)
    matched_indices: list[int] = []
    for idx, (pattern, _severity, _code, _display) in enumerate(TRIAGE_RULES):
        if re.search(pattern, text, re.I):
            features[idx] = 1.0
            matched_indices.append(idx)
    return features, matched_indices


def _triage_feature_label(idx: int) -> str:
    _pattern, severity, _code, display = TRIAGE_RULES[idx]
    return f"{display} ({severity})"


@lru_cache(maxsize=1)
def _training_matrix_and_labels() -> tuple[tuple[tuple[float, ...], ...], tuple[str, ...]]:
    """Fixed synthetic X, y (hashable rows for cache). Same data trains the model and backs SHAP."""
    rng = Random(42)
    rows: list[tuple[float, ...]] = []
    labels: list[str] = []
    max_subset = min(5, len(TRIAGE_RULES))

    rows.append(tuple([0.0] * len(TRIAGE_RULES)))
    labels.append("low")

    sample_count = 4000
    for _ in range(sample_count):
        subset_size = rng.randint(1, max_subset)
        selected = rng.sample(range(len(TRIAGE_RULES)), subset_size)
        row = [0.0] * len(TRIAGE_RULES)
        for idx in selected:
            row[idx] = 1.0
        rows.append(tuple(row))
        labels.append(_severity_from_indices(selected))

    return tuple(rows), tuple(labels)


def _training_arrays() -> tuple[np.ndarray, np.ndarray]:
    rows, labels = _training_matrix_and_labels()
    X = np.asarray(rows, dtype=float)
    y = np.asarray(labels, dtype=object)
    return X, y


@lru_cache(maxsize=1)
def _load_model() -> LogisticRegression:
    X, y = _training_arrays()
    model = LogisticRegression(
        solver="lbfgs",
        max_iter=1000,
        class_weight="balanced",
        random_state=42,
    )
    model.fit(X, y)
    return model


_cdss_linear_explainer = None


def _get_cdss_linear_explainer(model: LogisticRegression):
    global _cdss_linear_explainer
    if _cdss_linear_explainer is None:
        import shap

        X_bg, _ = _training_arrays()
        _cdss_linear_explainer = shap.LinearExplainer(model, X_bg)
    return _cdss_linear_explainer


def _compute_triage_shap(
    model: LogisticRegression,
    features: np.ndarray,
    predicted_severity: str,
) -> dict | None:
    """
    SHAP values for the multinomial logistic head, for the class with highest model probability.
    Explains the ML component only; final severity may be raised by rules or red flags.
    """
    try:
        explainer = _get_cdss_linear_explainer(model)
        x = features.reshape(1, -1)
        sv = explainer.shap_values(x)
        classes = [str(c) for c in model.classes_]
        if predicted_severity not in classes:
            predicted_severity = max(
                zip(classes, model.predict_proba(x)[0]),
                key=lambda t: t[1],
            )[0]
        class_idx = classes.index(predicted_severity)

        if isinstance(sv, list):
            row = np.asarray(sv[class_idx], dtype=float).reshape(-1)
        elif isinstance(sv, np.ndarray) and sv.ndim == 3:
            row = np.asarray(sv[0, :, class_idx], dtype=float).reshape(-1)
        else:
            row = np.asarray(sv, dtype=float).reshape(-1)

        ev = explainer.expected_value
        if isinstance(ev, np.ndarray):
            base_value = float(ev[class_idx]) if ev.ndim else float(ev)
        else:
            base_value = float(ev)

        contributions: list[dict] = []
        for i in range(len(TRIAGE_RULES)):
            contributions.append(
                {
                    "feature": _triage_feature_label(i),
                    "value": float(features[i]),
                    "shap": float(row[i]),
                }
            )
        contributions.sort(key=lambda c: abs(c["shap"]), reverse=True)
        top = contributions[:SHAP_TOP_K]

        return {
            "explains_model": "cdss_logistic_triage",
            "predicted_class": predicted_severity,
            "base_value": base_value,
            "top_contributions": top,
        }
    except Exception as e:
        logger.warning("CDSS SHAP computation failed: %s", e)
        return None


def _probability_map(
    model: LogisticRegression, probabilities: np.ndarray
) -> dict[str, float]:
    mapped = {severity: 0.0 for severity in CLASS_ORDER}
    for klass, probability in zip(model.classes_, probabilities):
        mapped[str(klass)] = float(probability)
    return mapped


def diagnose(text: str, context: dict | None = None) -> DiagnosisResult:
    context = context or {}
    normalized_text = text.strip().lower()
    combined_text = f"{normalized_text} {_context_symptom_text(context)}".strip()

    model = _load_model()
    features, matched_indices = _feature_vector_from_text(combined_text)
    probabilities = model.predict_proba(features.reshape(1, -1))[0]
    probability_map = _probability_map(model, probabilities)
    red_flags = match_red_flags(combined_text)

    predicted_severity = max(
        probability_map.items(),
        key=lambda item: item[1],
    )[0]
    rule_severity = _severity_from_indices(matched_indices)
    matched_severity = (
        rule_severity
        if SEVERITY_ORDER[rule_severity] >= SEVERITY_ORDER.get(predicted_severity, 0)
        else predicted_severity
    )
    if any(flag.get("tier") == "emergency" for flag in red_flags):
        matched_severity = "emergency"
    elif (
        any(flag.get("tier") == "urgent" for flag in red_flags)
        and SEVERITY_ORDER.get(matched_severity, 0) < SEVERITY_ORDER["high"]
    ):
        matched_severity = "high"
    matched_codes: list[dict] = []
    reasoning_parts: list[str] = []

    for idx, (_pattern, severity, code, display) in enumerate(TRIAGE_RULES):
        if idx in matched_indices:
            matched_codes.append({"system": "ICD-10", "code": code, "display": display})
            reasoning_parts.append(f"Your description suggests {display} ({severity} severity).")
    for flag in red_flags:
        reasoning_parts.append(f"Red flag recognized: {flag.get('label', 'serious symptom')}.")

    shap_payload = _compute_triage_shap(model, features, predicted_severity)

    if not matched_codes:
        if not reasoning_parts:
            reasoning_parts = ["I'm giving general guidance based on what you shared."]
        return DiagnosisResult(
            severity=matched_severity,
            inferred_codes=[DEFAULT_CODE],
            confidence=max(probability_map.values()),
            reasoning_parts=reasoning_parts,
            severity_probabilities=probability_map,
            red_flags=red_flags or None,
            shap=shap_payload,
        )

    return DiagnosisResult(
        severity=matched_severity,
        inferred_codes=matched_codes,
        confidence=max(probability_map.values()),
        reasoning_parts=reasoning_parts,
        severity_probabilities=probability_map,
        red_flags=red_flags or None,
        shap=shap_payload,
    )
