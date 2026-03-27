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
        "You are a medical communication layer for a primary-care triage assistant.\n"
        "Turn the structured clinical artifact into clear, empathetic, patient-facing text.\n"
        "Rules:\n"
        "- Preserve severity exactly; never downgrade emergency or urgent wording.\n"
        "- Do not add diagnoses, drug doses, or new medical claims beyond the artifact.\n"
        "- Keep every actionable recommendation from the artifact as a bullet (•).\n"
        "- Include the reasoning field in plain language; avoid robotic labels like 'Assessment:'.\n"
        "- Use a warm, professional tone: 'Based on what you've shared', 'I'd recommend'.\n"
        "- Do not contradict emergency instructions (e.g. call 112, go to emergency department)."
    )
    user_message = (
        "Convert this structured clinical artifact into concise patient-facing text. "
        "Use short paragraphs and bullet points where helpful.\n\n"
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
