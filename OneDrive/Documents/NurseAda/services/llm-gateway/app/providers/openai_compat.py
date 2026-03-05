from __future__ import annotations

import httpx

from app.config import settings


class OpenAICompatProvider:
    async def generate(self, *, messages: list[dict[str, str]], trace_id: str | None) -> dict:
        base = settings.openai_compat_base_url.rstrip("/")
        url = f"{base}/chat/completions"

        headers = {"Authorization": f"Bearer {settings.openai_compat_api_key}"}
        if trace_id:
            headers["X-Trace-Id"] = trace_id

        payload = {
            "model": settings.openai_compat_model,
            "messages": messages,
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=settings.request_timeout_s) as client:
            r = await client.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()

        content = (
            (data.get("choices") or [{}])[0]
            .get("message", {})
            .get("content", "")
        )

        return {"content": str(content), "model": settings.openai_compat_model}

