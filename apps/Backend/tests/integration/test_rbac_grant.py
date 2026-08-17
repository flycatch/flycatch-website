from flycatch_api.models import Administrator, AdministratorRole, Role
from flycatch_api.services.bootstrap_service import BootstrapService, BootstrapUser


def _bearer(client, email, password):
    tokens = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": email, "password": password},
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_administrator_can_view_draft_and_publish(client, bootstrapped, seeded_records):
    headers = _bearer(client, bootstrapped["admin_email"], bootstrapped["admin_password"])
    view = client.get("/api/v1/admin/pages/home", headers=headers)
    assert view.status_code == 200
    draft = client.patch(
        "/api/v1/admin/pages/home",
        headers=headers,
        json=view.json()["draft"],
    )
    assert draft.status_code == 200
    publish = client.post(
        "/api/v1/admin/publish",
        headers=headers,
        json={"type": "page", "slug": "home"},
    )
    assert publish.status_code == 200


def test_multi_role_union_can_publish(client, db, seeded_records):
    BootstrapService().run(
        db,
        BootstrapUser("admin1@example.com", "administrator-pass", "administrator"),
        BootstrapUser("both@example.com", "both-user-pass", "editor"),
        created_by="test",
    )
    user = db.query(Administrator).filter_by(email="both@example.com").one()
    admin_role = db.query(Role).filter_by(name="administrator").one()
    db.add(
        AdministratorRole(
            administrator_id=user.id,
            role_id=admin_role.id,
            assigned_at=user.created_at,
            assigned_by="test",
        )
    )
    db.commit()
    headers = _bearer(client, "both@example.com", "both-user-pass")
    session = client.get("/api/v1/admin/auth/session", headers=headers).json()
    assert set(session["roles"]) == {"administrator", "editor"}
    assert "records.publish" in session["permissions"]
    page = client.get("/api/v1/admin/pages/home", headers=headers)
    assert page.status_code == 200
    assert client.patch("/api/v1/admin/pages/home", headers=headers, json=page.json()["draft"]).status_code == 200
    assert (
        client.post(
            "/api/v1/admin/publish",
            headers=headers,
            json={"type": "page", "slug": "home"},
        ).status_code
        == 200
    )
