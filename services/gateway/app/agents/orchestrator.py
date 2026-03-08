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
from app.services.verification import (
    verify_agent_input,
    verify_agent_output,
    get_standard_disclaimer,
)
from app.services.code_checker import check_codes_before_agent

# Keyword patterns for intent (run in order; first match wins for primary agent)
EMERGENCY_PATTERNS = re.compile(
    r"\b(chest pain|can't breathe|unconscious|stroke|severe bleed|overdose|suicide|emergency|urgent|911|112)\b",
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
    r"\b(symptom|pain|fever|cough|headache|feel sick|diagnosis|what's wrong|triage)\b",
    re.I,
)

AGENTS: dict[str, BaseAgent] = {
    "emergency": EmergencyAgent(),
    "triage": TriageAgent(),
    "medication": MedicationAgent(),
    "lab": LabAgent(),
    "general": GeneralAgent(),
}


def _detect_intent(user_message: str) -> str:
    """Determine which agent should handle this message. Returns agent_id."""
    text = (user_message or "").strip().lower()
    if EMERGENCY_PATTERNS.search(text):
        return "emergency"
    if MEDICATION_PATTERNS.search(text):
        return "medication"
    if LAB_PATTERNS.search(text):
        return "lab"
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

        # 1) Input verification (must pass before any agent is called)
        intent = _detect_intent(user_message)
        agent = self.agents.get(intent) or self.agents["general"]
        input_verification = verify_agent_input(user_message, agent.agent_id)
        if not input_verification.ok:
            return (
                "I couldn't process that request. Please rephrase or shorten your message. "
                "For emergencies, please call 112 or go to the nearest hospital."
            )

        # 2) Code check: for triage and medication, verify codes before calling the agent
        code_check = await check_codes_before_agent(agent.agent_id, user_message, context)
        if not code_check.ok:
            return (
                code_check.reason.strip()
                or "I couldn't match your message to our clinical codes. Please rephrase (e.g. specific symptoms or medication names) so I can give you a proper recommendation."
            ) + get_standard_disclaimer()
        if code_check.resolved_codes:
            context = {**context, "resolved_codes": code_check.resolved_codes}

        # 3) Execute agent
        try:
            result = await agent.execute(user_message, context=context)
        except Exception as e:
            return (
                "Something went wrong on our side. Please try again. "
                "For urgent health issues, seek care in person or call emergency services."
                + get_standard_disclaimer()
            )

        # 4) Output verification (must pass before showing to user)
        content = (result.content or "").strip()
        output_verification = verify_agent_output(
            content,
            agent.agent_id,
            require_clinical_disclaimer=True,
        )
        if not output_verification.ok:
            # Fallback: return safe message instead of unverified content
            return (
                "I'm sorry, I couldn't provide a verified response for that. "
                "Please consult a healthcare provider or try rephrasing."
                + get_standard_disclaimer()
            )

        # 5) Ensure disclaimer for clinical agents
        if agent.agent_id in ("triage", "medication", "lab", "emergency"):
            if not any(
                sub in content.lower()
                for sub in ("not a substitute", "consult", "emergency", "seek")
            ):
                content = content + get_standard_disclaimer()

        return content[:8000]  # Hard cap for display
