from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Role = Literal["system", "user", "assistant"]


class Message(BaseModel):
    role: Role
    content: str = Field(min_length=1, max_length=20_000)


class GenerateRequest(BaseModel):
    messages: list[Message] = Field(min_length=1, max_length=60)
    guardrailProfile: str = Field(default="primary_care_v1", max_length=64)
    traceId: str | None = Field(default=None, max_length=128)


class GenerateResponse(BaseModel):
    content: str
    model: str
    confidence: float = Field(ge=0.0, le=1.0)

