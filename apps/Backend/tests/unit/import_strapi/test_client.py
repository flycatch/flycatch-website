from __future__ import annotations

import json
from pathlib import Path

import httpx

from flycatch_api.import_strapi.client import StrapiClient, unwrap_entity

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures" / "strapi"


class _Transport(httpx.MockTransport):
    def __init__(self, routes: dict[str, dict]):
        self.routes = routes

        def handler(request: httpx.Request) -> httpx.Response:
            path = request.url.path
            # strip leading /api if present
            key = path.lstrip("/")
            if key.startswith("api/"):
                key = key[4:]
            # collection is first segment
            collection = key.split("?", 1)[0].strip("/")
            # base_url already includes /api so path is /blogs
            collection = request.url.path.strip("/")
            payload = self.routes.get(collection)
            if payload is None:
                return httpx.Response(404, json={"error": "not found"})
            return httpx.Response(200, json=payload)

        super().__init__(handler)


def test_unwrap_entity():
    raw = {"id": 5, "attributes": {"name": "Eng"}}
    assert unwrap_entity(raw) == {"id": 5, "name": "Eng"}
    assert unwrap_entity({"id": 1, "name": "flat"}) == {"id": 1, "name": "flat"}


def test_list_all_paginates(monkeypatch):
    page1 = {
        "data": [{"id": 1, "attributes": {"name": "A"}}],
        "meta": {"pagination": {"page": 1, "pageSize": 1, "pageCount": 2, "total": 2}},
    }
    page2 = {
        "data": [{"id": 2, "attributes": {"name": "B"}}],
        "meta": {"pagination": {"page": 2, "pageSize": 1, "pageCount": 2, "total": 2}},
    }
    calls: list[int] = []

    def handler(request: httpx.Request) -> httpx.Response:
        page = int(request.url.params.get("pagination[page]", "1"))
        calls.append(page)
        return httpx.Response(200, json=page1 if page == 1 else page2)

    transport = httpx.MockTransport(handler)
    client = StrapiClient("https://cms.example/api", "token")
    client._client = httpx.Client(base_url="https://cms.example/api/", transport=transport)
    try:
        items = client.list_all("categories", page_size=1)
        assert [i["name"] for i in items] == ["A", "B"]
        assert calls == [1, 2]
    finally:
        client.close()


def test_list_all_accepts_bare_list_payload():
    payload = [{"id": 1, "attributes": {"name": "A"}}, {"id": 2, "attributes": {"name": "B"}}]

    transport = httpx.MockTransport(lambda request: httpx.Response(200, json=payload))
    client = StrapiClient("https://cms.example/api", "token")
    client._client = httpx.Client(base_url="https://cms.example/api/", transport=transport)
    try:
        items = client.list_all("client-testimonials")
        assert [i["name"] for i in items] == ["A", "B"]
    finally:
        client.close()


def test_list_all_reads_fixture_shape():
    payload = json.loads((FIXTURES / "blogs.json").read_text())
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json=payload))
    client = StrapiClient("https://cms.example/api", "token")
    client._client = httpx.Client(base_url="https://cms.example/api/", transport=transport)
    try:
        items = client.list_all("blogs")
        assert len(items) == 1
        assert items[0]["slug"] == "hello-world"
        assert items[0]["id"] == 1
    finally:
        client.close()
