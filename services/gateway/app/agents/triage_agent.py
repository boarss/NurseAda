"""
Triage agent: symptom assessment and differential diagnosis via CDSS (and FHIR/EHR context).
"""
import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_CDSS_URL, GATEWAY_FHIR_URL
from app.services.verification import get_standard_disclaimer


class TriageAgent(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "triage"

    @property
    def description(self) -> str:
        return "Symptom check, severity, and care recommendations"

    async def execute(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> AgentResult:
        context = context or {}
        patient_id = context.get("patient_id")
        # Optional: pull FHIR observations for context
        observations_note = ""
        if patient_id and GATEWAY_FHIR_URL:
            try:
                async with httpx.AsyncClient() as client:
                    r = await client.get(
                        f"{GATEWAY_FHIR_URL.rstrip('/')}/Observation",
                        params={"patient": patient_id},
                        timeout=10.0,
                    )
                    if r.status_code == 200:
                        observations_note = " [EHR context available]"
            except Exception:
                pass
        # Call CDSS triage
        if not GATEWAY_CDSS_URL:
            return AgentResult(
                content="Symptom triage is not configured. Please describe your symptoms and I'll give general guidance. This is not a substitute for professional medical advice; consult a healthcare provider."
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=[],
            )

        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{GATEWAY_CDSS_URL.rstrip('/')}/triage",
                    json={"query": user_message, "context": context},
                    timeout=15.0,
                )
                if r.status_code != 200:
                    return AgentResult(
                        content="I couldn't complete the triage check right now. Please try again or seek in-person care."
                        + get_standard_disclaimer(),
                        agent_id=self.agent_id,
                    )
                data = r.json()
                severity = data.get("severity", "unknown")
                suggestions = data.get("suggestions", [])
                confidence = data.get("confidence")
                reasoning = data.get("reasoning", "")
                inferred_codes = data.get("inferred_codes", [])
                lines = [f"Based on your description, severity assessment: **{severity}**."]
                if confidence is not None:
                    lines.append(f"Confidence: {int(confidence * 100)}%.")
                if reasoning:
                    lines.append(f"My assessment: {reasoning}")
                if suggestions:
                    lines.append("Recommendations:")
                    for s in suggestions:
                        lines.append(f"• {s}")
                if inferred_codes:
                    lines.append("(Codes used for this assessment: " + ", ".join(c.get("display", c.get("code", "")) for c in inferred_codes[:5]) + ".)")
                lines.append(observations_note.strip() or "")
                content = "\n".join(filter(None, lines)) + get_standard_disclaimer()
                return AgentResult(
                    content=content,
                    agent_id=self.agent_id,
                    sources=["CDSS"],
                    metadata=data,
                )
        except Exception as e:
            return AgentResult(
                content="Symptom check is temporarily unavailable. For urgent concerns, please seek care in person or call emergency services."
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
            )
