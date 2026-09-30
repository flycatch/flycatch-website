from datetime import UTC, datetime, timedelta

import pytest
from joserfc import jwt as jose_jwt
from joserfc.jwk import RSAKey

from flycatch_api.config import settings
from flycatch_api.models import Administrator, AdministratorRole
from flycatch_api.services.microsoft_auth import (
    MicrosoftSignInRejected,
    reconcile_microsoft_account,
    validate_id_token,
)


def _admin(
    db,
    email: str,
    *,
    oid: str | None = None,
    active: bool = True,
    password: str | None = "hash",
):
    row = Administrator(
        email=email,
        password_hash=password,
        microsoft_oid=oid,
        is_active=active,
        created_at=datetime.now(UTC),
        created_by="test",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def test_domain_rejection_changes_nothing(db):
    before = db.query(Administrator).count()
    with pytest.raises(MicrosoftSignInRejected):
        reconcile_microsoft_account(db, "oid-1", "person@example.com")
    assert db.query(Administrator).count() == before


def test_oid_match_reuses_account(db):
    existing = _admin(db, "person@flycatchtech.com", oid="oid-1")
    matched = reconcile_microsoft_account(db, "oid-1", "person@flycatchtech.com")
    assert matched.id == existing.id
    assert db.query(Administrator).count() == 1


def test_email_link_records_oid(db):
    existing = _admin(db, "person@flycatchtech.com", oid=None, password="kept-hash")
    matched = reconcile_microsoft_account(db, "oid-new", "Person@Flycatchtech.com")
    assert matched.id == existing.id
    assert matched.microsoft_oid == "oid-new"
    assert matched.password_hash == "kept-hash"
    assert db.query(Administrator).count() == 1


def test_oid_conflict_leaves_account_unchanged(db):
    existing = _admin(db, "person@flycatchtech.com", oid="oid-old")
    with pytest.raises(MicrosoftSignInRejected):
        reconcile_microsoft_account(db, "oid-new", "person@flycatchtech.com")
    db.refresh(existing)
    assert existing.microsoft_oid == "oid-old"


def test_inactive_match_stays_inactive(db):
    existing = _admin(db, "person@flycatchtech.com", oid="oid-1", active=False)
    with pytest.raises(MicrosoftSignInRejected):
        reconcile_microsoft_account(db, "oid-1", "person@flycatchtech.com")
    db.refresh(existing)
    assert existing.is_active is False
    assert db.query(Administrator).count() == 1


def test_first_time_create_has_no_roles(db):
    created = reconcile_microsoft_account(db, "oid-new", "new.person@flycatchtech.com")
    assert created.is_active is True
    assert created.password_hash is None
    assert created.microsoft_oid == "oid-new"
    assert created.email == "new.person@flycatchtech.com"
    assert db.query(AdministratorRole).filter_by(administrator_id=created.id).count() == 0


def test_validate_id_token_requires_nonce_audience_and_issuer(monkeypatch):
    monkeypatch.setattr(settings, "azure_ad_tenant_id", "tenant-id")
    monkeypatch.setattr(settings, "azure_ad_client_id", "client-id")
    key = RSAKey.generate_key(2048)
    jwks = {"keys": [key.as_dict(private=False)]}
    now = datetime.now(UTC)

    def token(**claims):
        payload = {
            "iss": "https://login.microsoftonline.com/tenant-id/v2.0",
            "aud": "client-id",
            "exp": int((now + timedelta(minutes=5)).timestamp()),
            "nonce": "nonce-1",
            "oid": "oid-1",
            "email": "person@flycatchtech.com",
        }
        payload.update(claims)
        return jose_jwt.encode({"alg": "RS256"}, payload, key)

    identity = validate_id_token(token(), jwks, "nonce-1")
    assert identity == {"oid": "oid-1", "email": "person@flycatchtech.com"}
    with pytest.raises(MicrosoftSignInRejected):
        validate_id_token(token(nonce="other"), jwks, "nonce-1")
    with pytest.raises(MicrosoftSignInRejected):
        validate_id_token(token(aud="other-client"), jwks, "nonce-1")
    with pytest.raises(MicrosoftSignInRejected):
        validate_id_token(
            token(iss="https://login.microsoftonline.com/other/v2.0"),
            jwks,
            "nonce-1",
        )


def test_inactive_email_without_oid_is_not_linked(db):
    existing = _admin(db, "person@flycatchtech.com", oid=None, active=False)
    with pytest.raises(MicrosoftSignInRejected):
        reconcile_microsoft_account(db, "oid-new", "person@flycatchtech.com")
    db.refresh(existing)
    assert existing.microsoft_oid is None
    assert existing.is_active is False

