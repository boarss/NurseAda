"""Make `app` importable when pytest rootdir is the monorepo root."""

from __future__ import annotations

import sys
from pathlib import Path

CDSS_ROOT = Path(__file__).resolve().parents[1]
if str(CDSS_ROOT) not in sys.path:
    sys.path.insert(0, str(CDSS_ROOT))
