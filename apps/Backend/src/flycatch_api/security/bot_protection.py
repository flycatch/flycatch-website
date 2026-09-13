from __future__ import annotations

import httpx

from flycatch_api.config import settings
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.services.author_service import CatalogError

RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"


def assert_human_submission(*, website: str = "", recaptcha_token: str = "") -> None:
    if website.strip():
        raise CatalogError(
            422,
            FieldErrors(
                fields={"website": FieldErrorDetail(message_key="public.bot_detected")}
            ).model_dump(),
        )
    secret = settings.recaptcha_secret.strip()
    if not secret:
        return
    token = recaptcha_token.strip()
    if not token or not _verify_recaptcha(secret, token):
        raise CatalogError(
            422,
            FieldErrors(
                fields={"recaptcha_token": FieldErrorDetail(message_key="public.bot_detected")}
            ).model_dump(),
        )


def _verify_recaptcha(secret: str, token: str) -> bool:
    try:
        response = httpx.post(
            RECAPTCHA_VERIFY_URL,
            data={"secret": secret, "response": token},
            timeout=5.0,
        )
        payload = response.json()
    except (httpx.HTTPError, ValueError):
        return False
    return bool(payload.get("success"))
