from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "CapitalGuard API"
    # Fallback to sqlite for dev if pg isn't ready
    DATABASE_URL: str = "sqlite:///./capitalguard_dev.db"
    ANTHROPIC_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
