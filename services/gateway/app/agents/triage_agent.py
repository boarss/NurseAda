"""
Triage agent: symptom assessment and differential diagnosis via CDSS (and FHIR/EHR context).
Uses fallback triage when CDSS is not configured. Enriches with herbal/natural remedy options.
"""
import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_CDSS_URL, GATEWAY_FHIR_URL, GATEWAY_KNOWLEDGE_URL
from app.services.verification import get_standard_disclaimer
from app.services.fallback_triage import run_fallback_triage
from app.services.discourse import format_triage_response, HERBAL_HEADER


async def _append_herbal_if_available(
    content: str, query: str, base_sources: list[str], severity: str = "low"
) -> tuple[str, list[str]]:
    """Append herbal/natural remedy options for non-emergency triage when knowledge is configured."""
    if severity in ("emergency", "high") or not GATEWAY_KNOWLEDGE_URL:
        return content, base_sources
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{GATEWAY_KNOWLEDGE_URL.rstrip('/')}/retrieve/herbal",
                json={"query": query, "top_k": 2},
                timeout=6.0,
            )
            if r.status_code != 200:
                return content, base_sources
            data = r.json()
            chunks = data.get("chunks", [])
            if not chunks:
                return content, base_sources
            lines = [content, f"\n{HERBAL_HEADER}"]
            for c in chunks:
                t = c.get("text", "")
                if t:
                    lines.append(f"• {t}")
            return "\n".join(lines), base_sources + ["Knowledge – Herbal"]
    except Exception:
        return content, base_sources


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
        # Call CDSS triage, or use fallback when CDSS not configured
        if not GATEWAY_CDSS_URL:
            result = run_fallback_triage(user_message)
            content = format_triage_response(
                severity=result.severity,
                confidence=result.confidence,
                reasoning=result.reasoning,
                suggestions=result.suggestions,
                inferred_codes=result.inferred_codes,
            )
            content, sources = await _append_herbal_if_available(content, user_message, ["Fallback triage"], result.severity)
            return AgentResult(
                content=content + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=sources,
                metadata={"severity": result.severity, "suggestions": result.suggestions},
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
                        content="I wasn't able to complete the assessment right now. Please try again, or seek in-person care if needed."
                        + get_standard_disclaimer(),
                        agent_id=self.agent_id,
                    )
                data = r.json()
                severity = data.get("severity", "unknown")
                suggestions = data.get("suggestions", [])
                confidence = data.get("confidence")
                reasoning = data.get("reasoning", "")
                inferred_codes = data.get("inferred_codes", [])
                content = format_triage_response(
                    severity=severity,
                    confidence=confidence,
                    reasoning=reasoning,
                    suggestions=suggestions,
                    inferred_codes=inferred_codes,
                    observations_note=observations_note.strip(),
                )
                content, sources = await _append_herbal_if_available(content, user_message, ["CDSS"], severity)
                return AgentResult(
                    content=content + get_standard_disclaimer(),
                    agent_id=self.agent_id,
                    sources=sources,
                    metadata=data,
                )
        except Exception as e:
            return AgentResult(
                content="The symptom check is temporarily unavailable. For urgent concerns, please seek care in person or call emergency services."
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
            )
