from __future__ import annotations


def clamp_confidence(value: float) -> float:
    if value < 0.0:
        return 0.0
    if value > 1.0:
        return 1.0
    return value


def enforce_safe_completion(text: str, *, emergency: bool) -> str:
    """
    Minimal safety enforcement scaffold.

    For now we only prepend an emergency banner when needed.
    More robust policy enforcement will live in the LLM gateway + guardrails.
    """
    if not emergency:
        return text

    banner = (
        "This could be an emergency. Please seek urgent medical help now (local emergency number, nearest hospital/clinic).\\n\\n"
    )
    if text.startswith(banner):
        return text
    return banner + text

