from datetime import UTC, datetime
from uuid import UUID

from fastapi.testclient import TestClient

from flycatch_api.models import Administrator, AdministratorRole


def _admin(client: TestClient, bootstrapped):
    tokens = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["admin_email"], "password": bootstrapped["admin_password"]},
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _editor(client: TestClient, bootstrapped):
    tokens = client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": bootstrapped["editor_email"], "password": bootstrapped["editor_password"]},
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _create_blog(client, headers, *, slug: str, status: str) -> str:
    created = client.post(
        "/api/v1/admin/blogs",
        headers=headers,
        json={"title": slug.replace("-", " "), "slug": slug, "status": status},
    )
    assert created.status_code == 201, created.text
    return created.json()["id"]


def test_bulk_unpublish_and_delete_blogs(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    published = _create_blog(client, headers, slug="bulk-live", status="publish")
    draft = _create_blog(client, headers, slug="bulk-draft", status="draft")

    denied = client.post(
        "/api/v1/admin/blogs/bulk-unpublish",
        json={"ids": [published]},
    )
    assert denied.status_code == 401

    unpublished = client.post(
        "/api/v1/admin/blogs/bulk-unpublish",
        headers=headers,
        json={"ids": [published, draft]},
    )
    assert unpublished.status_code == 200, unpublished.text
    assert unpublished.json()["count"] == 1
    published_detail = client.get(f"/api/v1/admin/blogs/{published}", headers=headers)
    draft_detail = client.get(f"/api/v1/admin/blogs/{draft}", headers=headers)
    assert published_detail.json()["status"] == "draft"
    assert draft_detail.json()["status"] == "draft"

    deleted = client.post(
        "/api/v1/admin/blogs/bulk-delete",
        headers=headers,
        json={"ids": [published, draft]},
    )
    assert deleted.status_code == 200
    assert deleted.json()["count"] == 2
    assert client.get(f"/api/v1/admin/blogs/{published}", headers=headers).status_code == 404


def test_bulk_actions_respect_permissions(client, bootstrapped, db):
    admin_headers = _admin(client, bootstrapped)
    blog_id = _create_blog(client, admin_headers, slug="limited-bulk", status="publish")
    custom = client.post(
        "/api/v1/admin/roles",
        headers=admin_headers,
        json={"name": "Blog Reader", "description": None, "permissions": ["blogs.read"]},
    )
    assert custom.status_code == 201
    editor = db.query(Administrator).filter_by(email=bootstrapped["editor_email"]).one()
    db.query(AdministratorRole).filter(AdministratorRole.administrator_id == editor.id).delete()
    db.add(
        AdministratorRole(
            administrator_id=editor.id,
            role_id=UUID(custom.json()["id"]),
            assigned_at=datetime.now(UTC),
            assigned_by="test",
        )
    )
    db.commit()

    limited = _editor(client, bootstrapped)
    unpublish = client.post(
        "/api/v1/admin/blogs/bulk-unpublish",
        headers=limited,
        json={"ids": [blog_id]},
    )
    assert unpublish.status_code == 403
    assert unpublish.json()["permission"] == "blogs.update"
    delete = client.post(
        "/api/v1/admin/blogs/bulk-delete",
        headers=limited,
        json={"ids": [blog_id]},
    )
    assert delete.status_code == 403
    assert delete.json()["permission"] == "blogs.delete"


def test_bulk_catalog_applications(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    first = client.post(
        "/api/v1/admin/applications",
        headers=headers,
        json={
            "name": "Ada",
            "last_name": "Lovelace",
            "email": "ada-bulk@example.com",
            "status": "publish",
        },
    )
    second = client.post(
        "/api/v1/admin/applications",
        headers=headers,
        json={
            "name": "Grace",
            "last_name": "Hopper",
            "email": "grace-bulk@example.com",
            "status": "publish",
        },
    )
    assert first.status_code == 201, first.text
    assert second.status_code == 201, second.text
    ids = [first.json()["id"], second.json()["id"]]
    unpublished = client.post(
        "/api/v1/admin/applications/bulk-unpublish",
        headers=headers,
        json={"ids": ids},
    )
    assert unpublished.status_code == 200, unpublished.text
    listed = client.get("/api/v1/admin/applications", headers=headers)
    states = {item["id"]: item["state"] for item in listed.json()["items"] if item["id"] in ids}
    assert set(states.values()) == {"draft"}
    deleted = client.post(
        "/api/v1/admin/applications/bulk-delete",
        headers=headers,
        json={"ids": ids},
    )
    assert deleted.status_code == 200
    listed = client.get("/api/v1/admin/applications", headers=headers)
    remaining = {item["id"] for item in listed.json()["items"]}
    assert remaining.isdisjoint(ids)
