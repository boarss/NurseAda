"""
Imaging agent: medical image analysis via LLM vision (primary) and XAI
saliency (supplementary).  Falls back gracefully when services are unavailable.
"""
from __future__ import annotations

import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_LLM_URL, GATEWAY_XAI_URL
from app.services.verification import get_standard_disclaimer
from app.services.discourse import t as discourse_t


class ImagingAgent(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "imaging"

    @property
    def description(self) -> str:
        return "Medical image analysis (X-ray, CT, MRI, skin, wound) via LLM vision"

    # ── helpers ───────────────────────────────────────────────────────

    async def _call_llm_vision(
        self, image_base64: str, prompt: str
    ) -> str | None:
        """Call the LLM gateway /v1/vision endpoint.  Returns the analysis
        text or None on failure."""
        if not GATEWAY_LLM_URL:
            return None
        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{GATEWAY_LLM_URL.rstrip('/')}/v1/vision",
                    json={"image_base64": image_base64, "prompt": prompt},
                    timeout=30.0,
                )
                if r.status_code == 200:
                    return r.json().get("content")
        except Exception:
            pass
        return None

    async def _call_xai_saliency(
        self, image_base64: str
    ) -> dict | None:
        """Call the XAI saliency endpoint for a supplementary heatmap."""
        if not GATEWAY_XAI_URL:
            return None
        image_url = (
            image_base64
            if "base64," in image_base64
            else f"data:image/png;base64,{image_base64}"
        )
        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{GATEWAY_XAI_URL.rstrip('/')}/visualize/saliency",
                    json={"image_url": image_url, "features": None},
                    timeout=15.0,
                )
                if r.status_code == 200:
                    return r.json()
        except Exception:
            pass
        return None

    # ── main execution ───────────────────────────────────────────────

    async def execute(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> AgentResult:
        context = context or {}
        locale = context.get("locale", "en")
        image_base64: str | None = context.get("image_base64") or context.get("image_url")

        if not image_base64:
            return AgentResult(
                content=discourse_t("could_not_match", locale)
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=[],
            )

        prompt = user_message or "Analyze this medical image."
        sources: list[str] = []
        sections: list[str] = []

        # 1) Primary: LLM vision analysis
        vision_text = await self._call_llm_vision(image_base64, prompt)
        if vision_text:
            sections.append(f"**Image analysis**\n\n{vision_text}")
            sources.append("LLM Vision")

        # 2) Supplementary: XAI saliency (non-blocking)
        xai_data = await self._call_xai_saliency(image_base64)
        xai_meta = None
        if xai_data:
            xai_meta = xai_data
            if xai_data.get("type") == "saliency_radiology" and xai_data.get("status") != "placeholder":
                desc = xai_data.get("description", "")
                if desc:
                    sections.append(f"**Saliency map**\n\n{desc}")
                    sources.append("XAI")

        if not sections:
            return AgentResult(
                content=discourse_t("could_not_process", locale)
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=[],
            )

        body = "\n\n---\n\n".join(sections)
        return AgentResult(
            content=body + get_standard_disclaimer(),
            agent_id=self.agent_id,
            sources=sources,
            metadata=xai_meta,
        )
