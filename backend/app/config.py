import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "AI Civic & Legal Empowerment MAS"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    
    # Gemini API Configuration
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    DEFAULT_MODEL: str = "gemini-3.5-flash-lite"
    FALLBACK_MODEL: str = "gemini-3.5-flash-lite"

    
    # Sarvam AI Configuration (Indian Languages Speech & Voice)
    SARVAM_API_KEY: Optional[str] = os.getenv("SARVAM_API_KEY", "")
    SARVAM_STT_MODEL: str = "saarika:v2"
    SARVAM_TTS_MODEL: str = "bulbul:v2"



    
    # Security & Encryption
    DATA_ENCRYPTION_KEY: str = os.getenv("DATA_ENCRYPTION_KEY", "uNqT3L3vXqR7mZP1sW8yA5bC9dE4fG2hJ6kL0mN8pQ=")

    
    # Database
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "civic_empowerment.db")
    
    # PDF Storage
    PDF_OUTPUT_DIR: str = os.getenv("PDF_OUTPUT_DIR", "generated_pdfs")
    
    # IEEE Standards Compliance
    IEEE_7000_PRIVACY_ENFORCED: bool = True
    IEEE_829_MIN_COVERAGE_PCT: float = 85.0
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
