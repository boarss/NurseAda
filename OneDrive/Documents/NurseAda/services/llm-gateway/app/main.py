from __future__ import annotations

from uuid import uuid4

import structlog
from fastapi import FastAPI, Header, HTTPException

from app.guardrails import apply_output_policy, confidence_heuristic
from app.providers.factory import get_provider
from app.schemas import GenerateRequest, GenerateResponse


log = structlog.get_logger()
app = FastAPI(title="NurseAda LLM Gateway", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest, x_trace_id: str | None = Header(default=None)) -> GenerateResponse:
    trace_id = req.traceId or x_trace_id or str(uuid4())

    provider = get_provider()
    try:
        result = await provider.generate(
            messages=[m.model_dump() for m in req.messages],
            trace_id=trace_id,
        )
    except Exception as e:
        log.exception("llm_provider_error", trace_id=trace_id)
        raise HTTPException(status_code=502, detail="LLM provider error") from e

    content = apply_output_policy(str(result.get("content", "")), guardrail_profile=req.guardrailProfile)
    if not content:
        raise HTTPException(status_code=502, detail="Empty LLM response")

    confidence = confidence_heuristic(guardrail_profile=req.guardrailProfile)
    model = str(result.get("model", "unknown"))

    log.info("llm_generated", trace_id=trace_id, model=model, guardrail=req.guardrailProfile)

    return GenerateResponse(content=content, model=model, confidence=confidence)

