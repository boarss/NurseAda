from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field


class RetrieveRequest(BaseModel):
    query: str = Field(min_length=1, max_length=5_000)
    topK: int = Field(default=3, ge=1, le=10)


class Citation(BaseModel):
    title: str
    url: str | None = None
    snippet: str | None = None


class RetrieveResponse(BaseModel):
    items: list[Citation]


app = FastAPI(title="NurseAda Knowledge", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/retrieve", response_model=RetrieveResponse)
def retrieve(req: RetrieveRequest) -> RetrieveResponse:
    return RetrieveResponse(
        items=[
            Citation(
                title="General primary care safety advice",
                url=None,
                snippet=(
                    "If symptoms are severe, sudden, or getting worse, seek urgent in-person care. "
                    "For chest pain, difficulty breathing, confusion, or heavy bleeding, treat as an emergency."
                ),
            )
        ]
    )

