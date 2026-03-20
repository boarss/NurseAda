"""
Symptom extraction stage for the clinical reasoning pipeline.
Uses LLM when available, with deterministic regex fallback.
"""
import json
import re

import httpx

from app.config import GATEWAY_LLM_URL

_FALLBACK_TERMS = (
    "fever",
    "headache",
    "cough",
    "nausea",
    "vomiting",
    "chest pain",
    "shortness of breath",
    "dizziness",
    "fatigue",
    "rash",
    "ketones",
    "blood sugar",
    "diarrhea",
)


def _fallback_extract(user_message: str) -> list[dict]:
    text = (user_message or "").lower()
    out: list[dict] = []
    for term in _FALLBACK_TERMS:
        if re.search(rf"\b{re.escape(term)}\b", text):
            out.append({"term": term, "present": True, "negated": False})
    return out


def _build_prompt(user_message: str) -> str:
    return (
        "Extract symptoms from the user text and return strict JSON only.\n"
        "Output format: "
        '{"symptoms":[{"term":"string","present":true,"negated":false,"duration":"string|null","severity":"string|null"}]}\n'
        "Do not include diagnosis or recommendations.\n"
        f"User text: {user_message}"
    )


async def extract_symptoms(user_message: str, context: dict | None = None) -> list[dict]:
    context = context or {}
    history = context.get("conversation_history", [])

    if not GATEWAY_LLM_URL:
        return _fallback_extract(user_message)

    messages = [{"role": m.get("role", "user"), "content": m.get("content", "")} for m in history[-4:]]
    messages.append({"role": "user", "content": _build_prompt(user_message)})

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{GATEWAY_LLM_URL.rstrip('/')}/v1/complete",
                json={"messages": messages, "max_tokens": 350, "locale": context.get("locale", "en")},
                timeout=20.0,
            )
            if r.status_code != 200:
                return _fallback_extract(user_message)
            content = (r.json().get("content") or "").strip()
            parsed = json.loads(content)
            symptoms = parsed.get("symptoms", [])
            if isinstance(symptoms, list):
                normalized: list[dict] = []
                for item in symptoms:
                    if not isinstance(item, dict):
                        continue
                    term = item.get("term")
                    if not isinstance(term, str) or not term.strip():
                        continue
                    normalized.append(
                        {
                            "term": term.strip().lower(),
                            "present": bool(item.get("present", True)),
                            "negated": bool(item.get("negated", False)),
                            "duration": item.get("duration"),
                            "severity": item.get("severity"),
                        }
                    )
                return normalized or _fallback_extract(user_message)
    except Exception:
        return _fallback_extract(user_message)

    return _fallback_extract(user_message)
