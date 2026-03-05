from __future__ import annotations

from uuid import uuid4

import structlog

from app.schemas.chat import ChatMessage, ChatMessageRole, ChatRequest, ChatResponse, SafetyInfo
from app.schemas.user import Consent
from app.services.audit import audit_event
from app.services.clients import call_cdss_triage, call_llm_generate
from app.services.guardrails import base_disclaimers, local_emergency_heuristic
from app.services.postprocessing import clamp_confidence, enforce_safe_completion
from app.services.preprocessing import mask_pii, normalize_text


log = structlog.get_logger()


def _latest_user_text(req: ChatRequest) -> str:
    for m in reversed(req.messages):
        if m.role == ChatMessageRole.user:
            return m.content
    return req.messages[-1].content


def _build_system_prompt(*, locale: str | None, country: str | None, triage: dict | None) -> str:
    locale_str = locale or "en"
    country_str = country or "unspecified"
    triage_line = ""
    if triage:
        triage_line = f"TriageSignals: {triage}"

    return (
        "You are NurseAda, a cautious primary-care virtual assistant for Africa.\n"
        "Rules:\n"
        "- Do not provide definitive diagnosis. Offer possibilities and next steps.\n"
        "- If emergency red flags are present, advise urgent care immediately.\n"
        "- Ask 1–3 clarifying questions if needed.\n"
        "- Be culturally sensitive and use plain language.\n"
        "- Avoid unsafe medication dosing instructions when uncertain.\n"
        f"Locale: {locale_str}\n"
        f"Country: {country_str}\n"
        f"{triage_line}\n"
    ).strip()


async def handle_chat(req: ChatRequest, *, trace_id: str | None = None) -> ChatResponse:
    trace_id = trace_id or str(uuid4())
    user_text_raw = _latest_user_text(req)
    user_text_norm = normalize_text(user_text_raw)
    user_text_masked, pii_found = mask_pii(user_text_norm)

    # Fail-safe emergency heuristic (CDSS may override/confirm)
    emergency_local = local_emergency_heuristic(user_text_norm)

    triage = await call_cdss_triage(user_text_norm, trace_id=trace_id)
    emergency = emergency_local or bool(triage and triage.get("emergency") is True)

    system_prompt = _build_system_prompt(locale=req.locale, country=req.country, triage=triage)

    messages_for_llm: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    for m in req.messages:
        content = normalize_text(m.content)
        if m.role == ChatMessageRole.user:
            content, _ = mask_pii(content)
        messages_for_llm.append({"role": m.role.value, "content": content})

    llm_result = await call_llm_generate(
        messages=messages_for_llm,
        guardrail_profile="primary_care_v1",
        trace_id=trace_id,
    )

    if llm_result and isinstance(llm_result.get("content"), str):
        assistant_text = llm_result["content"].strip()
        confidence = clamp_confidence(float(llm_result.get("confidence", 0.65)))
    else:
        assistant_text = (
            "I can help, but I’m having trouble reaching the AI service right now.\n\n"
            "Can you share:\n"
            "1) your age and sex,\n"
            "2) how long you’ve had the symptoms,\n"
            "3) any known conditions/medications,\n"
            "4) any severe symptoms (trouble breathing, chest pain, confusion, severe bleeding)?"
        )
        confidence = 0.2

    assistant_text = enforce_safe_completion(assistant_text, emergency=emergency)

    disclaimers = base_disclaimers()
    if pii_found:
        disclaimers.insert(0, "For privacy, please avoid sharing phone numbers, emails, or IDs in chat.")

    audit_event(
        "chat_turn",
        trace_id=trace_id,
        user_id=req.userId,
        data={
            "emergency": emergency,
            "confidence": confidence,
            "pii_found": pii_found,
        },
    )

    return ChatResponse(
        message=ChatMessage(role=ChatMessageRole.assistant, content=assistant_text),
        safety=SafetyInfo(emergency=emergency, confidence=confidence, disclaimers=disclaimers),
        citations=None,
        traceId=trace_id,
    )

