"""
Explanation-layer response generation.
Uses LLM for communication only with deterministic fallback formatting.
"""
import httpx

from app.config import GATEWAY_LLM_URL
from app.services.discourse import format_triage_response


def _fallback_response(artifact: dict, locale: str) -> str:
    return format_triage_response(
        severity=artifact.get("severity", "low"),
        confidence=artifact.get("confidence"),
        reasoning=artifact.get("reasoning", ""),
        suggestions=artifact.get("suggestions", []),
        inferred_codes=artifact.get("inferred_codes", []),
        locale=locale,
    )


async def generate_response(artifact: dict, locale: str = "en") -> str:
    if not GATEWAY_LLM_URL:
        return _fallback_response(artifact, locale)

    system_message = (
        "You are a medical communication layer.\n"
        "Only explain the provided clinical artifact clearly.\n"
        "Do not alter severity, diagnosis meaning, or emergency escalation instructions.\n"
        "Keep bullet recommendations and include the reasoning."
    )
    user_message = (
        "Convert this structured clinical artifact into concise patient-facing text:\n"
        f"{artifact}"
    )
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{GATEWAY_LLM_URL.rstrip('/')}/v1/complete",
                json={
                    "messages": [
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": user_message},
                    ],
                    "max_tokens": 500,
                    "locale": locale,
                },
                timeout=20.0,
            )
            if r.status_code == 200:
                content = (r.json().get("content") or "").strip()
                if content:
                    return content
    except Exception:
        pass

    return _fallback_response(artifact, locale)
