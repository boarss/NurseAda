from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    nurseada_env: str = Field(default="dev", alias="NURSEADA_ENV")

    llm_gateway_url: str = Field(default="http://localhost:8001", alias="LLM_GATEWAY_URL")
    cdss_url: str = Field(default="http://localhost:8002", alias="CDSS_URL")
    knowledge_url: str = Field(default="http://localhost:8003", alias="KNOWLEDGE_URL")

    request_timeout_s: float = Field(default=20.0, alias="REQUEST_TIMEOUT_S")

    cors_allow_origins: str = Field(default="*", alias="CORS_ALLOW_ORIGINS")

    # Privacy posture flags (no persistence yet, just guards behaviour).
    store_conversations: bool = Field(default=False, alias="STORE_CONVERSATIONS")
    log_pii: bool = Field(default=False, alias="LOG_PII")

    @property
    def cors_allow_origins_list(self) -> list[str]:
        if self.cors_allow_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_allow_origins.split(",") if o.strip()]


settings = Settings()

