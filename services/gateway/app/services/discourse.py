"""
Professional discourse: practitioner-like tone for NurseAda responses.
Makes recommendations and diagnoses feel like talking to a real medical practitioner.
"""
# Practitioner-style framing for triage/diagnosis responses
TRIAGE_OPENING = "Based on what you've shared, here's my assessment."
SEVERITY_LINE = "I'd rate the severity as **{severity}**."
CONFIDENCE_LINE = "My confidence in this assessment is about {pct}%."
REASONING_LINE = "Here's my reasoning: {reasoning}"
RECOMMENDATIONS_HEADER = "Here's what I recommend:"
CODES_FOOTNOTE = "(I've used these clinical codes for transparency: {codes})"
HERBAL_HEADER = "**Complementary options (herbal/natural):**"

# Empathetic transitions
EMERGENCY_ACK = "I'm concerned about what you've described."
URGENT_ACK = "Given what you've shared, I'd advise acting soon."
ROUTINE_ACK = "From what you've described, this sounds manageable with some care."

# Error/fallback – still professional
COULD_NOT_PROCESS = (
    "I wasn't able to process that fully. Could you rephrase or add a bit more detail? "
    "For emergencies, please call 112 or go to the nearest hospital."
)
COULD_NOT_MATCH = (
    "I'd like to help, but I need a bit more detail. "
    "Could you mention specific symptoms (e.g. fever, headache, cough) or medication names? "
    "That way I can give you a proper recommendation."
)
SOMETHING_WENT_WRONG = (
    "Something went wrong on our side. Please try again. "
    "For urgent health issues, seek care in person or call emergency services."
)


def format_triage_response(
    severity: str,
    confidence: float | None,
    reasoning: str,
    suggestions: list[str],
    inferred_codes: list[dict],
    observations_note: str = "",
) -> str:
    """Build a practitioner-like triage response."""
    lines = [TRIAGE_OPENING, ""]
    lines.append(SEVERITY_LINE.format(severity=severity))
    if confidence is not None:
        lines.append(CONFIDENCE_LINE.format(pct=int(confidence * 100)))
    if reasoning:
        lines.append(REASONING_LINE.format(reasoning=reasoning))
    if suggestions:
        lines.append("")
        lines.append(RECOMMENDATIONS_HEADER)
        for s in suggestions:
            lines.append(f"• {s}")
    if inferred_codes:
        codes_str = ", ".join(c.get("display", c.get("code", "")) for c in inferred_codes[:5])
        lines.append("")
        lines.append(CODES_FOOTNOTE.format(codes=codes_str))
    if observations_note.strip():
        lines.append(observations_note.strip())
    return "\n".join(lines)
