from dataclasses import dataclass
from typing import Any, Optional
import time


@dataclass
class InteractionRecord:
  conversation_id: Optional[str]
  agent_id: str
  severity: Optional[str]
  created_at: float
  metadata: dict[str, Any]


@dataclass
class FeedbackRecord:
  conversation_id: Optional[str]
  message_id: Optional[str]
  agent_id: Optional[str]
  rating: int
  comment: str
  created_at: float


class RLHFStore:
  def __init__(self) -> None:
    self.interactions: list[InteractionRecord] = []
    self.feedback: list[FeedbackRecord] = []

  def record_interaction(
    self,
    conversation_id: Optional[str],
    agent_id: str,
    severity: Optional[str],
    metadata: Optional[dict[str, Any]] = None,
  ) -> None:
    record = InteractionRecord(
      conversation_id=conversation_id,
      agent_id=agent_id,
      severity=severity,
      created_at=time.time(),
      metadata=metadata or {},
    )
    self.interactions.append(record)

  def record_feedback(
    self,
    conversation_id: Optional[str],
    message_id: Optional[str],
    agent_id: Optional[str],
    rating: int,
    comment: str,
  ) -> None:
    fb = FeedbackRecord(
      conversation_id=conversation_id,
      message_id=message_id,
      agent_id=agent_id,
      rating=rating,
      comment=comment,
      created_at=time.time(),
    )
    self.feedback.append(fb)


rlhf_store = RLHFStore()

