from __future__ import annotations

from typing import Any

import structlog

from app.config import settings


log = structlog.get_logger()


def audit_event(event_type: str, *, trace_id: str, user_id: str | None = None, data: dict[str, Any] | None = None) -> None:
  """Audit log scaffold. Writes structured logs; later this can fan out to Kafka or an immutable store."""
  if not data:
      data = {}
  log.info(
      "audit_event",
      event_type=event_type,
      trace_id=trace_id,
      user_id=user_id,
      store_conversations=settings.store_conversations,
      **data,
  )

