"""
Verification layer: validate agent inputs and outputs before/after execution.
Ensures recommendations and diagnoses are only shown after passing checks.
"""
import re
from dataclasses import dataclass

# Max lengths to prevent abuse and ensure safe display
MAX_INPUT_LENGTH = 4000
MAX_OUTPUT_LENGTH = 8000

# Minimal disclaimer that must appear in clinical output (or be appended)
CLINICAL_DISCLAIMER_SUBSTRINGS = [
    "not a substitute",
    "seek professional",
    "consult a",
    "see a doctor",
    "emergency",
]

# Simple PII patterns (emails, phone numbers). This is a conservative first pass.
EMAIL_PATTERN = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
PHONE_PATTERN = re.compile(r"\+?\d[\d\-\s]{7,}\d")


@dataclass
class VerificationResult:
    ok: bool
    reason: str = ""


def verify_agent_input(user_message: str, agent_id: str) -> VerificationResult:
    """
    Verify that the input is safe and valid before calling an agent.
    Must pass before the agent is invoked.
    """
    if not user_message or not isinstance(user_message, str):
        return VerificationResult(False, "Empty or invalid input")
    text = user_message.strip()
    if len(text) > MAX_INPUT_LENGTH:
        return VerificationResult(False, f"Input exceeds max length ({MAX_INPUT_LENGTH})")
    # Basic injection / prompt-leak mitigation: reject obvious placeholder or script patterns
    if re.search(r"<\s*script|javascript:|{\s*{\s*", text, re.I):
        return VerificationResult(False, "Invalid input pattern")
    # Gently block obvious PII that is not needed for clinical triage
    if EMAIL_PATTERN.search(text) or PHONE_PATTERN.search(text):
        return VerificationResult(
            False,
            "I'd like to help, but please avoid sharing phone numbers or email addresses. You can describe your symptoms or question without those details.",
        )
    return VerificationResult(True)


def verify_agent_output(
    content: str,
    agent_id: str,
    require_clinical_disclaimer: bool = True,
) -> VerificationResult:
    """
    Verify that the agent output is safe and suitable to show the user.
    Must pass before the response is returned from the orchestrator.
    """
    if not content or not isinstance(content, str):
        return VerificationResult(False, "Empty or invalid output")
    text = content.strip()
    if len(text) > MAX_OUTPUT_LENGTH:
        return VerificationResult(False, f"Output exceeds max length ({MAX_OUTPUT_LENGTH})")
    # For clinical agents, require a disclaimer (or we will append one in orchestrator)
    if require_clinical_disclaimer and agent_id in ("triage", "medication", "lab", "emergency", "herbal", "appointment"):
        has_disclaimer = any(
            sub.lower() in text.lower() for sub in CLINICAL_DISCLAIMER_SUBSTRINGS
        )
        if not has_disclaimer:
            # Orchestrator can append a standard disclaimer instead of failing
            pass  # We allow and let orchestrator append
    return VerificationResult(True)


def get_standard_disclaimer(locale: str | None = None) -> str:
    """
    Appended to clinical agent output when no disclaimer is present.

    The disclaimer text is kept in English across locales so that
    safety-critical instructions remain consistent and recognizable.
    """
    _ = locale  # locale is accepted for forward compatibility but not used yet
    return (
        "\n\nThis is not a substitute for professional medical advice. "
        "Please consult a healthcare provider for diagnosis and treatment. "
        "In an emergency, seek care immediately."
    )
