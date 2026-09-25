from __future__ import annotations

from typing import NoReturn

import httpx

from flycatch_api.config import settings
from flycatch_api.services.author_service import CatalogError

SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"


def verify_recaptcha(token: str) -> None:
    secret = settings.recaptcha_secret_key.strip()
    if not secret:
        _fail()
    try:
        response = httpx.post(
            SITEVERIFY_URL,
            data={"secret": secret, "response": token},
            timeout=10.0,
        )
        payload = response.json()
    except (httpx.HTTPError, ValueError):
        _fail()
    if not isinstance(payload, dict) or not payload.get("success"):
        _fail()


def _fail() -> NoReturn:
    raise CatalogError(
        400,
        {"code": "captcha_failed", "message_key": "public.contacts.recaptcha.invalid"},
    )
