"""
Herbal agent: evidence-based herbal and natural remedy recommendations.

- Herbal content comes only from the knowledge service (curated/herbal_content);
  no hospital or FMC APIs are used for herbal data.
- When patient_id is set, this agent may fetch patient medications from FHIR
  solely for drug–herb interaction and population safety via /retrieve/herbal.
- Complementary to conventional care — never a substitute.
See .cursor/skills/herbal-recommendations/SKILL.md for full guidance.
"""
from __future__ import annotations

import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_KNOWLEDGE_URL, GATEWAY_FHIR_URL
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

    async def _fetch_patient_medications(
        self, patient_id: str
    ) -> list[str]:
        """Pull active medication names from FHIR when available."""
        if not patient_id or not GATEWAY_FHIR_URL:
            return []
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(
                    f"{GATEWAY_FHIR_URL.rstrip('/')}/MedicationRequest",
                    params={"patient": patient_id},
                    timeout=8.0,
                )
                if r.status_code != 200:
                    return []
                data = r.json()
                entries = data.get("entry", [])
                meds: list[str] = []
                for e in entries:
                    res = e.get("resource", {})
                    concept = res.get("medicationCodeableConcept", {})
                    name = concept.get("text") or ""
                    if not name:
                        codings = concept.get("coding", [])
                        if codings:
                            name = codings[0].get("display", "")
                    if name:
                        meds.append(name)
                return meds
        except Exception:
            return []

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

        medications: list[str] = list(context.get("medications") or [])
        patient_id = context.get("patient_id")
        if patient_id and not medications:
            medications = await self._fetch_patient_medications(patient_id)

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
