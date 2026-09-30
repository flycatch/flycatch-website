from __future__ import annotations

import hmac
import logging
import warnings
from datetime import UTC, datetime
from urllib.parse import urlencode

import httpx
from joserfc import jwt as jose_jwt
from joserfc.jwk import KeySet
from joserfc.jwt import JWTClaimsRegistry
from sqlalchemy import func
from sqlalchemy.orm import Session

from flycatch_api.config import settings
from flycatch_api.models import Administrator
from flycatch_api.schemas import TokenPair
from flycatch_api.security.oauth_state import new_state_payload, read_state, sign_state
from flycatch_api.services.auth_service import AuthService

logger = logging.getLogger(__name__)

with warnings.catch_warnings():
    warnings.filterwarnings("ignore", message=r".*httpx module is deprecated.*")
    from authlib.integrations.httpx_client import OAuth2Client


class MicrosoftSignInRejected(Exception):
    """Generic Microsoft sign-in failure. Callers must not add account detail."""


def company_email(email: str | None) -> str | None:
    if not email or "@" not in email:
        return None
    normalized = email.strip().lower()
    domain = settings.allowed_email_domain.strip().lower()
    if not domain or not normalized.endswith(f"@{domain}"):
        return None
    return normalized


def reconcile_microsoft_account(db: Session, oid: str, email: str) -> Administrator:
    normalized = company_email(email)
    if not oid or normalized is None:
        raise MicrosoftSignInRejected()

    by_oid = db.query(Administrator).filter(Administrator.microsoft_oid == oid).one_or_none()
    if by_oid is not None:
        if not by_oid.is_active:
            raise MicrosoftSignInRejected()
        return by_oid

    by_email = (
        db.query(Administrator).filter(func.lower(Administrator.email) == normalized).one_or_none()
    )
    if by_email is not None:
        if by_email.microsoft_oid and by_email.microsoft_oid != oid:
            raise MicrosoftSignInRejected()
        if not by_email.is_active:
            raise MicrosoftSignInRejected()
        if by_email.microsoft_oid is None:
            by_email.microsoft_oid = oid
            db.commit()
            db.refresh(by_email)
        return by_email

    admin = Administrator(
        email=normalized,
        password_hash=None,
        microsoft_oid=oid,
        is_active=True,
        created_at=datetime.now(UTC),
        created_by="microsoft",
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def validate_id_token(id_token: str, jwks: dict, nonce: str) -> dict[str, str]:
    tenant = settings.azure_ad_tenant_id.strip()
    issuer = f"https://login.microsoftonline.com/{tenant}/v2.0"
    try:
        token = jose_jwt.decode(id_token, KeySet.import_key_set(jwks))
        JWTClaimsRegistry(
            iss={"essential": True, "value": issuer},
            aud={"essential": True, "value": settings.azure_ad_client_id},
            exp={"essential": True},
        ).validate(token.claims)
    except Exception as exc:
        raise MicrosoftSignInRejected() from exc
    if token.claims.get("nonce") != nonce:
        raise MicrosoftSignInRejected()
    tid = token.claims.get("tid")
    if tid and tid != tenant:
        raise MicrosoftSignInRejected()
    oid = token.claims.get("oid")
    email = token.claims.get("email") or token.claims.get("preferred_username")
    if not isinstance(oid, str) or not isinstance(email, str):
        raise MicrosoftSignInRejected()
    return {"oid": oid, "email": email}


class MicrosoftAuthService:
    def __init__(self) -> None:
        self._auth = AuthService()
        self._metadata: dict | None = None

    def authorize_redirect(self) -> tuple[str, str]:
        if not settings.microsoft_sign_in_configured():
            raise MicrosoftSignInRejected()
        payload = new_state_payload()
        query = urlencode(
            {
                "client_id": settings.azure_ad_client_id,
                "response_type": "code",
                "redirect_uri": settings.azure_ad_redirect_uri,
                "response_mode": "query",
                "scope": "openid email profile",
                "state": payload["state"],
                "nonce": payload["nonce"],
                "code_challenge": payload["challenge"],
                "code_challenge_method": "S256",
            }
        )
        tenant = settings.azure_ad_tenant_id.strip()
        url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?{query}"
        cookie = sign_state(
            {
                "state": payload["state"],
                "verifier": payload["verifier"],
                "nonce": payload["nonce"],
                "exp": payload["exp"],
            },
            settings.session_secret,
        )
        return url, cookie

    def complete(self, db: Session, *, code: str, state: str, cookie: str | None) -> TokenPair:
        payload = read_state(cookie, settings.session_secret)
        if payload is None or not _same(payload["state"], state):
            raise MicrosoftSignInRejected()
        identity = self.exchange_identity(code, payload["verifier"], payload["nonce"])
        admin = reconcile_microsoft_account(db, identity["oid"], identity["email"])
        return self._auth.issue_token_pair(db, admin)

    def exchange_identity(self, code: str, verifier: str, nonce: str) -> dict[str, str]:
        try:
            metadata = self._openid_configuration()
            token = self._fetch_token(metadata["token_endpoint"], code, verifier)
            id_token = token.get("id_token")
            if not isinstance(id_token, str) or not id_token:
                raise MicrosoftSignInRejected()
            jwks = httpx.get(metadata["jwks_uri"], timeout=10)
            jwks.raise_for_status()
            return validate_id_token(id_token, jwks.json(), nonce)
        except MicrosoftSignInRejected:
            raise
        except Exception as exc:
            logger.warning("Microsoft sign-in failed: %s", type(exc).__name__)
            raise MicrosoftSignInRejected() from exc

    def _openid_configuration(self) -> dict:
        if self._metadata is None:
            tenant = settings.azure_ad_tenant_id.strip()
            url = f"https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration"
            response = httpx.get(url, timeout=10)
            response.raise_for_status()
            self._metadata = response.json()
        return self._metadata

    def _fetch_token(self, token_endpoint: str, code: str, verifier: str) -> dict:
        client = OAuth2Client(
            client_id=settings.azure_ad_client_id,
            client_secret=settings.azure_ad_client_secret,
            token_endpoint_auth_method="client_secret_post",
        )
        return client.fetch_token(
            token_endpoint,
            grant_type="authorization_code",
            code=code,
            redirect_uri=settings.azure_ad_redirect_uri,
            code_verifier=verifier,
        )


def _same(left: str, right: str) -> bool:
    if len(left) != len(right):
        return False
    return hmac.compare_digest(left, right)
