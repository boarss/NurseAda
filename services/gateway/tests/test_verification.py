"""
Tests for the verification layer. Ensures agents are only called after input verification
and only verified output is returned.
"""
import pytest
from app.services.verification import (
    verify_agent_input,
    verify_agent_output,
    get_standard_disclaimer,
    VerificationResult,
)


def test_verify_agent_input_empty():
    r = verify_agent_input("", "triage")
    assert r.ok is False
    assert "empty" in r.reason.lower() or "invalid" in r.reason.lower()


def test_verify_agent_input_valid():
    r = verify_agent_input("I have a headache and fever", "triage")
    assert r.ok is True


def test_verify_agent_input_too_long():
    r = verify_agent_input("x" * 5000, "general")
    assert r.ok is False
    assert "length" in r.reason.lower()


def test_verify_agent_input_rejects_script():
    r = verify_agent_input("Hello <script>alert(1)</script>", "general")
    assert r.ok is False


def test_verify_agent_output_empty():
    r = verify_agent_output("", "triage")
    assert r.ok is False


def test_verify_agent_output_valid_with_disclaimer():
    text = "Rest and fluids. This is not a substitute for professional advice."
    r = verify_agent_output(text, "triage", require_clinical_disclaimer=True)
    assert r.ok is True


def test_verify_agent_output_too_long():
    r = verify_agent_output("x" * 10000, "general")
    assert r.ok is False


def test_get_standard_disclaimer():
    d = get_standard_disclaimer()
    assert "not a substitute" in d
    assert "consult" in d or "emergency" in d
