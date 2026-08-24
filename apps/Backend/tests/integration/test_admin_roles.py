from datetime import UTC, datetime
from uuid import UUID

from fastapi.testclient import TestClient

from flycatch_api.models import Administrator, AdministratorRole, Role
from flycatch_api.services.role_service import ACTIONS


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin_headers(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _editor_headers(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["editor_email"], bootstrapped["editor_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_editor_cannot_list_roles(client, bootstrapped):
    headers = _editor_headers(client, bootstrapped)
    response = client.get("/api/v1/admin/roles", headers=headers)
    assert response.status_code == 403
    assert response.json()["code"] == "permission_denied"
    assert response.json()["permission"] == "roles.manage"


def test_list_roles_paginates_and_searches(client, bootstrapped, db):
    headers = _admin_headers(client, bootstrapped)
    for index in range(6):
        created = client.post(
            "/api/v1/admin/roles",
            headers=headers,
            json={
                "name": f"reviewer-{index}",
                "description": "Custom reviewer",
                "permissions": ["site_settings.read"],
            },
        )
        assert created.status_code == 201
    page_one = client.get("/api/v1/admin/roles?page=1&per_page=5", headers=headers)
    assert page_one.status_code == 200
    body = page_one.json()
    assert body["per_page"] == 5
    assert body["page"] == 1
    assert body["total"] >= 8
    assert len(body["items"]) == 5
    page_two = client.get("/api/v1/admin/roles?page=2&per_page=5", headers=headers)
    assert page_two.status_code == 200
    assert page_two.json()["items"]
    search = client.get("/api/v1/admin/roles?q=reviewer-1", headers=headers)
    assert search.status_code == 200
    assert search.json()["total"] == 1
    assert search.json()["items"][0]["name"] == "reviewer-1"


def test_create_edit_and_delete_role(client, bootstrapped, seeded_records):
    headers = _admin_headers(client, bootstrapped)
    catalogue = client.get("/api/v1/admin/roles/catalogue", headers=headers)
    assert catalogue.status_code == 200
    resources = {item["id"] for item in catalogue.json()["resources"]}
    assert "site_settings" in resources
    assert "page.home" in resources
    assert "home" in resources
    assert "blogs" in resources
    assert "case_studies" in resources
    assert "industries" in resources
    assert "case_study_categories" in resources
    assert "technologies" in resources
    assert "authors" in resources
    assert "categories" in resources
    assert "client_logos" in resources
    assert "client_testimonials" in resources
    assert catalogue.json()["actions"] == list(ACTIONS)

    created = client.post(
        "/api/v1/admin/roles",
        headers=headers,
        json={
            "name": "Publisher",
            "description": "Can publish home",
            "permissions": ["page.home.read", "page.home.update", "page.home.publish"],
        },
    )
    assert created.status_code == 201
    role = created.json()
    assert role["name"] == "Publisher"
    assert "page.home.publish" in role["permissions"]
    assert "records.publish" in role["permissions"]
    assert "records.view" in role["permissions"]
    assert "drafts.save" in role["permissions"]
    assert role["user_count"] == 0
    assert role["is_system"] is False

    loaded = client.get(f"/api/v1/admin/roles/{role['id']}", headers=headers)
    assert loaded.status_code == 200
    assert loaded.json()["permissions"] == role["permissions"]

    updated = client.patch(
        f"/api/v1/admin/roles/{role['id']}",
        headers=headers,
        json={
            "name": "Publisher",
            "description": "Updated",
            "permissions": ["page.home.read"],
        },
    )
    assert updated.status_code == 200
    assert updated.json()["description"] == "Updated"
    assert "page.home.publish" not in updated.json()["permissions"]
    assert "records.publish" not in updated.json()["permissions"]

    blogs_only = client.post(
        "/api/v1/admin/roles",
        headers=headers,
        json={
            "name": "Blog Reader",
            "description": None,
            "permissions": ["blogs.read"],
        },
    )
    assert blogs_only.status_code == 201
    assert "blogs.read" in blogs_only.json()["permissions"]
    assert "records.view" in blogs_only.json()["permissions"]

    deleted = client.delete(f"/api/v1/admin/roles/{role['id']}", headers=headers)
    assert deleted.status_code == 204
    missing = client.get(f"/api/v1/admin/roles/{role['id']}", headers=headers)
    assert missing.status_code == 404


def test_matrix_permissions_enforced_on_content_apis(client, bootstrapped, db):
    headers = _admin_headers(client, bootstrapped)
    custom = client.post(
        "/api/v1/admin/roles",
        headers=headers,
        json={
            "name": "Limited Blogs",
            "description": None,
            "permissions": ["blogs.read"],
        },
    )
    assert custom.status_code == 201
    limited_id = UUID(custom.json()["id"])

    editor = db.query(Administrator).filter_by(email=bootstrapped["editor_email"]).one()
    db.query(AdministratorRole).filter(AdministratorRole.administrator_id == editor.id).delete()
    db.add(
        AdministratorRole(
            administrator_id=editor.id,
            role_id=limited_id,
            assigned_at=datetime.now(UTC),
            assigned_by="test",
        )
    )
    db.commit()

    limited_headers = _editor_headers(client, bootstrapped)
    allowed = client.get("/api/v1/admin/blogs", headers=limited_headers)
    assert allowed.status_code == 200
    denied_create = client.post(
        "/api/v1/admin/blogs",
        headers=limited_headers,
        json={
            "title": "Nope",
            "slug": "nope",
            "status": "draft",
            "author_ids": [],
            "category_ids": [],
        },
    )
    assert denied_create.status_code == 403
    assert denied_create.json()["permission"] == "blogs.create"
    denied_homes = client.get("/api/v1/admin/homes", headers=limited_headers)
    assert denied_homes.status_code == 403
    assert denied_homes.json()["permission"] == "home.read"


def test_duplicate_name_and_protected_system_roles(client, bootstrapped, db):
    headers = _admin_headers(client, bootstrapped)
    duplicate = client.post(
        "/api/v1/admin/roles",
        headers=headers,
        json={"name": "Editor", "description": None, "permissions": ["site_settings.read"]},
    )
    assert duplicate.status_code == 422
    name_error = duplicate.json()["detail"]["fields"]["name"]["message_key"]
    assert name_error == "admin.roles.name.duplicate"

    system = db.query(Role).filter_by(name="administrator").one()
    renamed = client.patch(
        f"/api/v1/admin/roles/{system.id}",
        headers=headers,
        json={"name": "super-admin", "description": "nope", "permissions": ["site_settings.read"]},
    )
    assert renamed.status_code == 409
    assert renamed.json()["code"] == "system_role"

    deleted = client.delete(f"/api/v1/admin/roles/{system.id}", headers=headers)
    assert deleted.status_code == 409
    assert deleted.json()["code"] == "system_role"


def test_cannot_delete_role_in_use(client, bootstrapped, db):
    headers = _admin_headers(client, bootstrapped)
    created = client.post(
        "/api/v1/admin/roles",
        headers=headers,
        json={"name": "assigned", "description": None, "permissions": ["site_settings.read"]},
    )
    role_id = created.json()["id"]
    admin = db.query(Administrator).filter_by(email=bootstrapped["admin_email"]).one()
    role = db.query(Role).filter_by(id=UUID(role_id)).one()
    db.add(
        AdministratorRole(
            administrator_id=admin.id,
            role_id=role.id,
            assigned_at=admin.created_at,
            assigned_by="test",
        )
    )
    db.commit()
    deleted = client.delete(f"/api/v1/admin/roles/{role_id}", headers=headers)
    assert deleted.status_code == 409
    assert deleted.json()["code"] == "role_in_use"


def test_administrator_without_stored_manage_grant_can_list_roles(client, bootstrapped, db):
    from flycatch_api.models import RolePermission

    role = db.query(Role).filter_by(name="administrator").one()
    db.query(RolePermission).filter(
        RolePermission.role_id == role.id,
        RolePermission.permission == "roles.manage",
    ).delete()
    db.commit()
    headers = _admin_headers(client, bootstrapped)
    listed = client.get("/api/v1/admin/roles", headers=headers)
    assert listed.status_code == 200


def test_administrator_keeps_roles_manage(client, bootstrapped, db):
    headers = _admin_headers(client, bootstrapped)
    system = db.query(Role).filter_by(name="administrator").one()
    updated = client.patch(
        f"/api/v1/admin/roles/{system.id}",
        headers=headers,
        json={
            "name": "administrator",
            "description": "Full access to administration",
            "permissions": ["site_settings.read"],
        },
    )
    assert updated.status_code == 200
    assert "roles.manage" in updated.json()["permissions"]
    assert "records.view" in updated.json()["permissions"]
