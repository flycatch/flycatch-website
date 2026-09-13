from fastapi.testclient import TestClient

from flycatch_api.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_contact_form_rejects_invalid_payload():
    response = client.post("/api/v1/public/forms/contact/submissions", json={"fields": {}})
    assert response.status_code == 422
