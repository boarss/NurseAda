from __future__ import annotations

import json
from pathlib import Path
import re
from typing import TypedDict


class RedFlagHit(TypedDict):
    id: str
    label: str
    tier: str


_CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "red_flags.json"
_RAW_FLAGS = json.loads(_CATALOG_PATH.read_text(encoding="utf-8"))

_COMPILED_FLAGS: list[tuple[str, str, str, list[re.Pattern[str]]]] = []
for item in _RAW_FLAGS:
    patterns = [re.compile(pattern, re.I) for pattern in item.get("patterns", [])]
    _COMPILED_FLAGS.append((item["id"], item["label"], item["tier"], patterns))


def match_red_flags(text: str) -> list[RedFlagHit]:
    lowered = (text or "").strip().lower()
    if not lowered:
        return []

    hits: list[RedFlagHit] = []
    for flag_id, label, tier, patterns in _COMPILED_FLAGS:
        if any(pattern.search(lowered) for pattern in patterns):
            hits.append({"id": flag_id, "label": label, "tier": tier})
    return hits


def should_route_emergency(text: str) -> bool:
    return any(hit.get("tier") == "emergency" for hit in match_red_flags(text))
