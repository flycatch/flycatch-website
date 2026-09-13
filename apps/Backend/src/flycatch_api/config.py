from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

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
    cors_origins: str = (
        "http://localhost:8080,http://localhost:5173,http://localhost:4321,"
        "https://www.flycatchtech.com,https://flycatchtech.com"
    )
    public_write_rate_limit: int = 20
    public_write_rate_window_seconds: int = 60
    frontend_rebuild_webhook_url: str = ""
    frontend_rebuild_webhook_token: str = ""
    frontend_rebuild_event_type: str = "frontend-rebuild"
    frontend_rebuild_cooldown_seconds: int = 30
    recaptcha_secret: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    smtp_from: str = "noreply@flycatchtech.com"
    smtp_fallback_recipient: str = ""
    environment: str = "local"
    session_cookie_name: str = "admin_session"
    session_idle_minutes: int = 30
    session_absolute_hours: int = 12

    def allowed_cors_origins(self) -> list[str]:
        values = [self.public_origin, *self.cors_origins.split(",")]
        return list(dict.fromkeys(item.strip() for item in values if item.strip()))


settings = Settings()
