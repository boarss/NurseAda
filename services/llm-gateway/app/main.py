"""
NurseAda LLM Gateway: OpenAI/Claude-compatible API, guardrails, safe completion.
"""
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="NurseAda LLM Gateway",
    description="LLM abstraction with guardrails and postprocessing",
    version="0.1.0",
)


class Message(BaseModel):
    role: str
    content: str


class CompletionRequest(BaseModel):
    messages: list[Message]
    max_tokens: int = 1024


class CompletionResponse(BaseModel):
    content: str
    finish_reason: str = "stop"


@app.get("/health")
def health():
    return {"status": "ok", "service": "llm-gateway"}


@app.post("/v1/complete", response_model=CompletionResponse)
def complete(request: CompletionRequest):
    # TODO: call OpenAI/Claude, apply guardrails, safe completion
    return CompletionResponse(
        content="[LLM completion will be wired here with guardrails.]",
        finish_reason="stop",
    )
