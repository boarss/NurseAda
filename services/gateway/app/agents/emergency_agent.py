"""
Emergency agent: escalation to emergency services (FHIR Task / emergency API / hotline).
"""
import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import EMERGENCY_API_URL, GATEWAY_FHIR_URL
from app.services.verification import get_standard_disclaimer
from app.services.discourse import t as discourse_t

DEFAULT_EMERGENCY_MESSAGE = (
    "**Seek emergency care now.** "
    "Nigeria: Emergency line 112; Lagos State Emergency 767. "
    "Go to the nearest hospital or call an ambulance."
)


class EmergencyAgent(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "emergency"

    @property
    def description(self) -> str:
        return "Emergency escalation and hotline"

    async def execute(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> AgentResult:
        context = context or {}
        patient_id = context.get("patient_id")
        locale = context.get("locale", "en")

        # Optionally create FHIR Task or alert (if FHIR server supports it)
        if patient_id and GATEWAY_FHIR_URL:
            try:
                async with httpx.AsyncClient() as client:
                    r = await client.post(
                        f"{GATEWAY_FHIR_URL.rstrip('/')}/Task",
                        json={
                            "resourceType": "Task",
                            "status": "requested",
                            "intent": "order",
                            "description": "Emergency escalation from NurseAda",
                        },
                        timeout=5.0,
                    )
                    if r.status_code in (200, 201):
                        pass  # Log for audit
            except Exception:
                pass

        if EMERGENCY_API_URL:
            try:
                async with httpx.AsyncClient() as client:
                    r = await client.post(
                        f"{EMERGENCY_API_URL.rstrip('/')}/escalate",
                        json={
                            "reason": user_message,
                            "patient_id": patient_id,
                            "source": "nurseada",
                        },
                        timeout=10.0,
                    )
                    if r.status_code == 200:
                        data = r.json()
                        reply = data.get("message", data.get("reply", DEFAULT_EMERGENCY_MESSAGE))
                        return AgentResult(
                            content=reply + get_standard_disclaimer(),
                            agent_id=self.agent_id,
                            sources=["Emergency API"],
                        )
            except Exception:
                pass

        msg = discourse_t("emergency_ack", locale) + " " + DEFAULT_EMERGENCY_MESSAGE
        return AgentResult(
            content=msg + get_standard_disclaimer(),
            agent_id=self.agent_id,
            sources=[],
        )
