from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", populate_by_name=True)

    database_url: str = "postgresql+psycopg://flycatch:change-me@localhost:5432/flycatch"
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "change-me"
    s3_bucket: str = "flycatch"
    s3_region: str = "us-east-1"
    s3_use_ssl: bool = False
    session_secret: str = "change-me-long-random"
    csrf_secret: str = "change-me-long-random"
    jwt_secret: str = "change-me-long-random-jwt-secret-key"
    jwt_access_minutes: int = 15
    build_export_token: str = "change-me-for-snapshot-export"
    public_origin: str = "http://localhost:8080"
    environment: str = "local"
    session_cookie_name: str = "admin_session"
    session_idle_minutes: int = 30
    session_absolute_hours: int = 12
    recaptcha_secret_key: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = Field(
        default="",
        validation_alias=AliasChoices("SMTP_USERNAME", "SMTP_USER", "smtp_username"),
    )
    smtp_password: str = ""
    smtp_use_tls: bool = True


settings = Settings()
