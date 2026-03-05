from __future__ import annotations


class MockProvider:
    async def generate(self, *, messages: list[dict[str, str]], trace_id: str | None) -> dict:
        _ = messages
        _ = trace_id
        return {
            "content": (
                "Thanks — I can help.\n\n"
                "To guide you safely, please share:\n"
                "1) your age,\n"
                "2) how long this has been going on,\n"
                "3) any known conditions or medicines,\n"
                "4) whether you have any danger signs (trouble breathing, chest pain, confusion, severe bleeding)."
            ),
            "model": "mock",
        }

