"""
Code check: resolve user input to clinical codes before triage or medication agents run.
Ensures the system only makes recommendations when it has validated/resolved codes.
"""
from dataclasses import dataclass
import re

@dataclass
class CodeCheckResult:
    ok: bool
    reason: str
    resolved_codes: list[dict]
    agent_id: str


# Minimum symptom keywords for triage to pass code check (so we're not guessing blindly)
TRIAGE_MIN_TERMS = re.compile(
    r"\b(pain|fever|cough|headache|symptom|sick|hurt|ache|bleed|breath|vomit|dizzy|tired|rash|swell|diarrhea|chest|stomach|throat|nose|unwell|well|feel|nausea|weak|fatigue|ketone|ketones|dka|diabetes|blood sugar)\b",
    re.I,
)

# Minimum medication-related terms for medication agent
MEDICATION_MIN_TERMS = re.compile(
    r"\b(medication|medicine|drug|pill|tablet|capsule|dosage|interaction|aspirin|ibuprofen|paracetamol|acetaminophen|warfarin|metformin)\b",
    re.I,
)


def check_codes_triage(query: str) -> CodeCheckResult:
    """Check that we can resolve triage input to something codeable (symptom-like)."""
    text = (query or "").strip()
    if not text or len(text) < 3:
        return CodeCheckResult(
            ok=False,
            reason="I'd like to help. Could you describe your symptoms in a few words? For example: headache, fever, or cough.",
            resolved_codes=[],
            agent_id="triage",
        )
    if not TRIAGE_MIN_TERMS.search(text):
        return CodeCheckResult(
            ok=False,
            reason="I'd like to give you a proper recommendation. Could you mention specific symptoms—for example, fever, headache, or pain?",
            resolved_codes=[],
            agent_id="triage",
        )
    # Resolve to placeholder codes for transparency
    resolved = [{"system": "symptom", "type": "free_text", "display": text[:100]}]
    return CodeCheckResult(ok=True, reason="", resolved_codes=resolved, agent_id="triage")


def check_codes_medication(query: str) -> CodeCheckResult:
    """Check that we can resolve medication input to something codeable (drug-like)."""
    text = (query or "").strip()
    if not text or len(text) < 2:
        return CodeCheckResult(
            ok=False,
            reason="I'd be happy to help with medication questions. Could you mention the drug name(s) you're asking about?",
            resolved_codes=[],
            agent_id="medication",
        )
    if not MEDICATION_MIN_TERMS.search(text):
        return CodeCheckResult(
            ok=False,
            reason="To help with medication questions, I need the drug names. For example: aspirin, paracetamol. You can also ask about interactions or dosage.",
            resolved_codes=[],
            agent_id="medication",
        )
    resolved = [{"system": "medication", "type": "free_text", "display": text[:100]}]
    return CodeCheckResult(ok=True, reason="", resolved_codes=resolved, agent_id="medication")


def check_codes(agent_id: str, query: str, context: dict | None = None) -> CodeCheckResult:
    """Run code check for the given agent. Must pass before the agent is called."""
    if agent_id == "triage":
        return check_codes_triage(query)
    if agent_id == "medication":
        return check_codes_medication(query)
    # Lab, emergency, general: no code check required (or extend later)
    return CodeCheckResult(ok=True, reason="", resolved_codes=[], agent_id=agent_id)
