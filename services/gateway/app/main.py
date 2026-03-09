"""
NurseAda API Gateway.
Routes: auth, chat, medications, health. Delegates to CDSS, LLM, Knowledge.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, chat, patient

app = FastAPI(
    title="NurseAda Gateway",
    description="Main API for NurseAda primary care assistant",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(patient.router, prefix="/patient", tags=["patient"])


@app.get("/")
def root():
    return {"service": "nurseada-gateway", "docs": "/docs"}
