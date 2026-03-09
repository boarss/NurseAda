from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class ChatMessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class ChatMessage(BaseModel):
    role: ChatMessageRole
    content: str = Field(min_length=1, max_length=20_000)
    createdAt: str | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=50)
    locale: str | None = Field(default="en", max_length=16)
    country: str | None = Field(default=None, max_length=64)
    userId: str | None = Field(default=None, max_length=128)


class SafetyInfo(BaseModel):
    emergency: bool
    confidence: float = Field(ge=0.0, le=1.0)
    disclaimers: list[str] = Field(default_factory=list, max_length=10)


class Citation(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: str | None = Field(default=None, max_length=2000)


class ChatResponse(BaseModel):
    message: ChatMessage
    safety: SafetyInfo
    citations: list[Citation] | None = None
    traceId: str

