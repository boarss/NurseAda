"""
Herbal agent: evidence-based herbal and natural remedy recommendations.
Uses knowledge service /retrieve/herbal. Complementary to conventional care.
"""
import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_KNOWLEDGE_URL
from app.services.verification import get_standard_disclaimer


class HerbalAgent(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "herbal"

    @property
    def description(self) -> str:
        return "Herbal and natural remedy recommendations (complementary to conventional care)"

    async def execute(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> AgentResult:
        if not GATEWAY_KNOWLEDGE_URL:
            return AgentResult(
                content="Herbal recommendations are not configured. For natural remedies, consult a healthcare provider or traditional healer. These are complementary to—not a substitute for—medical care."
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=[],
            )

        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{GATEWAY_KNOWLEDGE_URL.rstrip('/')}/retrieve/herbal",
                    json={"query": user_message, "top_k": 3},
                    timeout=8.0,
                )
                if r.status_code != 200:
                    return AgentResult(
                        content="I couldn't fetch herbal recommendations right now. Please try again or consult a healthcare provider."
                        + get_standard_disclaimer(),
                        agent_id=self.agent_id,
                        sources=[],
                    )
                data = r.json()
                chunks = data.get("chunks", [])
                if not chunks:
                    return AgentResult(
                        content="I'd like to help. Could you describe your symptoms—for example, nausea, cough, or headache? I can then suggest evidence-based complementary options. Please consult a healthcare provider for your situation."
                        + get_standard_disclaimer(),
                        agent_id=self.agent_id,
                        sources=[],
                    )
                lines = ["**Here are some complementary herbal/natural options:**\n"]
                for c in chunks:
                    t = c.get("text", "")
                    if t:
                        lines.append(f"• {t}")
                content = "\n".join(lines) + get_standard_disclaimer()
                return AgentResult(
                    content=content,
                    agent_id=self.agent_id,
                    sources=["Knowledge – Herbal"],
                    metadata={"chunks": chunks},
                )
        except Exception:
            return AgentResult(
                content="Herbal recommendations are temporarily unavailable. For natural remedies, consult a healthcare provider. These complement—not replace—medical care."
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
                sources=[],
            )
