from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Header, HTTPException

from app.schemas.medications import (
    CheckInteractionsRequest,
    CheckInteractionsResponse,
    InteractionPair,
    Reminder,
    ReminderCreate,
    ReminderListResponse,
)
from app.services.clients import call_cdss_interactions

router = APIRouter(prefix="/medications", tags=["medications"])


# In-memory reminder store (per process; replace with DB for production).
_reminders: dict[str, Reminder] = {}


@router.post("/check-interactions", response_model=CheckInteractionsResponse)
async def check_interactions(
    req: CheckInteractionsRequest,
    x_trace_id: str | None = Header(default=None),
) -> CheckInteractionsResponse:
    trace_id = x_trace_id or str(uuid4())
    result = await call_cdss_interactions(req.drugNames, trace_id=trace_id)
    if result is None:
        raise HTTPException(status_code=502, detail="CDSS unavailable.")
    return CheckInteractionsResponse(
        hasInteraction=result.get("hasInteraction", False),
        severity=result.get("severity", "minor"),
        pairs=[InteractionPair(**p) for p in result.get("pairs", [])],
    )


@router.get("/reminders", response_model=ReminderListResponse)
def list_reminders() -> ReminderListResponse:
    return ReminderListResponse(reminders=list(_reminders.values()))


@router.post("/reminders", response_model=Reminder)
def create_reminder(body: ReminderCreate) -> Reminder:
    id_ = str(uuid4())
    r = Reminder(
        id=id_,
        medicationName=body.medicationName,
        time=body.time,
        dosage=body.dosage,
    )
    _reminders[id_] = r
    return r


@router.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: str) -> dict:
    if reminder_id not in _reminders:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    del _reminders[reminder_id]
    return {"ok": True}
