"""
Herbal catalog: public proxy to knowledge service for browsing herbal remedies.
No authentication required — this is health education content.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
import httpx

from app.config import GATEWAY_KNOWLEDGE_URL

router = APIRouter()


@router.get("/catalog")
async def herbal_catalog(
    condition: str = Query("", description="Filter by condition keyword"),
):
    """Browse all herbal/natural remedies. Optionally filter by condition."""
    if not GATEWAY_KNOWLEDGE_URL:
        raise HTTPException(
            status_code=503,
            detail="Herbal catalog is not configured (GATEWAY_KNOWLEDGE_URL not set)",
        )
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{GATEWAY_KNOWLEDGE_URL.rstrip('/')}/herbal/catalog",
                params={"condition": condition} if condition else {},
                timeout=10.0,
            )
            if r.status_code != 200:
                raise HTTPException(
                    status_code=r.status_code,
                    detail="Failed to fetch herbal catalog",
                )
            return r.json()
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not reach knowledge service: {str(e)}",
        )
