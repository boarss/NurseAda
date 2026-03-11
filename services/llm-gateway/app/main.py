"""
NurseAda LLM Gateway: OpenAI/Claude-compatible API with vision support.
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI

from app.config import OPENAI_API_KEY, OPENAI_BASE_URL, VISION_MODEL, COMPLETION_MODEL

app = FastAPI(
    title="NurseAda LLM Gateway",
    description="LLM abstraction with guardrails, postprocessing, and vision",
    version="0.2.0",
)

MEDICAL_VISION_SYSTEM_PROMPT = (
    "You are NurseAda, a medical imaging assistant. Analyze the provided medical "
    "image (X-ray, CT, MRI, skin photo, wound, etc.) and describe what you observe. "
    "Structure your response with: 1) What the image shows, 2) Notable findings, "
    "3) Possible interpretations. Always state that this is preliminary guidance and "
    "the patient should consult a radiologist or healthcare provider for a definitive "
    "diagnosis. Never diagnose with certainty. If the image is not medical, politely "
    "note that and offer general health guidance instead."
)


def _get_client() -> OpenAI:
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="LLM provider is not configured (OPENAI_API_KEY not set).",
        )
    kwargs: dict = {"api_key": OPENAI_API_KEY}
    if OPENAI_BASE_URL:
        kwargs["base_url"] = OPENAI_BASE_URL
    return OpenAI(**kwargs)


# ── Text completion ──────────────────────────────────────────────────


class Message(BaseModel):
    role: str
    content: str


LOCALE_INSTRUCTIONS: dict[str, str] = {
    "pcm": "Respond in Nigerian Pidgin English. Use natural Pidgin phrasing that Nigerians use daily. Keep medical terms in English for clarity.",
    "ha": "Respond in Hausa language (Harshen Hausa). Keep medical terms and drug names in English for clarity.",
    "yo": "Respond in Yoruba language (Ede Yoruba). Use proper Yoruba diacritics. Keep medical terms and drug names in English for clarity.",
    "ig": "Respond in Igbo language (Asusu Igbo). Keep medical terms and drug names in English for clarity.",
}


class CompletionRequest(BaseModel):
    messages: list[Message]
    max_tokens: int = 1024
    locale: str | None = None


class CompletionResponse(BaseModel):
    content: str
    model: str = ""
    finish_reason: str = "stop"


@app.get("/health")
def health():
    return {"status": "ok", "service": "llm-gateway"}


@app.post("/v1/complete", response_model=CompletionResponse)
def complete(request: CompletionRequest):
    client = _get_client()
    msgs: list[dict] = []
    locale_instruction = LOCALE_INSTRUCTIONS.get(request.locale or "")
    if locale_instruction:
        msgs.append({"role": "system", "content": locale_instruction})
    msgs.extend({"role": m.role, "content": m.content} for m in request.messages)
    resp = client.chat.completions.create(
        model=COMPLETION_MODEL,
        messages=msgs,
        max_tokens=request.max_tokens,
    )
    choice = resp.choices[0]
    return CompletionResponse(
        content=choice.message.content or "",
        model=resp.model,
        finish_reason=choice.finish_reason or "stop",
    )


# ── Vision (medical image analysis) ─────────────────────────────────


class VisionRequest(BaseModel):
    image_base64: str
    prompt: str = "Analyze this medical image."
    max_tokens: int = 1024


class VisionResponse(BaseModel):
    content: str
    model: str = ""
    finish_reason: str = "stop"


@app.post("/v1/vision", response_model=VisionResponse)
def vision(request: VisionRequest):
    client = _get_client()

    b64 = request.image_base64
    if not b64.startswith("data:"):
        b64 = f"data:image/png;base64,{b64}"

    resp = client.chat.completions.create(
        model=VISION_MODEL,
        messages=[
            {"role": "system", "content": MEDICAL_VISION_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": request.prompt},
                    {"type": "image_url", "image_url": {"url": b64, "detail": "high"}},
                ],
            },
        ],
        max_tokens=request.max_tokens,
    )
    choice = resp.choices[0]
    return VisionResponse(
        content=choice.message.content or "",
        model=resp.model,
        finish_reason=choice.finish_reason or "stop",
    )
