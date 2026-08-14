import hashlib
import hmac
import secrets

from flycatch_api.config import settings


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def sign_csrf_token(token: str) -> str:
    signature = hmac.new(
        settings.csrf_secret.encode(),
        token.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{token}.{signature}"


def verify_csrf_token(signed: str) -> bool:
    if "." not in signed:
        return False
    token, signature = signed.rsplit(".", 1)
    expected = hmac.new(
        settings.csrf_secret.encode(),
        token.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(signature, expected)
