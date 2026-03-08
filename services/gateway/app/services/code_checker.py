"""
Code checker: calls CDSS /code-check before clinical agents (triage, medication) are invoked.
Ensures a specific agent checks codes before the main agent is called on.
"""
from dataclasses import dataclass
import httpx

from app.config import GATEWAY_CDSS_URL


@dataclass
class CodeCheckResult:
    ok: bool
    reason: str
    resolved_codes: list[dict]
    agent_id: str


# Agents that require code check before being called
AGENTS_REQUIRING_CODE_CHECK = frozenset({"triage", "medication"})


async def check_codes_before_agent(
    agent_id: str,
    user_message: str,
    context: dict | None = None,
) -> CodeCheckResult:
    """
    Run code check for the given agent. Must be called before triage or medication agent.
    Returns CodeCheckResult; if ok is False, the orchestrator should not call the agent.
    """
    if agent_id not in AGENTS_REQUIRING_CODE_CHECK:
        return CodeCheckResult(ok=True, reason="", resolved_codes=[], agent_id=agent_id)

    if not GATEWAY_CDSS_URL:
        # CDSS not configured: allow through so user still gets a response (e.g. from general logic)
        return CodeCheckResult(ok=True, reason="", resolved_codes=[], agent_id=agent_id)

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{GATEWAY_CDSS_URL.rstrip('/')}/code-check",
                json={
                    "agent_id": agent_id,
                    "query": user_message,
                    "context": context or {},
                },
                timeout=10.0,
            )
            if r.status_code != 200:
                return CodeCheckResult(
                    ok=False,
                    reason="Code check service is temporarily unavailable. Please rephrase and try again.",
                    resolved_codes=[],
                    agent_id=agent_id,
                )
            data = r.json()
            return CodeCheckResult(
                ok=data.get("ok", False),
                reason=data.get("reason", ""),
                resolved_codes=data.get("resolved_codes", []),
                agent_id=data.get("agent_id", agent_id),
            )
    except Exception as e:
        # On network error, allow through so we don't block users; agent may still return helpful response
        return CodeCheckResult(
            ok=True,
            reason="",
            resolved_codes=[],
            agent_id=agent_id,
        )
