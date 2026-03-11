"""Unit tests for CDSS drug interaction logic."""

from app.drug_logic import run_drug_interactions


def test_run_drug_interactions_medium_and_high_severity():
    # Query mentioning aspirin + ibuprofen should yield at least one medium interaction
    result = run_drug_interactions("Can I take aspirin with ibuprofen?")
    severities = {ix["severity"] for ix in result.interactions}
    assert "medium" in severities
    # codes_checked should reflect resolved drug names
    names = {c["name"] for c in result.codes_checked}
    assert "aspirin" in names or "ibuprofen" in names

    # Query mentioning aspirin + warfarin should yield a high-severity interaction
    result2 = run_drug_interactions("aspirin and warfarin together")
    severities2 = {ix["severity"] for ix in result2.interactions}
    assert "high" in severities2


def test_run_drug_interactions_same_drug_low_severity():
    # Paracetamol + acetaminophen is essentially double-dosing of the same drug
    result = run_drug_interactions("paracetamol with acetaminophen")
    assert result.interactions
    assert any(ix["severity"] == "low" for ix in result.interactions)


def test_run_drug_interactions_no_known_drugs_still_tracks_codes_checked():
    # When no known drugs are detected, codes_checked should still contain a free-text entry
    result = run_drug_interactions("herbal tea and water only")
    assert result.codes_checked
    assert any(c.get("system") == "free_text" for c in result.codes_checked)

