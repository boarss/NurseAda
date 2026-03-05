from __future__ import annotations


def apply_output_policy(text: str, *, guardrail_profile: str) -> str:
    """
    Output policy scaffold.

    Keep this light in v0: more robust checks will be added once we have
    a full policy suite and clinical review.
    """
    _ = guardrail_profile
    return text.strip()


def confidence_heuristic(*, guardrail_profile: str) -> float:
    # Placeholder confidence. Later: calibrate with retrieval coverage and rule hits.
    if guardrail_profile == "primary_care_v1":
        return 0.65
    return 0.6

