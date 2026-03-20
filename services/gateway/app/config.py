"""
Gateway configuration from environment.
All service URLs are optional; use empty string when not set.
"""
import os
from dotenv import load_dotenv

load_dotenv()


def _url(key: str, default: str = "") -> str:
    return (os.getenv(key) or default).strip()


def _str(key: str, default: str = "") -> str:
    return (os.getenv(key) or default).strip()


# Optional backend URLs (default to empty string if unset)
# FHIR/EHR is intentionally disabled for NurseAda v2 independence.
# Even if GATEWAY_FHIR_URL is set in the environment, the gateway will not use it.
GATEWAY_FHIR_URL = ""
GATEWAY_CDSS_URL = _url("GATEWAY_CDSS_URL")
GATEWAY_LLM_URL = _url("GATEWAY_LLM_URL")
GATEWAY_KNOWLEDGE_URL = _url("GATEWAY_KNOWLEDGE_URL")
PHARMACY_API_URL = _url("PHARMACY_API_URL")
LAB_API_URL = _url("LAB_API_URL")
EMERGENCY_API_URL = _url("EMERGENCY_API_URL")
GATEWAY_XAI_URL = _url("GATEWAY_XAI_URL")

# CORS – comma-separated origins (defaults to localhost for dev)
CORS_ALLOW_ORIGINS = [
    o.strip()
    for o in (os.getenv("CORS_ALLOW_ORIGINS") or "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]

# Supabase Auth – set these to enable JWT-based authentication
SUPABASE_URL = _str("SUPABASE_URL")
SUPABASE_ANON_KEY = _str("SUPABASE_ANON_KEY")
SUPABASE_JWT_SECRET = _str("SUPABASE_JWT_SECRET")
SUPABASE_SERVICE_ROLE_KEY = _str("SUPABASE_SERVICE_ROLE_KEY")
