from uuid import UUID

from flycatch_api.models.catalog import Contact, EmailOutbox
from flycatch_api.services.email_pipeline import deliver_pending


def test_submission_enqueues_mail_and_survives_send_failure(client, db, monkeypatch):
    sent: list[dict[str, str]] = []

    def boom(**kwargs):
        raise RuntimeError("smtp down")

    monkeypatch.setattr("flycatch_api.services.email_pipeline._smtp_send", boom)

    created = client.post(
        "/api/v1/public/contacts",
        json={
            "name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "phone": "555-0100",
            "contact_type": "GENERAL_ENQUIRY",
            "subject": "Hello",
        },
    )
    assert created.status_code == 201, created.text
    contact_id = created.json()["id"]
    db.expire_all()
    assert db.get(Contact, UUID(contact_id)) is not None

    row = db.query(EmailOutbox).one()
    assert row.kind == "contact"
    assert str(row.source_id) == contact_id
    assert row.status == "failed"
    assert "smtp down" in row.last_error

    def ok(**kwargs):
        sent.append(kwargs)

    deliver_pending(db, sender=ok)
    db.expire_all()
    retried = db.query(EmailOutbox).one()
    assert retried.status == "sent"
    assert sent
    assert sent[0]["recipient"]
    assert sent[0]["body"]
