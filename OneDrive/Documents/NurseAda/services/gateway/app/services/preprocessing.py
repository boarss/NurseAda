from __future__ import annotations

import re


_EMAIL_RE = re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b")
_PHONE_RE = re.compile(r"\b(?:\+?234|0)\d{10}\b|\b\d{10,15}\b")


def mask_pii(text: str) -> tuple[str, bool]:
    """
    Minimal PII masking scaffold.

    This is intentionally conservative and will be replaced with a dedicated
    PII/PHI solution (e.g. Presidio) in hardening work.
    """
    found = False

    def _sub_email(m: re.Match[str]) -> str:
        nonlocal found
        found = True
        return "[REDACTED_EMAIL]"

    def _sub_phone(m: re.Match[str]) -> str:
        nonlocal found
        found = True
        return "[REDACTED_PHONE]"

    masked = _EMAIL_RE.sub(_sub_email, text)
    masked = _PHONE_RE.sub(_sub_phone, masked)
    return masked, found


def normalize_text(text: str) -> str:
    return " ".join(text.strip().split())

