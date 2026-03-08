"""
Gateway configuration from environment.
All service URLs are optional; use empty string when not set.
"""
import os
from dotenv import load_dotenv

load_dotenv()


def _url(key: str, default: str = "") -> str:
    return (os.getenv(key) or default).strip()


# Optional backend URLs (default to empty string if unset)
GATEWAY_FHIR_URL = _url("GATEWAY_FHIR_URL")
GATEWAY_CDSS_URL = _url("GATEWAY_CDSS_URL")
GATEWAY_LLM_URL = _url("GATEWAY_LLM_URL")
GATEWAY_KNOWLEDGE_URL = _url("GATEWAY_KNOWLEDGE_URL")
PHARMACY_API_URL = _url("PHARMACY_API_URL")
LAB_API_URL = _url("LAB_API_URL")
EMERGENCY_API_URL = _url("EMERGENCY_API_URL")
