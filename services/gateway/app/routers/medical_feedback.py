"""
Signed-in feedback with optional Cloudflare crawl of allowlisted medical sources.

Stores user rating/comment in RLHF plus crawled markdown excerpts in metadata
for reviewer context (not shown to end users as medical advice).
"""
from __future__ import annotations

from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.config import (
    CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN,
    cloudflare_crawl_configured,
    medical_crawl_allowlist_prefixes,
)
from app.services.auth import AuthUser, require_auth
from app.services.cloudflare_crawl import (
    CloudflareCrawlError,
    extract_markdown_excerpts,
    start_crawl_job,
    wait_for_crawl_completion,
)
from app.services.rlhf import rlhf_store

router = APIRouter()


def _normalize_url(url: str) -> str:
    u = url.strip()
    parsed = urlparse(u)
    if parsed.scheme.lower() != "https":
        raise HTTPException(
            status_code=400,
            detail="Only https:// URLs are allowed for medical source links.",
        )
    if not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid source URL.")
    return u


def _url_matches_allowlist(url: str, prefixes: list[str]) -> bool:
    if not prefixes:
        return False
    u = url.lower()
    for p in prefixes:
        pl = p.strip().lower()
        if not pl.startswith("https://"):
            continue
        if u == pl.rstrip("/"):
            return True
        base = pl.rstrip("/") + "/"
        if u.startswith(base):
            return True
    return False


class MedicalFeedbackRequest(BaseModel):
    source_url: str = Field(..., min_length=8)
    conversation_id: str | None = None
    message_id: str | None = None
    agent_id: str | None = None
    rating: int = Field(..., ge=-1, le=1)
    comment: str | None = None
    max_pages: int = Field(default=3, ge=1, le=10)

    @field_validator("source_url")
    @classmethod
    def strip_source_url(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("source_url is required")
        return s


@router.post("", response_model=dict)
async def submit_medical_feedback(
    payload: MedicalFeedbackRequest,
    _user: AuthUser = Depends(require_auth),
) -> dict:
    if not cloudflare_crawl_configured():
        raise HTTPException(
            status_code=503,
            detail="Medical source capture is not configured on this server.",
        )

    url_str = _normalize_url(payload.source_url)
    allow = medical_crawl_allowlist_prefixes()
    if not _url_matches_allowlist(url_str, allow):
        raise HTTPException(
            status_code=400,
            detail=(
                "That URL is not on the allowlist for medical references. "
                "Use links from trusted public health sites (e.g. WHO, CDC, NHS)."
            ),
        )

    metadata: dict = {
        "user_id": _user.user_id,
        "source_url": url_str,
        "crawl": {"status": "pending"},
    }
    try:
        job_id = await start_crawl_job(
            account_id=CLOUDFLARE_ACCOUNT_ID,
            api_token=CLOUDFLARE_API_TOKEN,
            url=url_str,
            limit=payload.max_pages,
            depth=2,
            render=False,
            formats=["markdown"],
            crawl_purposes=["ai-input"],
        )
        metadata["crawl"]["job_id"] = job_id
        result = await wait_for_crawl_completion(
            account_id=CLOUDFLARE_ACCOUNT_ID,
            api_token=CLOUDFLARE_API_TOKEN,
            job_id=job_id,
            max_wait_seconds=90.0,
            poll_interval=3.0,
        )
        status = result.get("status")
        metadata["crawl"]["status"] = status
        if status == "completed":
            excerpts = extract_markdown_excerpts(result)
            metadata["crawl"]["pages"] = excerpts
        else:
            metadata["crawl"]["message"] = f"Crawl finished with status: {status}"
    except CloudflareCrawlError as e:
        metadata["crawl"]["status"] = "error"
        metadata["crawl"]["message"] = str(e)
    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Could not reach the crawl service. Please try again shortly.",
        ) from None

    rlhf_store.record_feedback(
        conversation_id=payload.conversation_id,
        message_id=payload.message_id,
        agent_id=payload.agent_id,
        rating=payload.rating,
        comment=payload.comment or "",
        metadata=metadata,
    )

    disclaimer = (
        "This is general information only, not medical advice. "
        "Consult a healthcare provider. In an emergency, seek care immediately."
    )
    return {
        "status": "ok",
        "crawl_status": metadata["crawl"].get("status"),
        "pages_captured": len(metadata["crawl"].get("pages") or []),
        "disclaimer": disclaimer,
    }
