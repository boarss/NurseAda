"""
Lab agent: lab orders and results (FHIR DiagnosticReport/Observation + lab API).
"""
import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import LAB_API_URL
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
        locale = context.get("locale", "en")
        # Independence policy: lab guidance is based on the user's message and NurseAda knowledge.
        # Do not fetch or reference external EHR/FHIR data.

        if not LAB_API_URL:
            return AgentResult(
                content=discourse_t("could_not_process", locale)
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
            )

        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{LAB_API_URL.rstrip('/')}/query",
                    json={"query": user_message},
                    timeout=15.0,
                )
                if r.status_code == 200:
                    data = r.json()
                    reply = data.get("reply", data.get("message", data.get("summary", "")))
                    if reply:
                        return AgentResult(
                            content=reply + get_standard_disclaimer(),
                            agent_id=self.agent_id,
                            sources=["Lab API"],
                        )
        except Exception:
            pass

        return AgentResult(
            content=discourse_t("something_went_wrong", locale)
            + get_standard_disclaimer(),
            agent_id=self.agent_id,
        )
