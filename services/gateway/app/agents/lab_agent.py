"""
Lab agent: lab orders and results (FHIR DiagnosticReport/Observation + lab API).
"""
import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_FHIR_URL, LAB_API_URL
from app.services.verification import get_standard_disclaimer
from app.services.discourse import t as discourse_t


class LabAgent(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "lab"

    @property
    def description(self) -> str:
        return "Lab orders and results"

    async def execute(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> AgentResult:
        context = context or {}
        patient_id = context.get("patient_id")
        locale = context.get("locale", "en")
        # Optional: recent results from FHIR (Observation + DiagnosticReport per HL7 FHIR spec)
        fhir_note = ""
        if patient_id and GATEWAY_FHIR_URL:
            try:
                async with httpx.AsyncClient() as client:
                    base = GATEWAY_FHIR_URL.rstrip("/")
                    r_obs = await client.get(f"{base}/Observation", params={"patient": patient_id}, timeout=10.0)
                    r_report = await client.get(f"{base}/DiagnosticReport", params={"patient": patient_id}, timeout=10.0)
                    if r_obs.status_code == 200 or r_report.status_code == 200:
                        fhir_note = " [Your record may have recent lab data.]"
            except Exception:
                pass

        if not LAB_API_URL:
            return AgentResult(
                content=discourse_t("could_not_process", locale)
                + fhir_note
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
            )

        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{LAB_API_URL.rstrip('/')}/query",
                    json={"query": user_message, "patient_id": patient_id},
                    timeout=15.0,
                )
                if r.status_code == 200:
                    data = r.json()
                    reply = data.get("reply", data.get("message", data.get("summary", "")))
                    if reply:
                        return AgentResult(
                            content=reply + fhir_note + get_standard_disclaimer(),
                            agent_id=self.agent_id,
                            sources=["Lab API"],
                        )
        except Exception:
            pass

        return AgentResult(
            content=discourse_t("something_went_wrong", locale)
            + fhir_note
            + get_standard_disclaimer(),
            agent_id=self.agent_id,
        )
