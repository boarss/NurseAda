from __future__ import annotations

from typing import Protocol


class LLMProvider(Protocol):
    async def generate(self, *, messages: list[dict[str, str]], trace_id: str | None) -> dict:
        ...

