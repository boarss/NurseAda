from __future__ import annotations

from app.config import settings
from app.providers.mock import MockProvider
from app.providers.openai_compat import OpenAICompatProvider


def get_provider():
    provider = settings.llm_provider.lower().strip()
    if provider in ("mock", "local_mock"):
        return MockProvider()
    if provider in ("openai_compat", "openai-compatible", "openai_compatible"):
        return OpenAICompatProvider()

    # Scaffolding: return mock rather than failing hard.
    return MockProvider()

