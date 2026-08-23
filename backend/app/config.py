import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "AI Civic & Legal Empowerment MAS"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    
    # Gemini & Gemma API Configuration
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "gemma-4-31b-it")
    FALLBACK_MODEL: str = os.getenv("FALLBACK_MODEL", "gemma-4-26b-a4b-it")

    GEMMA_4_DENSE: str = "gemma-4-31b-it"
    GEMMA_4_MOE: str = "gemma-4-26b-a4b-it"
    GEMMA_4_FAST: str = "gemma-4-12e-it"



    
    # Sarvam AI Configuration (Indian Languages Speech & Voice)
    SARVAM_API_KEY: Optional[str] = os.getenv("SARVAM_API_KEY", "")
    SARVAM_STT_MODEL: str = "saarika:v2.5"
    SARVAM_TTS_MODEL: str = "bulbul:v2"




    
    # Security & Encryption
    DATA_ENCRYPTION_KEY: str = os.getenv("DATA_ENCRYPTION_KEY", "uNqT3L3vXqR7mZP1sW8yA5bC9dE4fG2hJ6kL0mN8pQ=")

    
    # Database & MongoDB Configuration
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "civic_empowerment.db")
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "legal_adviser_ai")

    
    # PDF Storage
    PDF_OUTPUT_DIR: str = os.getenv("PDF_OUTPUT_DIR", "generated_pdfs")
    
    # IEEE Standards Compliance
    IEEE_7000_PRIVACY_ENFORCED: bool = True
    IEEE_829_MIN_COVERAGE_PCT: float = 85.0
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
