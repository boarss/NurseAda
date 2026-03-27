"""
Deterministic recommendation engine based on diagnosis severity/codes.
"""


def _display_set(inferred_codes: list[dict]) -> set[str]:
    return {
        str(c.get("display", "")).lower()
        for c in inferred_codes
        if isinstance(c, dict)
    }


def build_recommendations(severity: str, inferred_codes: list[dict]) -> list[str]:
    base: list[str] = []

    if severity == "emergency":
        base.append("Seek emergency care now. Call 112 or go to the nearest emergency department.")
    elif severity == "high":
        base.append("Seek urgent medical attention today. If symptoms worsen, go to emergency.")
    elif severity == "medium":
        base.append("Monitor symptoms closely and seek care if symptoms persist or worsen.")
    else:
        base.append("If symptoms continue, consult a healthcare provider for a full assessment.")

    displays = _display_set(inferred_codes)
    if any("ketone" in d or "dka" in d for d in displays):
        base.append(
            "Check blood sugar and ketones. If ketones are moderate or large, seek urgent care immediately."
        )
    if any("diabetes" in d and "illness" in d for d in displays):
        base.append(
            "With diabetes and illness, monitor glucose more often and follow your sick-day plan; seek care if you cannot eat or drink normally."
        )
    if any("fever" in d for d in displays):
        base.append(
            "Use fluids and rest; seek care if fever is high or lasts more than 3 days."
        )
    if any("headache" in d for d in displays):
        base.append(
            "Rest in a quiet place and stay hydrated; seek urgent care for sudden or severe headache."
        )
    if any("cough" in d for d in displays):
        base.append(
            "Rest and fluids; seek care if breathing becomes difficult or cough lasts more than two weeks."
        )
    if any("diarrhea" in d for d in displays):
        base.append(
            "Use oral rehydration or fluids; seek care if diarrhea is severe, bloody, or you cannot keep fluids down."
        )
    if any("pain" in d for d in displays) and not any("headache" in d for d in displays):
        base.append(
            "Note where and how long the pain lasts; seek care if pain is severe, spreading, or getting worse."
        )
    if any("bleeding" in d for d in displays):
        base.append(
            "Bleeding symptoms need prompt in-person assessment; do not delay seeking care."
        )
    if any("respiratory" in d or "cardiac" in d for d in displays):
        base.append(
            "If breathing difficulty or chest discomfort worsens, seek emergency care without waiting."
        )
    if any("tired" in d or "tiredness" in d for d in displays):
        base.append(
            "Prioritise rest and hydration; see a provider if fatigue is severe or lasts weeks without improvement."
        )

    deduped: list[str] = []
    seen: set[str] = set()
    for item in base:
        key = item.strip().lower()
        if key and key not in seen:
            seen.add(key)
            deduped.append(item)
    return deduped
