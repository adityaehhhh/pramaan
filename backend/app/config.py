import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PRAMAAN Digital Academic Records Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pramaan_demo_super_secret_jwt_key_2024_secure_signing_token")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for demo ease
    
    # Defaults to local SQLite database with WAL mode enabled, can be overridden with PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pramaan.db")
    
    # Frontend base URL for QR codes and verification links
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
