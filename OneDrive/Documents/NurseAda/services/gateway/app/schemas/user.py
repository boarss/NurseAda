from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class Consent(BaseModel):
    accepted: bool = Field(default=False)
    version: str = Field(default="v1-primary-care", max_length=64)
    acceptedAt: datetime | None = None
    locale: str | None = Field(default=None, max_length=16)
    country: str | None = Field(default=None, max_length=64)


class User(BaseModel):
    id: str = Field(max_length=128)
    consent: Consent

