"""Tests for CDSS triage logic."""
import pytest
from app.triage_logic import run_triage, TriageResult


def test_triage_emergency():
    r = run_triage("I have chest pain")
    assert r.severity == "emergency"
    assert r.suggestions
    assert "emergency" in r.suggestions[0].lower() or "112" in r.suggestions[0]
    assert r.confidence >= 0.9


def test_triage_fever():
    r = run_triage("I have a fever")
    assert r.severity in ("medium", "high")
    assert r.suggestions
    assert r.inferred_codes
    assert r.reasoning


def test_triage_empty():
    r = run_triage("")
    assert r.severity == "low"
    assert r.confidence == 0.0


def test_triage_headache():
    r = run_triage("severe headache")
    assert r.severity in ("high", "medium")
    assert any("headache" in s.lower() or "provider" in s.lower() for s in r.suggestions)
