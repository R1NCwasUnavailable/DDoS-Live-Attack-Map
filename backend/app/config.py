from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Global Live DDoS Attack Map"
    VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["*"]

    # External Telemetry API Keys
    CLOUDFLARE_API_TOKEN: Optional[str] = None
    ABUSEIPDB_API_KEY: Optional[str] = None

    # Stochastic Engine Parameters
    POISSON_MIN_RATE: float = 2.5
    POISSON_MAX_RATE: float = 10.0
    EXP_VOLUME_MU: float = 25.0
    VOLUME_FLOOR: float = 1.5
    GEO_JITTER_RANGE: float = 2.5

    # Radar Polling Cache Interval (seconds)
    RADAR_CACHE_TTL_SEC: int = 600

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

