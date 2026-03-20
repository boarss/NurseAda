from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.agents.orchestrator import AgentOrchestrator
from app.services.auth import AuthUser, get_current_user_optional

router = APIRouter()
orchestrator = AgentOrchestrator()


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    patient_id: str | None = None
    image_base64: str | None = None
    locale: str | None = None


class ChatResponse(BaseModel):
    reply: str
    clinical: dict | None = None


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Optional[AuthUser] = Depends(get_current_user_optional),
):
    if not request.messages:
        return ChatResponse(reply="I'm here to help. Please send a message so I can assist you.")
    last = request.messages[-1]
    if last.role != "user":
        return ChatResponse(reply="Please send a user message to get a response.")
    user_message = (last.content or "").strip()
    if not user_message:
        return ChatResponse(reply="Your message was empty. I'd be happy to help—please type a health question or describe your symptoms.")

    patient_id = request.patient_id
    if patient_id and current_user is None:
        patient_id = None

    locale = request.locale if request.locale in ("en", "pcm", "ha", "yo", "ig") else "en"

    context = {
        "conversation_history": [
            {"role": m.role, "content": m.content}
            for m in request.messages[:-1]
        ],
        "patient_id": patient_id,
        "image_base64": request.image_base64,
        "user_id": current_user.user_id if current_user else None,
        "locale": locale,
    }

    response = await orchestrator.run_with_metadata(user_message, context=context)
    return ChatResponse(reply=response.get("reply", ""), clinical=response.get("clinical"))
