from __future__ import annotations

from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers.chat import router as chat_router
from app.routers.health import router as health_router


app = FastAPI(title="NurseAda Gateway", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Trace-Id"],
)


@app.middleware("http")
async def trace_id_middleware(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-Id") or str(uuid4())
    response = await call_next(request)
    response.headers["X-Trace-Id"] = trace_id
    return response


app.include_router(health_router)
app.include_router(chat_router)

