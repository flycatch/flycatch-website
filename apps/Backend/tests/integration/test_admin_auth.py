from flycatch_api.models import AdminSession
from flycatch_api.security.session import hash_token


def test_sign_in_returns_token_pair(client, bootstrapped):
    response = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": bootstrapped["admin_password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["expires_in"] >= 1
    assert "administrator" in body["session"]["roles"]
    assert "records.publish" in body["session"]["permissions"]


def test_generic_failure_creates_no_session(client, bootstrapped, db):
    wrong = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": "not-the-password"},
    )
    unknown = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": "missing@example.com", "password": "administrator-pass"},
    )
    assert wrong.status_code == 401
    assert unknown.status_code == 401
    assert wrong.json() == unknown.json()
    assert wrong.json()["code"] == "invalid_credentials"
    assert wrong.json()["message_key"] == "admin.sign_in.error"
    assert db.query(AdminSession).count() == 0


def test_inactive_user_looks_like_unknown(client, bootstrapped, db):
    from flycatch_api.models import Administrator

    admin = db.query(Administrator).filter_by(email=bootstrapped["admin_email"]).one()
    admin.is_active = False
    db.commit()
    inactive = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": bootstrapped["admin_password"]},
    )
    unknown = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": "missing@example.com", "password": "administrator-pass"},
    )
    assert inactive.status_code == 401
    assert inactive.json() == unknown.json()
    assert db.query(AdminSession).count() == 0


def test_refresh_rotates_and_reuse_revokes_family(client, bootstrapped, db):
    first = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": bootstrapped["admin_password"]},
    ).json()
    rotated = client.post(
        "/api/v1/admin/auth/refresh",
        json={"refresh_token": first["refresh_token"]},
    )
    assert rotated.status_code == 200
    body = rotated.json()
    assert body["refresh_token"] != first["refresh_token"]
    reuse = client.post(
        "/api/v1/admin/auth/refresh",
        json={"refresh_token": first["refresh_token"]},
    )
    assert reuse.status_code == 401
    again = client.post(
        "/api/v1/admin/auth/refresh",
        json={"refresh_token": body["refresh_token"]},
    )
    assert again.status_code == 401
    assert all(row.revoked_at is not None for row in db.query(AdminSession).all())


def test_idle_and_absolute_expiry_reject_refresh(client, bootstrapped, db):
    from datetime import UTC, datetime, timedelta

    tokens = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": bootstrapped["admin_password"]},
    ).json()
    session = (
        db.query(AdminSession)
        .filter(AdminSession.refresh_token_hash == hash_token(tokens["refresh_token"]))
        .one()
    )
    session.idle_expires_at = datetime.now(UTC) - timedelta(seconds=1)
    db.commit()
    idle = client.post("/api/v1/admin/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert idle.status_code == 401

    tokens = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": bootstrapped["admin_password"]},
    ).json()
    session = (
        db.query(AdminSession)
        .filter(AdminSession.refresh_token_hash == hash_token(tokens["refresh_token"]))
        .one()
    )
    session.absolute_expires_at = datetime.now(UTC) - timedelta(seconds=1)
    db.commit()
    absolute = client.post(
        "/api/v1/admin/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert absolute.status_code == 401


def test_sign_out_revokes_and_session_is_401(client, bootstrapped):
    tokens = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": bootstrapped["admin_password"]},
    ).json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    out = client.post("/api/v1/admin/auth/sign-out", headers=headers)
    assert out.status_code == 204
    session = client.get("/api/v1/admin/auth/session", headers=headers)
    assert session.status_code == 401
