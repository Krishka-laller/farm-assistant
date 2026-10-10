from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    gemini_api_key: str = ""
    groq_api_key: str = ""
    data_gov_in_api_key: str = ""
    allowed_origins: str = "http://localhost:3000"
    max_image_size_mb: int = 5
    rate_limit_default: str = "30/minute"
    rate_limit_upload: str = "10/minute"
    rate_limit_chat: str = "20/minute"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def max_image_size_bytes(self) -> int:
        return self.max_image_size_mb * 1024 * 1024

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
