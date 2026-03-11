"""
Supabase JWT authentication for the NurseAda gateway.

Provides a FastAPI dependency that validates Bearer tokens and extracts
an opaque user_id. When SUPABASE_JWT_SECRET is not configured the
dependency returns None (guest mode) so the app still works in local dev.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request

from app.config import SUPABASE_JWT_SECRET


@dataclass
class AuthUser:
    user_id: str
    email: Optional[str] = None
    role: str = "authenticated"


def _decode_token(token: str) -> dict:
    """Decode and verify a Supabase JWT using the project's JWT secret."""
    return jwt.decode(
        token,
        SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        audience="authenticated",
        options={"require": ["sub", "exp"]},
    )


def _extract_bearer(request: Request) -> Optional[str]:
    auth_header = request.headers.get("authorization") or ""
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
    return None


async def get_current_user_optional(request: Request) -> Optional[AuthUser]:
    """Return the authenticated user or None when auth is not configured / token absent."""
    token = _extract_bearer(request)
    if not token:
        return None
    if not SUPABASE_JWT_SECRET:
        return None
    try:
        payload = _decode_token(token)
        return AuthUser(
            user_id=payload["sub"],
            email=payload.get("email"),
            role=payload.get("role", "authenticated"),
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token. Please sign in again.")


async def require_auth(request: Request) -> AuthUser:
    """Require a valid Supabase JWT. Returns 401 if missing or invalid."""
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Authentication is not configured on this server.",
        )
    user = await get_current_user_optional(request)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Please sign in to access this feature.",
        )
    return user
