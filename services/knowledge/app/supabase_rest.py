from __future__ import annotations

import os

import httpx


_SUPABASE_TIMEOUT = 8.0


def supabase_configured() -> bool:
    url = (os.getenv("SUPABASE_URL") or "").strip()
    service_role_key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    return bool(url and service_role_key)


def supabase_rest_url(table: str) -> str:
    url = (os.getenv("SUPABASE_URL") or "").strip()
    return f"{url.rstrip('/')}/rest/v1/{table}"


def supabase_headers() -> dict[str, str]:
    service_role_key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    return {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
    }


def fetch_rows(table: str, params: dict[str, str]) -> list[dict] | None:
    """Fetch rows from a Supabase PostgREST table. Returns None on error."""
    if not supabase_configured():
        return None

    try:
        with httpx.Client(timeout=_SUPABASE_TIMEOUT) as client:
            response = client.get(
                supabase_rest_url(table),
                headers=supabase_headers(),
                params=params,
            )
            response.raise_for_status()
            return response.json()
    except Exception:
        return None
