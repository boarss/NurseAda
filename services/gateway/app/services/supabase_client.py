"""
Thin Supabase PostgREST client for server-side data access.
Uses the service role key to bypass RLS and filters by user_id explicitly.
"""
from __future__ import annotations

import httpx
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

_TIMEOUT = 10.0


def _headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _rest_url(table: str) -> str:
    return f"{SUPABASE_URL.rstrip('/')}/rest/v1/{table}"


def is_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


async def select(
    table: str,
    *,
    filters: dict[str, str] | None = None,
    order: str = "created_at.desc",
) -> list[dict]:
    params: dict[str, str] = {"order": order, "select": "*"}
    for col, val in (filters or {}).items():
        params[col] = val
    async with httpx.AsyncClient() as client:
        r = await client.get(
            _rest_url(table), headers=_headers(), params=params, timeout=_TIMEOUT,
        )
        r.raise_for_status()
        return r.json()


async def insert(table: str, row: dict) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            _rest_url(table), headers=_headers(), json=row, timeout=_TIMEOUT,
        )
        r.raise_for_status()
        data = r.json()
        return data[0] if isinstance(data, list) else data


async def update(table: str, row_id: str, fields: dict) -> dict:
    h = _headers()
    h["Prefer"] = "return=representation"
    async with httpx.AsyncClient() as client:
        r = await client.patch(
            _rest_url(table),
            headers=h,
            params={"id": f"eq.{row_id}"},
            json=fields,
            timeout=_TIMEOUT,
        )
        r.raise_for_status()
        data = r.json()
        return data[0] if isinstance(data, list) and data else {}


async def delete(table: str, row_id: str, *, user_id: str) -> bool:
    async with httpx.AsyncClient() as client:
        r = await client.delete(
            _rest_url(table),
            headers=_headers(),
            params={"id": f"eq.{row_id}", "user_id": f"eq.{user_id}"},
            timeout=_TIMEOUT,
        )
        r.raise_for_status()
        return True
