"""
FHIR adapter configuration.
"""
import os
from dotenv import load_dotenv

load_dotenv()

FHIR_BASE_URL = (os.getenv("FHIR_BASE_URL") or "").strip()
