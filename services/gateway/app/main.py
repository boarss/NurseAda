"""
NurseAda API Gateway.
Routes: auth, chat, medications, health. Delegates to CDSS, LLM, Knowledge.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ALLOW_ORIGINS
from app.routers import health, chat, patient, feedback, herbal, medications, appointments

app = FastAPI(
    title="NurseAda Gateway",
    description="Main API for NurseAda primary care assistant",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(patient.router, prefix="/patient", tags=["patient"])
app.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
app.include_router(herbal.router, prefix="/herbal", tags=["herbal"])
app.include_router(medications.router, prefix="/medications", tags=["medications"])
app.include_router(appointments.router, prefix="/appointments", tags=["appointments"])


@app.get("/")
def root():
    return {"service": "nurseada-gateway", "docs": "/docs"}
