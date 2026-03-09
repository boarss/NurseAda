import os
from dotenv import load_dotenv

load_dotenv()


def _url(key: str, default: str = "") -> str:
    return (os.getenv(key) or default).strip()
