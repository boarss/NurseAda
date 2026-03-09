from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.orchestrator import AgentOrchestrator

router = APIRouter()
orchestrator = AgentOrchestrator()


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    patient_id: str | None = None  # Optional: link chat to patient for EHR context
    image_base64: str | None = None  # Optional: attach image for imaging agent


class ChatResponse(BaseModel):
    reply: str


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.messages:
        return ChatResponse(reply="I'm here to help. Please send a message so I can assist you.")
    last = request.messages[-1]
    if last.role != "user":
        return ChatResponse(reply="Please send a user message to get a response.")
    user_message = (last.content or "").strip()
    if not user_message:
        return ChatResponse(reply="Your message was empty. I'd be happy to help—please type a health question or describe your symptoms.")

    context = {
        "conversation_history": [
            {"role": m.role, "content": m.content}
            for m in request.messages[:-1]
        ],
        "patient_id": request.patient_id,
        "image_base64": request.image_base64,
    }

    reply = await orchestrator.run(user_message, context=context)
    return ChatResponse(reply=reply)
