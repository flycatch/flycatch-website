from uuid import UUID

from flycatch_api.models.catalog import Contact


def test_public_contact_submission_persists_and_rejects_invalid(client, db):
    created = client.post(
        "/api/v1/public/contacts",
        json={
            "name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "phone": "+44 20 7946 0958",
            "contact_type": "GENERAL_ENQUIRY",
            "subject": "Partnership",
            "details": "Tell us more about analytics.",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["email"] == "ada@example.com"
    assert body["name"] == "Ada"
    db.expire_all()
    stored = db.get(Contact, UUID(body["id"]))
    assert stored is not None
    assert stored.phone == "+44 20 7946 0958"
    assert stored.contact_type == "GENERAL_ENQUIRY"

    assert client.get("/api/v1/public/contacts").status_code in {404, 405}

    invalid = client.post(
        "/api/v1/public/contacts",
        json={
            "name": "Ada",
            "last_name": "Lovelace",
            "email": "not-an-email",
            "phone": "123",
        },
    )
    assert invalid.status_code == 422

    missing = client.post(
        "/api/v1/public/contacts",
        json={"name": "Ada", "last_name": "Lovelace", "email": "ada2@example.com", "phone": ""},
    )
    assert missing.status_code == 422

    via_stub = client.post(
        "/api/v1/public/forms/contact/submissions",
        json={
            "name": "Grace",
            "last_name": "Hopper",
            "email": "grace@example.com",
            "phone": "555-0100",
            "contact_type": "GENERAL_ENQUIRY",
            "subject": "Careers",
        },
    )
    assert via_stub.status_code == 201, via_stub.text
    db.expire_all()
    assert db.get(Contact, UUID(via_stub.json()["id"])) is not None
