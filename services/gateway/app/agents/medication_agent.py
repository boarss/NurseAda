"""
Medication agent: drug info, interactions, formulary (FHIR + pharmacy APIs).
"""
import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_FHIR_URL, GATEWAY_CDSS_URL, PHARMACY_API_URL
from app.services.verification import get_standard_disclaimer
from app.services.discourse import t as discourse_t


class MedicationAgent(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "medication"

    @property
    def description(self) -> str:
        return "Medication information, interactions, and pharmacy"

    async def execute(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> AgentResult:
        context = context or {}
        patient_id = context.get("patient_id")
        locale = context.get("locale", "en")
        # Optional: current medications from FHIR
        current_meds_note = ""
        if patient_id and GATEWAY_FHIR_URL:
            try:
                async with httpx.AsyncClient() as client:
                    r = await client.get(
                        f"{GATEWAY_FHIR_URL.rstrip('/')}/MedicationRequest",
                        params={"patient": patient_id},
                        timeout=10.0,
                    )
                    if r.status_code == 200:
                        current_meds_note = " [Current medications from record may be considered.]"
            except Exception:
                pass

        if not GATEWAY_CDSS_URL and not PHARMACY_API_URL:
            return AgentResult(
                content=discourse_t("could_not_process", locale)
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
            )

        # Drug interactions via CDSS
        interactions_text = ""
        if GATEWAY_CDSS_URL:
            try:
                async with httpx.AsyncClient() as client:
                    r = await client.post(
                        f"{GATEWAY_CDSS_URL.rstrip('/')}/drug-interactions",
                        json={"query": user_message, "patient_id": patient_id},
                        timeout=10.0,
                    )
                    if r.status_code == 200:
                        data = r.json()
                        warnings = data.get("warnings", []) or [i.get("message", str(i)) for i in data.get("interactions", [])]
                        codes_checked = data.get("codes_checked", [])
                        if warnings:
                            interactions_text = "Interaction check: " + "; ".join(
                                w if isinstance(w, str) else str(w) for w in warnings[:5]
                            ) + "\n\n"
                        if codes_checked:
                            interactions_text += "Codes checked for this response: " + ", ".join(
                                c.get("name", str(c)) for c in codes_checked[:5]
                            ) + ".\n\n"
            except Exception:
                pass

        # Pharmacy API stub (expand when pharmacy endpoint is defined)
        if PHARMACY_API_URL:
            try:
                async with httpx.AsyncClient() as client:
                    r = await client.post(
                        f"{PHARMACY_API_URL.rstrip('/')}/query",
                        json={"query": user_message},
                        timeout=10.0,
                    )
                    if r.status_code == 200:
                        data = r.json()
                        reply = data.get("reply", data.get("message", ""))
                        if reply:
                            content = interactions_text + reply + current_meds_note + get_standard_disclaimer()
                            return AgentResult(
                                content=content,
                                agent_id=self.agent_id,
                                sources=["CDSS", "Pharmacy"],
                            )
            except Exception:
                pass

        content = (
            interactions_text
            or discourse_t("could_not_match", locale)
            + current_meds_note
            + get_standard_disclaimer()
        )
        return AgentResult(content=content, agent_id=self.agent_id, sources=[])
