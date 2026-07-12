import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "TransitOps"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/transitops"
    
    model_config = SettingsConfigDict(
        # Look for .env file in the backend root directory
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
