"""Make `app` importable when pytest rootdir is the monorepo root."""

from __future__ import annotations

import sys
from pathlib import Path

XAI_ROOT = Path(__file__).resolve().parents[1]
if str(XAI_ROOT) not in sys.path:
    sys.path.insert(0, str(XAI_ROOT))
