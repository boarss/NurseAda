"""
Triage agent: symptom assessment and differential diagnosis via CDSS (and FHIR/EHR context).
Uses fallback triage when CDSS is not configured. Enriches with herbal/natural remedy options.
"""
import httpx
from app.agents.base import BaseAgent, AgentResult
from app.clinical import extract_symptoms, generate_response
from app.config import GATEWAY_CDSS_URL, GATEWAY_KNOWLEDGE_URL
from app.services.verification import get_standard_disclaimer
from app.services.fallback_triage import run_fallback_triage
from app.services.discourse import format_triage_response, format_appointment_followup, t as discourse_t


async def _append_herbal_if_available(
    content: str,
    query: str,
    base_sources: list[str],
    severity: str = "low",
    context: dict | None = None,
) -> tuple[str, list[str]]:
    """Append herbal/natural remedy options for non-emergency triage when knowledge is configured."""
    if severity in ("emergency", "high") or not GATEWAY_KNOWLEDGE_URL:
        return content, base_sources

    locale = (context or {}).get("locale", "en")
    retrieve_context: dict | None = None
    medications = (context or {}).get("medications")
    if medications:
        retrieve_context = {"medications": medications}

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{GATEWAY_KNOWLEDGE_URL.rstrip('/')}/retrieve/herbal",
                json={"query": query, "top_k": 2, "context": retrieve_context},
                timeout=6.0,
            )
            if r.status_code != 200:
                return content, base_sources
            data = r.json()
            chunks = data.get("chunks", [])
            if not chunks:
                return content, base_sources
            herbal_header = discourse_t("herbal_header", locale)
            lines = [content, f"\n{herbal_header}"]
            for c in chunks:
                txt = c.get("text", "")
                if txt:
                    lines.append(f"• {txt}")
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
        locale = context.get("locale", "en")

        # Independence policy: do not pass external identifiers to downstream services.
        # (Even if `patient_id` exists in context, triage is based on NurseAda knowledge and user message.)
        sanitized_context = {**context}
        sanitized_context.pop("patient_id", None)
        extracted_symptoms = await extract_symptoms(user_message, sanitized_context)
        pipeline_context = {**sanitized_context, "extracted_symptoms": extracted_symptoms}

        if not GATEWAY_CDSS_URL:
            result = run_fallback_triage(user_message)
            content = format_triage_response(
                severity=result.severity,
                confidence=result.confidence,
                reasoning=result.reasoning,
                suggestions=result.suggestions,
                inferred_codes=result.inferred_codes,
                locale=locale,
            )
            artifact = {
                "severity": result.severity,
                "confidence": result.confidence,
                "reasoning": result.reasoning,
                "suggestions": result.suggestions,
                "inferred_codes": result.inferred_codes,
                "red_flags": result.red_flags or [],
            }
            content = await generate_response(artifact, locale=locale)
            content, sources = await _append_herbal_if_available(
                content,
                user_message,
                ["Fallback triage"],
                result.severity,
                pipeline_context,
            )
            if result.severity not in ("emergency",):
                content += format_appointment_followup(result.severity, locale)
            return AgentResult(
                content=content + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=sources,
                metadata={
                    "severity": result.severity,
                    "suggestions": result.suggestions,
                    "clinical_trace": {
                        "extracted_symptoms": extracted_symptoms,
                        "diagnosis": {
                            "severity": result.severity,
                            "reasoning": result.reasoning,
                            "inferred_codes": result.inferred_codes,
                            "confidence": result.confidence,
                            "red_flags": result.red_flags or [],
                            "shap": None,
                        },
                        "recommendations": result.suggestions,
                        "red_flags": result.red_flags or [],
                    },
                },
            )

        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{GATEWAY_CDSS_URL.rstrip('/')}/triage",
                    json={"query": user_message, "context": pipeline_context},
                    timeout=15.0,
                )
                if r.status_code != 200:
                    return AgentResult(
                        content=discourse_t("could_not_process", locale)
                        + get_standard_disclaimer(),
                        agent_id=self.agent_id,
                    )
                data = r.json()
                severity = data.get("severity", "unknown")
                suggestions = data.get("suggestions", [])
                confidence = data.get("confidence")
                reasoning = data.get("reasoning", "")
                inferred_codes = data.get("inferred_codes", [])
                red_flags = data.get("red_flags", [])
                shap_payload = data.get("shap")
                artifact = {
                    "severity": severity,
                    "confidence": confidence,
                    "reasoning": reasoning,
                    "suggestions": suggestions,
                    "inferred_codes": inferred_codes,
                    "red_flags": red_flags,
                }
                content = await generate_response(artifact, locale=locale)
                content, sources = await _append_herbal_if_available(
                    content,
                    user_message,
                    ["CDSS"],
                    severity,
                    pipeline_context,
                )
                if severity not in ("emergency",):
                    content += format_appointment_followup(severity, locale)
                return AgentResult(
                    content=content + get_standard_disclaimer(),
                    agent_id=self.agent_id,
                    sources=sources,
                    metadata={
                        **data,
                        "clinical_trace": {
                            "extracted_symptoms": extracted_symptoms,
                            "diagnosis": {
                                "severity": severity,
                                "reasoning": reasoning,
                                "inferred_codes": inferred_codes,
                                "confidence": confidence,
                                "red_flags": red_flags,
                                "shap": shap_payload,
                            },
                            "recommendations": suggestions,
                            "red_flags": red_flags,
                        },
                    },
                )
        except Exception as e:
            return AgentResult(
                content=discourse_t("something_went_wrong", locale)
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
            )
