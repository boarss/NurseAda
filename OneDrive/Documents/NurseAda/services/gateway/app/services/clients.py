from __future__ import annotations

from typing import Any

import httpx

from app.config import settings


async def call_cdss_triage(text: str, *, trace_id: str) -> dict[str, Any] | None:
    url = f"{settings.cdss_url.rstrip('/')}/triage"
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_s) as client:
            r = await client.post(url, json={"text": text, "traceId": trace_id})
            r.raise_for_status()
            return r.json()
    except Exception:
        return None


async def call_llm_generate(
    *,
    messages: list[dict[str, str]],
    guardrail_profile: str,
    trace_id: str,
) -> dict[str, Any] | None:
    url = f"{settings.llm_gateway_url.rstrip('/')}/generate"
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_s) as client:
            r = await client.post(
                url,
                json={
                    "messages": messages,
                    "guardrailProfile": guardrail_profile,
                    "traceId": trace_id,
                },
            )
            r.raise_for_status()
            return r.json()
    except Exception:
        return None

