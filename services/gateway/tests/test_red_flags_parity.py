"""Ensure gateway and CDSS ship identical red-flag catalogs."""

from pathlib import Path


def test_red_flags_json_matches_cdss():
    gateway_root = Path(__file__).resolve().parents[1]
    services_root = gateway_root.parent
    gateway_json = gateway_root / "app" / "data" / "red_flags.json"
    cdss_json = services_root / "cdss" / "app" / "data" / "red_flags.json"
    assert gateway_json.read_bytes() == cdss_json.read_bytes()
