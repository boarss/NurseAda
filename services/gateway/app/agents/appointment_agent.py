"""
Appointment agent: helps users find clinics, book appointments, and navigate
referrals. Uses the knowledge-service clinic directory for facility lookup
and Supabase for appointment persistence.
"""
from __future__ import annotations

import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_KNOWLEDGE_URL
from app.services.verification import get_standard_disclaimer
from app.services.discourse import (
    format_clinic_list,
    t as discourse_t,
)


class AppointmentAgent(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "appointment"

    @property
    def description(self) -> str:
        return "Clinic search, appointment booking guidance, and referral navigation"

    async def execute(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> AgentResult:
        context = context or {}
        locale = context.get("locale", "en")

        if not GATEWAY_KNOWLEDGE_URL:
            return AgentResult(
                content=discourse_t("could_not_process", locale)
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=[],
            )

        filters = self._extract_filters(user_message)

        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(
                    f"{GATEWAY_KNOWLEDGE_URL.rstrip('/')}/clinics",
                    params=filters,
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
                clinics = data.get("clinics", [])

                if not clinics:
                    return AgentResult(
                        content=discourse_t("could_not_match", locale)
                        + discourse_t("appointment_disclaimer", locale)
                        + get_standard_disclaimer(),
                        agent_id=self.agent_id,
                        sources=[],
                    )

                body = discourse_t("appointment_opening", locale) + "\n\n"
                body += format_clinic_list(clinics[:6], locale)
                body += discourse_t("appointment_disclaimer", locale)
                body += get_standard_disclaimer()

                return AgentResult(
                    content=body,
                    agent_id=self.agent_id,
                    sources=["Knowledge – Clinic Directory"],
                    metadata={"clinics_shown": len(clinics[:6])},
                )

        except Exception:
            return AgentResult(
                content=discourse_t("something_went_wrong", locale)
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=[],
            )

    @staticmethod
    def _extract_filters(text: str) -> dict[str, str]:
        """Best-effort keyword extraction for clinic search params."""
        lower = text.lower()
        params: dict[str, str] = {}
        states = [
            "lagos", "oyo", "fct", "abuja", "kano", "kaduna", "rivers",
            "enugu", "edo", "ogun", "delta", "anambra", "imo",
        ]
        for st in states:
            if st in lower:
                params["state"] = st.upper() if st != "abuja" else "FCT"
                break
        specialties = [
            "cardiology", "paediatrics", "pediatrics", "obstetrics",
            "ophthalmology", "orthopaedics", "orthopedics", "surgery",
            "psychiatry", "dermatology", "oncology", "radiology",
        ]
        for sp in specialties:
            if sp in lower:
                params["specialty"] = sp
                break
        facility_types = [
            ("primary health", "primary_health_center"),
            ("phc", "primary_health_center"),
            ("specialist", "specialist"),
            ("clinic", "clinic"),
            ("hospital", "hospital"),
        ]
        for kw, ft in facility_types:
            if kw in lower:
                params["type"] = ft
                break
        if not params:
            params["q"] = text[:100]
        return params
