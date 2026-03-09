from __future__ import annotations


_EMERGENCY_KEYWORDS = (
    "chest pain",
    "difficulty breathing",
    "shortness of breath",
    "severe bleeding",
    "unconscious",
    "seizure",
    "stroke",
    "face drooping",
    "slurred speech",
    "can't speak",
    "pregnant and bleeding",
    "suicidal",
    "kill myself",
)


def local_emergency_heuristic(text: str) -> bool:
    t = text.lower()
    return any(k in t for k in _EMERGENCY_KEYWORDS)


def base_disclaimers() -> list[str]:
    return [
        "I’m not a doctor. This information is for guidance and does not replace medical care.",
        "If symptoms are severe, worsening, or you feel unsafe, seek urgent care or call local emergency services now.",
    ]

