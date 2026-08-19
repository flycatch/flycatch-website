from fastapi.testclient import TestClient


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _create_blog(client, headers, **fields):
    payload = {
        "title": "Public Post",
        "slug": "public-post",
        "description": "Visible on the site",
        "body": "<p>Hello public</p>",
        "status": "publish",
        "reading_time": 3,
        "image_key": None,
        "image_alt": "Hero",
        "canonical_url": "https://example.com/blog/public-post",
        "facebook": "",
        "linkedin": "",
        "twitter": "",
        "instagram": "",
        "author_ids": [],
        "category_ids": [],
    }
    payload.update(fields)
    return client.post("/api/v1/admin/blogs", headers=headers, json=payload)


def test_admin_blogs_still_require_auth(client):
    response = client.get("/api/v1/admin/blogs")
    assert response.status_code == 401


def test_public_list_and_detail_are_unauthenticated(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    author = client.post(
        "/api/v1/admin/authors",
        headers=headers,
        json={"name": "Ada Lovelace", "designation": "Writer", "writer_image_keys": ["ada.png"]},
    )
    category = client.post(
        "/api/v1/admin/categories",
        headers=headers,
        json={"name": "Engineering"},
    )
    created = _create_blog(
        client,
        headers,
        author_ids=[author.json()["id"]],
        category_ids=[category.json()["id"]],
    )
    assert created.status_code == 201

    listed = client.get("/api/v1/public/blogs")
    assert listed.status_code == 200
    body = listed.json()
    assert body["per_page"] == 10
    assert body["total"] == 1
    item = body["items"][0]
    assert item["slug"] == "public-post"
    assert item["title"] == "Public Post"
    assert item["description"] == "Visible on the site"
    assert item["reading_time"] == 3
    assert item["authors"][0]["name"] == "Ada Lovelace"
    assert item["authors"][0]["designation"] == "Writer"
    assert item["authors"][0]["writer_image_keys"] == ["ada.png"]
    assert item["categories"][0]["name"] == "Engineering"
    assert "state" not in item
    assert "status" not in item

    detail = client.get("/api/v1/public/blogs/public-post")
    assert detail.status_code == 200
    post = detail.json()
    assert post["slug"] == "public-post"
    assert post["body"] == "<p>Hello public</p>"
    assert post["canonical_url"] == "https://example.com/blog/public-post"
    assert post["content_available_in"] == ["en"]
    assert "status" not in post
    assert "author_ids" not in post
    assert "category_ids" not in post


def test_drafts_are_hidden_from_public_list_and_detail(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    draft = _create_blog(client, headers, title="Hidden", slug="hidden-draft", status="draft")
    assert draft.status_code == 201
    published = _create_blog(client, headers, title="Live", slug="live-post", status="publish")
    assert published.status_code == 201

    listed = client.get("/api/v1/public/blogs")
    assert listed.status_code == 200
    slugs = [item["slug"] for item in listed.json()["items"]]
    assert "live-post" in slugs
    assert "hidden-draft" not in slugs

    missing = client.get("/api/v1/public/blogs/hidden-draft")
    assert missing.status_code == 404
    assert missing.json() == {"code": "not_found", "message_key": "public.blogs.not_found"}


def test_public_search_matches_published_only(client, bootstrapped):
    headers = _admin(client, bootstrapped)
    author = client.post(
        "/api/v1/admin/authors",
        headers=headers,
        json={"name": "Search Author"},
    )
    author_id = author.json()["id"]
    draft = _create_blog(
        client,
        headers,
        title="Draft Match",
        slug="draft-match",
        status="draft",
        author_ids=[author_id],
    )
    published = _create_blog(
        client,
        headers,
        title="Published Match",
        slug="published-match",
        status="publish",
        author_ids=[author_id],
    )
    other = _create_blog(
        client,
        headers,
        title="Other Live",
        slug="other-live",
        status="publish",
    )
    assert draft.status_code == 201
    assert published.status_code == 201
    assert other.status_code == 201

    search = client.get("/api/v1/public/blogs?q=Search Author")
    assert search.status_code == 200
    body = search.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "published-match"
