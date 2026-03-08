"""Tests for CDSS code check (must pass before triage/medication agents are called)."""
import pytest
from app.code_check import check_codes, check_codes_triage, check_codes_medication, CodeCheckResult


def test_check_codes_triage_pass():
    r = check_codes_triage("I have a headache and fever")
    assert r.ok is True
    assert r.agent_id == "triage"
    assert r.resolved_codes


def test_check_codes_triage_fail_empty():
    r = check_codes_triage("")
    assert r.ok is False
    assert "symptom" in r.reason.lower() or "describe" in r.reason.lower()


def test_check_codes_triage_fail_unmatched():
    r = check_codes_triage("what is the weather today")
    assert r.ok is False
    assert "couldn't match" in r.reason.lower() or "symptom" in r.reason.lower()


def test_check_codes_medication_pass():
    r = check_codes_medication("Can I take aspirin with ibuprofen?")
    assert r.ok is True
    assert r.agent_id == "medication"


def test_check_codes_medication_fail():
    r = check_codes_medication("hello")
    assert r.ok is False


def test_check_codes_general_allowed():
    r = check_codes("general", "any text", {})
    assert r.ok is True
