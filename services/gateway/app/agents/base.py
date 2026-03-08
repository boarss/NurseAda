"""
Base agent interface for NurseAda.
All agents are verified (input + output) before/after execution.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class AgentResult:
    """Result from an agent after successful execution and output verification."""
    content: str
    agent_id: str
    sources: list[str] = ()
    metadata: dict[str, Any] | None = None


class BaseAgent(ABC):
    """Agent that can be invoked only after input verification and must pass output verification."""

    @property
    @abstractmethod
    def agent_id(self) -> str:
        """Unique identifier for this agent (e.g. 'triage', 'medication')."""
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        """Short description for routing."""
        ...

    @abstractmethod
    async def execute(
        self,
        user_message: str,
        context: dict[str, Any] | None = None,
    ) -> AgentResult:
        """
        Run the agent. Called only after input verification passes.
        context may include: patient_id, conversation_history, fhir_data, etc.
        """
        ...
