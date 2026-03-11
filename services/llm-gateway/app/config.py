"""
LLM Gateway configuration.
"""
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = (os.getenv("OPENAI_API_KEY") or "").strip()
OPENAI_BASE_URL = (os.getenv("OPENAI_BASE_URL") or "").strip() or None
VISION_MODEL = (os.getenv("VISION_MODEL") or "gpt-4o").strip()
COMPLETION_MODEL = (os.getenv("COMPLETION_MODEL") or "gpt-4o").strip()
