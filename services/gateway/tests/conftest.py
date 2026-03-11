"""
Pytest configuration for the gateway service tests.

Ensures the `app` package (FastAPI gateway) is importable when pytest sets
the project root to the monorepo root instead of `services/gateway`.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add the gateway service directory (which contains the `app` package)
# to sys.path so imports like `from app.agents...` work reliably.
GATEWAY_ROOT = Path(__file__).resolve().parents[1]
if str(GATEWAY_ROOT) not in sys.path:
    sys.path.insert(0, str(GATEWAY_ROOT))

