from datetime import UTC, datetime

from flycatch_api.config import settings
from flycatch_api.models import Administrator, Role

DOMAIN = settings.allowed_email_domain


def _headers(client, email, password):
    tokens = client.post(
        "/api/v1/admin/auth/sign-in", json={"email": email, "password": password}
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _admin(client, bootstrapped):
    return _headers(client, bootstrapped["admin_email"], bootstrapped["admin_password"])


def _role_id(db, name):
    return str(db.query(Role).filter(Role.name == name).one().id)


def _microsoft_user(db, email):
    # Mirrors reconcile_microsoft_account: active, no role.
    db.add(
        Administrator(
            email=email,
            password_hash=None,
            microsoft_oid="oid-" + email,
            is_active=True,
            created_at=datetime.now(UTC),
            created_by="microsoft",
        )
    )
    db.commit()
    return str(db.query(Administrator).filter(Administrator.email == email).one().id)


def test_list_filters_by_role_status_and_search(client, db, bootstrapped):
    headers = _admin(client, bootstrapped)
    _microsoft_user(db, f"new.hire@{DOMAIN}")
    body = client.get("/api/v1/admin/users", headers=headers).json()
    assert body["total"] == 3
    editor = _role_id(db, "editor")
    by_role = client.get(f"/api/v1/admin/users?role_id={editor}", headers=headers).json()
    assert [u["email"] for u in by_role["items"]] == [bootstrapped["editor_email"]]
    search = client.get("/api/v1/admin/users?q=new.hire", headers=headers).json()
    assert search["total"] == 1
    assert search["items"][0]["roles"] == []
    inactive = client.get("/api/v1/admin/users?status=inactive", headers=headers).json()
    assert inactive["total"] == 0


def test_pre_add_user_validates_domain_and_duplicates(client, db, bootstrapped):
    headers = _admin(client, bootstrapped)
    editor = _role_id(db, "editor")
    bad = client.post(
        "/api/v1/admin/users", headers=headers, json={"email": "x@other.com", "role_ids": []}
    )
    assert bad.status_code == 422
    created = client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={"email": f"Pre.Added@{DOMAIN}", "role_ids": [editor]},
    )
    assert created.status_code == 201
    assert created.json()["email"] == f"pre.added@{DOMAIN}"
    assert [r["name"] for r in created.json()["roles"]] == ["editor"]
    again = client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={"email": f"pre.added@{DOMAIN}", "role_ids": []},
    )
    assert again.status_code == 422
    unknown_role = client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={"email": f"other@{DOMAIN}", "role_ids": ["00000000-0000-0000-0000-000000000001"]},
    )
    assert unknown_role.status_code == 422


def test_update_roles_and_deactivate_revokes_sessions(client, db, bootstrapped):
    headers = _admin(client, bootstrapped)
    editor_headers = _headers(client, bootstrapped["editor_email"], bootstrapped["editor_password"])
    editor_user = db.query(Administrator).filter(
        Administrator.email == bootstrapped["editor_email"]
    ).one()
    admin_role = _role_id(db, "administrator")
    promoted = client.patch(
        f"/api/v1/admin/users/{editor_user.id}", headers=headers, json={"role_ids": [admin_role]}
    )
    assert promoted.status_code == 200
    assert [r["name"] for r in promoted.json()["roles"]] == ["administrator"]
    off = client.patch(
        f"/api/v1/admin/users/{editor_user.id}", headers=headers, json={"is_active": False}
    )
    assert off.status_code == 200 and off.json()["is_active"] is False
    session = client.get("/api/v1/admin/auth/session", headers=editor_headers)
    assert session.status_code == 401


def test_last_administrator_and_self_guards(client, db, bootstrapped):
    headers = _admin(client, bootstrapped)
    me = db.query(Administrator).filter(Administrator.email == bootstrapped["admin_email"]).one()
    self_off = client.patch(
        f"/api/v1/admin/users/{me.id}", headers=headers, json={"is_active": False}
    )
    assert self_off.status_code == 409
    assert self_off.json()["code"] == "self_protected"
    drop_role = client.patch(
        f"/api/v1/admin/users/{me.id}", headers=headers, json={"role_ids": []}
    )
    assert drop_role.status_code == 409
    # Another admin demoting the only administrator is blocked as the last administrator.
    editor_user = db.query(Administrator).filter(
        Administrator.email == bootstrapped["editor_email"]
    ).one()
    admin_role = _role_id(db, "administrator")
    client.patch(
        f"/api/v1/admin/users/{editor_user.id}", headers=headers, json={"role_ids": [admin_role]}
    )
    other = _headers(client, bootstrapped["editor_email"], bootstrapped["editor_password"])
    client.patch(f"/api/v1/admin/users/{me.id}", headers=other, json={"role_ids": []})
    blocked = client.patch(
        f"/api/v1/admin/users/{editor_user.id}", headers=other, json={"role_ids": []}
    )
    assert blocked.status_code == 409
    assert blocked.json()["code"] == "self_protected"


def test_bulk_assign_and_role_members(client, db, bootstrapped):
    headers = _admin(client, bootstrapped)
    first = _microsoft_user(db, f"a@{DOMAIN}")
    second = _microsoft_user(db, f"b@{DOMAIN}")
    editor = _role_id(db, "editor")
    added = client.post(
        "/api/v1/admin/users/bulk-assign",
        headers=headers,
        json={"role_id": editor, "user_ids": [first, second]},
    )
    assert added.status_code == 200 and added.json()["changed"] == 2
    again = client.post(
        "/api/v1/admin/users/bulk-assign",
        headers=headers,
        json={"role_id": editor, "user_ids": [first, second]},
    )
    assert again.json()["changed"] == 0
    members = client.get(f"/api/v1/admin/roles/{editor}/users", headers=headers).json()
    assert {m["email"] for m in members} >= {f"a@{DOMAIN}", f"b@{DOMAIN}"}
    removed = client.post(
        "/api/v1/admin/users/bulk-assign",
        headers=headers,
        json={"role_id": editor, "user_ids": [first], "action": "remove"},
    )
    assert removed.json()["changed"] == 1
    missing = client.post(
        "/api/v1/admin/users/bulk-assign",
        headers=headers,
        json={
            "role_id": editor,
            "user_ids": ["00000000-0000-0000-0000-000000000009"],
        },
    )
    assert missing.status_code == 404


def test_users_api_requires_roles_manage(client, bootstrapped):
    editor = _headers(client, bootstrapped["editor_email"], bootstrapped["editor_password"])
    assert client.get("/api/v1/admin/users", headers=editor).status_code == 403
    assert client.get("/api/v1/admin/users").status_code == 401
