from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    llm_provider: str = Field(default="openai_compat", alias="LLM_PROVIDER")
    request_timeout_s: float = Field(default=30.0, alias="REQUEST_TIMEOUT_S")

    openai_compat_base_url: str = Field(default="http://localhost:11434/v1", alias="OPENAI_COMPAT_BASE_URL")
    openai_compat_api_key: str = Field(default="local-dev", alias="OPENAI_COMPAT_API_KEY")
    openai_compat_model: str = Field(default="llama3.1", alias="OPENAI_COMPAT_MODEL")

    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")

    anthropic_api_key: str | None = Field(default=None, alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-3-5-sonnet-latest", alias="ANTHROPIC_MODEL")


settings = Settings()

