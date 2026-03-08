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


class ChatResponse(BaseModel):
    reply: str


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.messages:
        return ChatResponse(reply="Please send a message so I can help you.")
    last = request.messages[-1]
    if last.role != "user":
        return ChatResponse(reply="Please send a user message to get a response.")
    user_message = (last.content or "").strip()
    if not user_message:
        return ChatResponse(reply="Your message was empty. Type a health question or describe your symptoms.")

    # Build context (e.g. patient_id from auth/session in the future)
    context = {
        "conversation_history": [
            {"role": m.role, "content": m.content}
            for m in request.messages[:-1]
        ],
        "patient_id": None,  # TODO: from auth/session when available
    }

    reply = await orchestrator.run(user_message, context=context)
    return ChatResponse(reply=reply)
