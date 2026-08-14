import pytest
from fastapi.testclient import TestClient

from flycatch_api.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_stub_form_returns_501():
    response = client.post("/api/v1/public/forms/contact/submissions", json={"fields": {}})
    assert response.status_code == 501


def test_stub_newsletter_returns_501():
    response = client.post("/api/v1/public/newsletter/signup", json={"email": "a@example.com"})
    assert response.status_code == 501
