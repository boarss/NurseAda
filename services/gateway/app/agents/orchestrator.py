"""
Agent orchestrator: route user intent to the right agent(s), run verification before/after execution.
Agents are only called after input verification; their output is verified before being returned.
"""
import re
from app.agents.base import BaseAgent, AgentResult
from app.agents.triage_agent import TriageAgent
from app.agents.medication_agent import MedicationAgent
from app.agents.lab_agent import LabAgent
from app.agents.emergency_agent import EmergencyAgent
from app.agents.general_agent import GeneralAgent
from app.agents.explain_agent import ExplainAgent
from app.agents.imaging_agent import ImagingAgent
from app.agents.herbal_agent import HerbalAgent
from app.agents.appointment_agent import AppointmentAgent
from app.services.verification import (
    verify_agent_input,
    verify_agent_output,
    get_standard_disclaimer,
)
from app.services.discourse import COULD_NOT_PROCESS, COULD_NOT_MATCH, SOMETHING_WENT_WRONG, t as discourse_t
from app.services.code_checker import check_codes_before_agent
from app.services.rlhf import rlhf_store

# Keyword patterns for intent (run in order; first match wins for primary agent)
EMERGENCY_PATTERNS = re.compile(
    r"\b(dka|diabetic ketoacidosis|ketoacidosis|fruity breath|kussmaul|high ketones?|large ketones?|chest pain|can't breathe|unconscious|stroke|severe bleed|overdose|suicide|emergency|urgent|911|112)\b",
    re.I,
)
MEDICATION_PATTERNS = re.compile(
    r"\b(medication|medicine|drug|pill|dosage|interaction|pharmacy|prescription)\b",
    re.I,
)
LAB_PATTERNS = re.compile(
    r"\b(lab|test result|blood test|urine|diagnostic|specimen)\b",
    re.I,
)
TRIAGE_PATTERNS = re.compile(
    r"\b(symptom|pain|fever|cough|headache|feel sick|diagnosis|what's wrong|triage|unwell|don't feel well|feel bad|help me|nausea|vomit|dizzy|tired|rash|swell|stomach|throat|ache|hurt|bleed|breath|ketone|ketones|dka|diabetes|blood sugar)\b",
    re.I,
)
EXPLAIN_PATTERNS = re.compile(
    r"\b(why|explain|how did you decide|show reasoning|what caused that|interpretability|xai)\b",
    re.I,
)
IMAGING_PATTERNS = re.compile(
    r"\b(xray|x-ray|ct scan|mri|radiology|imaging|scan|analyze.*image|image.*analysis)\b",
    re.I,
)
APPOINTMENT_PATTERNS = re.compile(
    r"\b(appointment|book.{0,10}(doctor|clinic|hospital|visit)"
    r"|schedule.{0,10}(visit|appointment|doctor)"
    r"|find.{0,10}(clinic|hospital|doctor|provider)"
    r"|nearest.{0,6}(clinic|hospital)"
    r"|nearby.{0,6}(clinic|hospital)"
    r"|see a doctor|referral|telemedicine"
    r"|clinic|hospital visit)\b",
    re.I,
)
HERBAL_PATTERNS = re.compile(
    r"\b(herbal|natural remed|traditional remed|bitter leaf|moringa|turmeric|herb\b"
    r"|neem|dogonyaro|garlic remed|hibiscus|zobo|guava leaf|scent leaf|efirin|nchanwu"
    r"|pawpaw leaf|papaya leaf|clove remed|kanafuru|aloe vera|lemongrass|shea butter"
    r"|eucalyptus|coconut oil|utazi|soursop|home remed|complementary"
    r"|ewuro|onugbu|kooko oba|ori\b|ata ile|ewe ile|zogale|sawansop"
    r"|ibepe|gwanda|adi agbon|gongronema|remed(?:y|ies))\b",
    re.I,
)

AGENTS: dict[str, BaseAgent] = {
    "emergency": EmergencyAgent(),
    "explain": ExplainAgent(),
    "triage": TriageAgent(),
    "medication": MedicationAgent(),
    "lab": LabAgent(),
    "imaging": ImagingAgent(),
    "appointment": AppointmentAgent(),
    "herbal": HerbalAgent(),
    "general": GeneralAgent(),
}


def _detect_intent(user_message: str, context: dict | None = None) -> str:
    """Determine which agent should handle this message. Returns agent_id."""
    text = (user_message or "").strip().lower()
    has_image = bool((context or {}).get("image_base64"))
    if EMERGENCY_PATTERNS.search(text):
        return "emergency"
    if EXPLAIN_PATTERNS.search(text):
        return "explain"
    if MEDICATION_PATTERNS.search(text):
        return "medication"
    if LAB_PATTERNS.search(text):
        return "lab"
    if IMAGING_PATTERNS.search(text) or has_image:
        return "imaging"
    if APPOINTMENT_PATTERNS.search(text):
        return "appointment"
    if HERBAL_PATTERNS.search(text):
        return "herbal"
    if TRIAGE_PATTERNS.search(text):
        return "triage"
    return "general"


class AgentOrchestrator:
    """
    Orchestrates agent execution with verification.
    No agent is called until input is verified; output is verified before return.
    """

    def __init__(self, agents: dict[str, BaseAgent] | None = None):
        self.agents = agents or AGENTS

    async def run(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> str:
        """
        Route to the appropriate agent, verify input, execute, verify output, then return reply.
        """
        context = context or {}
        locale = context.get("locale", "en")

        # 1) Input verification (must pass before any agent is called)
        intent = _detect_intent(user_message, context)
        agent = self.agents.get(intent) or self.agents["general"]
        input_verification = verify_agent_input(user_message, agent.agent_id)
        if not input_verification.ok:
            return discourse_t("could_not_process", locale) + get_standard_disclaimer()

        # 2) Code check: for triage and medication, verify codes before calling the agent
        code_check = await check_codes_before_agent(agent.agent_id, user_message, context)
        if not code_check.ok:
            return (
                code_check.reason.strip() or discourse_t("could_not_match", locale)
            ) + get_standard_disclaimer()
        if code_check.resolved_codes:
            context = {**context, "resolved_codes": code_check.resolved_codes}

        # 3) Execute agent
        try:
            result = await agent.execute(user_message, context=context)
        except Exception:
            return discourse_t("something_went_wrong", locale) + get_standard_disclaimer()

        # 4) Output verification (must pass before showing to user)
        content = (result.content or "").strip()
        output_verification = verify_agent_output(
            content,
            agent.agent_id,
            require_clinical_disclaimer=True,
        )
        if not output_verification.ok:
            return (
                "I wasn't able to provide a verified response for that. "
                "Please consult a healthcare provider or try rephrasing your question."
                + get_standard_disclaimer()
            )

        # 5) Ensure disclaimer for clinical agents
        if agent.agent_id in ("triage", "medication", "lab", "emergency", "explain", "imaging", "herbal", "appointment"):
            if not any(
                sub in content.lower()
                for sub in ("not a substitute", "consult", "emergency", "seek")
            ):
                content = content + get_standard_disclaimer()

        # 6) RLHF interaction hook (anonymized metadata only)
        try:
            rlhf_store.record_interaction(
                conversation_id=context.get("conversation_id"),
                agent_id=agent.agent_id,
                severity=None,
                metadata={
                    "intent": intent,
                    "has_patient_id": bool(context.get("patient_id")),
                    "has_image": bool(context.get("image_base64")),
                    "has_user": bool(context.get("user_id")),
                },
            )
        except Exception:
            pass

        return content[:8000]  # Hard cap for display
