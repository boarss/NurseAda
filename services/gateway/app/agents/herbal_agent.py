"""
Herbal agent: evidence-based herbal and natural remedy recommendations.

- Herbal content comes only from the knowledge service (curated/herbal_content);
  no hospital or FMC APIs are used for herbal data.
- Complementary to conventional care — never a substitute.
See .cursor/skills/herbal-recommendations/SKILL.md for full guidance.
"""
from __future__ import annotations

import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_KNOWLEDGE_URL
from app.services.verification import get_standard_disclaimer
from app.services.discourse import (
    format_herbal_response,
    t as discourse_t,
)


class HerbalAgent(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "herbal"

    @property
    def description(self) -> str:
        return "Herbal and natural remedy recommendations (complementary to conventional care)"

    async def execute(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> AgentResult:
        context = context or {}
        locale = context.get("locale", "en")

        if not GATEWAY_KNOWLEDGE_URL:
            return AgentResult(
                content=discourse_t("could_not_match", locale)
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=[],
            )

        # Independence policy: do not fetch external medication lists via FHIR/EHR.
        # `medications` may still be provided by the user/UI as free-text (optional).
        medications: list[str] = list(context.get("medications") or [])

        retrieve_context: dict = {}
        if medications:
            retrieve_context["medications"] = medications

        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{GATEWAY_KNOWLEDGE_URL.rstrip('/')}/retrieve/herbal",
                    json={
                        "query": user_message,
                        "top_k": 3,
                        "context": retrieve_context or None,
                    },
                    timeout=8.0,
                )
                if r.status_code != 200:
                    return AgentResult(
                        content=discourse_t("could_not_process", locale)
                        + get_standard_disclaimer(),
                        agent_id=self.agent_id,
                        sources=[],
                    )

                data = r.json()
                chunks = data.get("chunks", [])

                if not chunks:
                    return AgentResult(
                        content=discourse_t("could_not_match", locale)
                        + get_standard_disclaimer(),
                        agent_id=self.agent_id,
                        sources=[],
                    )

                body = format_herbal_response(chunks, locale)
                body += discourse_t("herbal_disclaimer", locale)
                body += get_standard_disclaimer()

                return AgentResult(
                    content=body,
                    agent_id=self.agent_id,
                    sources=data.get("sources", ["Knowledge – Herbal"]),
                    metadata={"chunks": chunks},
                )

        except Exception:
            return AgentResult(
                content=discourse_t("something_went_wrong", locale)
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=[],
            )
