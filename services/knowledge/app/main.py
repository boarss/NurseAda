"""
NurseAda Knowledge: medical KB, vector search, retrieval for RAG.
"""
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="NurseAda Knowledge",
    description="Medical knowledge base and vector retrieval",
    version="0.1.0",
)


class RetrieveRequest(BaseModel):
    query: str = ""
    top_k: int = 5


@app.get("/health")
def health():
    return {"status": "ok", "service": "knowledge"}


@app.post("/retrieve")
def retrieve(req: RetrieveRequest):
    # TODO: vector DB (Pinecone/Weaviate), medical KB, herbal/natural products
    return {"chunks": [], "sources": []}
