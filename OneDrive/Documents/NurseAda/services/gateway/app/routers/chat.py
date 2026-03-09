from fastapi import APIRouter, Header

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chatbot import handle_chat

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, x_trace_id: str | None = Header(default=None)) -> ChatResponse:
    return await handle_chat(req, trace_id=x_trace_id)

