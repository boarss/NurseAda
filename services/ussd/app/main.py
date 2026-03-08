"""
NurseAda USSD/IVR bridge: translates telecom provider callbacks into gateway chat
and formats replies for USSD (short menus) and IVR (voice).
"""
from fastapi import FastAPI, Request
from pydantic import BaseModel
import httpx
import os

app = FastAPI(
    title="NurseAda USSD/IVR Bridge",
    description="Webhook for USSD and IVR providers; forwards to gateway /chat",
    version="0.1.0",
)

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8000")
# USSD reply max length (provider-dependent; ~182 safe for many)
USSD_MAX_LEN = 182


class USSDRequest(BaseModel):
    """Generic USSD callback body (adapt to provider: Africa's Talking, etc.)."""
    session_id: str
    phone_number: str
    text: str = ""  # concatenated menu choices e.g. "1*2" or free text
    service_code: str = ""


@app.get("/health")
def health():
    return {"status": "ok", "service": "ussd-bridge"}


@app.post("/ussd/callback")
async def ussd_callback(request: Request):
    """
    Provider sends POST with session_id, phone_number, text (user input).
    Return plain text or CON line for menu (provider-specific).
    """
    try:
        body = await request.json()
    except Exception:
        return _ussd_response("Sorry, invalid request.")

    session_id = body.get("sessionId") or body.get("session_id") or ""
    phone = body.get("phoneNumber") or body.get("phone_number") or ""
    text = (body.get("text") or "").strip()
    # New session: show welcome menu
    if not text:
        return _ussd_response(
            "NurseAda Health\n"
            "1. Symptom check\n"
            "2. Medication info\n"
            "3. Talk to assistant"
        )

    # Build conversation from session (in production, use Redis/DB keyed by session_id)
    # For now, single turn: current input only
    messages = [{"role": "user", "content": _normalize_ussd_input(text)}]
    reply = await _call_gateway_chat(messages)
    return _ussd_response(_truncate_for_ussd(reply))


def _ussd_response(message: str, end_session: bool = False):
    """Return format depends on provider. Africa's Talking uses 'CON' or 'END'."""
    if end_session:
        return {"Message": message, "Type": "End"}
    return {"Message": message, "Type": "Con"}


def _normalize_ussd_input(text: str) -> str:
    """Map menu choices to a short prompt for the LLM."""
    parts = text.split("*")
    if len(parts) == 1 and parts[0].isdigit():
        options = {"1": "I want to check my symptoms.", "2": "I need medication information.", "3": "I want to talk to the health assistant."}
        return options.get(parts[0], text)
    return text if text else "I need health help."


def _truncate_for_ussd(text: str, max_len: int = USSD_MAX_LEN) -> str:
    if len(text) <= max_len:
        return text
    return text[: max_len - 3].rstrip() + "..."


async def _call_gateway_chat(messages: list[dict]) -> str:
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{GATEWAY_URL}/chat",
                json={"messages": messages},
            )
            r.raise_for_status()
            data = r.json()
            return data.get("reply", "Sorry, no response.")
    except Exception:
        return "Service temporarily unavailable. Try again or use the app."
