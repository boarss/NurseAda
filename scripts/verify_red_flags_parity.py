from __future__ import annotations

import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
CDSS_PATH = ROOT / "services" / "cdss" / "app" / "data" / "red_flags.json"
GATEWAY_PATH = ROOT / "services" / "gateway" / "app" / "data" / "red_flags.json"


def _load(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    cdss = _load(CDSS_PATH)
    gateway = _load(GATEWAY_PATH)
    if cdss != gateway:
        print("Red-flag catalogs are out of sync:")
        print(f" - {CDSS_PATH}")
        print(f" - {GATEWAY_PATH}")
        return 1
    print("Red-flag catalogs are in sync.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
