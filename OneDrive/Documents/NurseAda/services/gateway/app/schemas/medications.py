from __future__ import annotations

from pydantic import BaseModel, Field


class CheckInteractionsRequest(BaseModel):
    drugNames: list[str] = Field(min_length=1, max_length=20)


class InteractionPair(BaseModel):
    drugA: str
    drugB: str
    severity: str
    message: str


class CheckInteractionsResponse(BaseModel):
    hasInteraction: bool
    severity: str
    pairs: list[InteractionPair]


class ReminderCreate(BaseModel):
    medicationName: str = Field(min_length=1, max_length=200)
    time: str = Field(min_length=1, max_length=32)  # e.g. "08:00", "morning"
    dosage: str | None = Field(default=None, max_length=100)


class Reminder(BaseModel):
    id: str
    medicationName: str
    time: str
    dosage: str | None = None


class ReminderListResponse(BaseModel):
    reminders: list[Reminder]
