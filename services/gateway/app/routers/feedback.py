from fastapi import APIRouter
from pydantic import BaseModel

from app.services.rlhf import rlhf_store


router = APIRouter()


class FeedbackRequest(BaseModel):
  conversation_id: str | None = None
  message_id: str | None = None
  agent_id: str | None = None
  rating: int
  comment: str | None = None


@router.post("", response_model=dict)
def submit_feedback(payload: FeedbackRequest) -> dict:
  rlhf_store.record_feedback(
    conversation_id=payload.conversation_id,
    message_id=payload.message_id,
    agent_id=payload.agent_id,
    rating=payload.rating,
    comment=payload.comment or "",
  )
  return {"status": "ok"}

