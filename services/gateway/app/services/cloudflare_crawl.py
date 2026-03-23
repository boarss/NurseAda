"""
Cloudflare Browser Rendering /crawl REST client.

Used to fetch markdown excerpts from allowlisted public health URLs when
signed-in users submit feedback with a reference source.
Docs: https://developers.cloudflare.com/browser-rendering/rest-api/crawl-endpoint/
"""
from __future__ import annotations

import asyncio
from typing import Any, Optional

import httpx

CLOUDFLARE_V4 = "https://api.cloudflare.com/client/v4"


class CloudflareCrawlError(Exception):
    """Raised when the Cloudflare crawl API returns an error."""


def _crawl_headers(api_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }


def _raise_for_cloudflare_payload(data: dict[str, Any], default: str) -> None:
    if data.get("success"):
        return
    errors = data.get("errors") or []
    if errors and isinstance(errors[0], dict):
        msg = errors[0].get("message") or default
    else:
        msg = default
    raise CloudflareCrawlError(msg)


async def start_crawl_job(
    *,
    account_id: str,
    api_token: str,
    url: str,
    limit: int = 3,
    depth: int = 2,
    render: bool = False,
    formats: Optional[list[str]] = None,
    crawl_purposes: Optional[list[str]] = None,
) -> str:
    """POST /browser-rendering/crawl; returns job id."""
    fmts = formats if formats is not None else ["markdown"]
    purposes = crawl_purposes if crawl_purposes is not None else ["ai-input"]
    endpoint = f"{CLOUDFLARE_V4}/accounts/{account_id}/browser-rendering/crawl"
    body: dict[str, Any] = {
        "url": url,
        "limit": min(max(limit, 1), 10),
        "depth": min(max(depth, 1), 20),
        "formats": fmts,
        "render": render,
        "crawlPurposes": purposes,
        "source": "all",
    }
    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=15.0)) as client:
        r = await client.post(endpoint, headers=_crawl_headers(api_token), json=body)
        r.raise_for_status()
        data = r.json()
    _raise_for_cloudflare_payload(data, "Failed to start crawl job")
    job_id = data.get("result")
    if not job_id or not isinstance(job_id, str):
        raise CloudflareCrawlError("Invalid crawl job response")
    return job_id


async def fetch_crawl_job(
    *,
    account_id: str,
    api_token: str,
    job_id: str,
    limit: Optional[int] = None,
    cursor: Optional[str] = None,
) -> dict[str, Any]:
    """GET crawl job status and optionally records."""
    endpoint = f"{CLOUDFLARE_V4}/accounts/{account_id}/browser-rendering/crawl/{job_id}"
    params: dict[str, str] = {}
    if limit is not None:
        params["limit"] = str(limit)
    if cursor:
        params["cursor"] = cursor
    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=15.0)) as client:
        r = await client.get(endpoint, headers=_crawl_headers(api_token), params=params or None)
        r.raise_for_status()
        data = r.json()
    _raise_for_cloudflare_payload(data, "Failed to fetch crawl job")
    result = data.get("result")
    if not isinstance(result, dict):
        raise CloudflareCrawlError("Invalid crawl job payload")
    return result


async def wait_for_crawl_completion(
    *,
    account_id: str,
    api_token: str,
    job_id: str,
    max_wait_seconds: float = 90.0,
    poll_interval: float = 3.0,
) -> dict[str, Any]:
    """Poll until terminal status, then return full result (first page of records)."""
    loop = asyncio.get_running_loop()
    deadline = loop.time() + max_wait_seconds
    while True:
        if loop.time() > deadline:
            raise CloudflareCrawlError("Crawl job timed out before completion")
        summary = await fetch_crawl_job(
            account_id=account_id,
            api_token=api_token,
            job_id=job_id,
            limit=1,
        )
        status = summary.get("status")
        if status != "running":
            break
        await asyncio.sleep(poll_interval)
    return await fetch_crawl_job(account_id=account_id, api_token=api_token, job_id=job_id)


def extract_markdown_excerpts(result: dict[str, Any], max_total_chars: int = 12000) -> list[dict[str, str]]:
    """Pull completed page markdown for RLHF storage (truncated)."""
    records = result.get("records") or []
    out: list[dict[str, str]] = []
    total = 0
    for rec in records:
        if not isinstance(rec, dict):
            continue
        if rec.get("status") != "completed":
            continue
        page_url = str(rec.get("url") or "")
        md = rec.get("markdown") or rec.get("html") or ""
        if not isinstance(md, str):
            continue
        remaining = max_total_chars - total
        if remaining <= 0:
            break
        chunk = md[:remaining]
        out.append({"url": page_url, "markdown": chunk})
        total += len(chunk)
    return out
