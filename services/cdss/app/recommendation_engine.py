"""
Deterministic recommendation engine based on diagnosis severity/codes.
"""


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

    displays = {
        str(c.get("display", "")).lower()
        for c in inferred_codes
        if isinstance(c, dict)
    }
    if any("ketone" in d or "dka" in d for d in displays):
        base.append(
            "Check blood sugar and ketones. If ketones are moderate or large, seek urgent care immediately."
        )
    if any("fever" in d for d in displays):
        base.append(
            "Use fluids and rest; seek care if fever is high or lasts more than 3 days."
        )
    if any("headache" in d for d in displays):
        base.append(
            "Rest in a quiet place and stay hydrated; seek urgent care for sudden or severe headache."
        )

    deduped: list[str] = []
    seen: set[str] = set()
    for item in base:
        key = item.strip().lower()
        if key and key not in seen:
            seen.add(key)
            deduped.append(item)
    return deduped
