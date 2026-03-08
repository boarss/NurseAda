"""
General agent: LLM + knowledge base for non-specialized health questions.
"""
import httpx
from app.agents.base import BaseAgent, AgentResult
from app.config import GATEWAY_LLM_URL, GATEWAY_KNOWLEDGE_URL


def get_standard_disclaimer() -> str:
    return "\n\nThis is general information only, not medical advice. Consult a healthcare provider for your situation. In an emergency, seek care immediately."


class GeneralAgent(BaseAgent):
    @property
    def agent_id(self) -> str:
        return "general"

    @property
    def description(self) -> str:
        return "General health information and education"

    async def execute(
        self,
        user_message: str,
        context: dict | None = None,
    ) -> AgentResult:
        context = context or {}
        history = context.get("conversation_history", [])

        # Optional: RAG from knowledge base
        extra_context = ""
        if GATEWAY_KNOWLEDGE_URL:
            try:
                async with httpx.AsyncClient() as client:
                    r = await client.post(
                        f"{GATEWAY_KNOWLEDGE_URL.rstrip('/')}/retrieve",
                        json={"query": user_message, "top_k": 3},
                        timeout=8.0,
                    )
                    if r.status_code == 200:
                        data = r.json()
                        chunks = data.get("chunks", [])
                        if chunks:
                            extra_context = "\n".join(
                                c.get("text", c) if isinstance(c, dict) else str(c)
                                for c in chunks[:3]
                            )
            except Exception:
                pass

        if not GATEWAY_LLM_URL:
            return AgentResult(
                content="I'm not connected to the language model right now. Please try again later or contact support."
                + get_standard_disclaimer(),
                agent_id=self.agent_id,
            )

        messages = [{"role": m.get("role", "user"), "content": m.get("content", m.get("text", ""))} for m in history]
        messages.append({"role": "user", "content": user_message})
        if extra_context:
            messages[-1]["content"] = f"Context from knowledge base:\n{extra_context}\n\nUser question: {user_message}"

        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{GATEWAY_LLM_URL.rstrip('/')}/v1/complete",
                    json={"messages": messages, "max_tokens": 1024},
                    timeout=30.0,
                )
                if r.status_code == 200:
                    data = r.json()
                    content = data.get("content", "").strip()
                    if content:
                        return AgentResult(
                            content=content + get_standard_disclaimer(),
                            agent_id=self.agent_id,
                            sources=["LLM", "Knowledge"] if extra_context else ["LLM"],
                        )
        except Exception as e:
            pass

        return AgentResult(
            content="I couldn't generate a response right now. Please try again or rephrase your question."
            + get_standard_disclaimer(),
            agent_id=self.agent_id,
        )
