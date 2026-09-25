from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from flycatch_api.config import settings
from flycatch_api.services.contact_notifications import notify_contact_submission


def _use_test_database(monkeypatch, db):
    testing_session = sessionmaker(bind=db.get_bind(), autoflush=False, autocommit=False)
    monkeypatch.setattr("flycatch_api.services.contact_notifications.SessionLocal", testing_session)


def _sign_in(client: TestClient, email: str, password: str):
    return client.post("/api/v1/admin/auth/sign-in", json={"email": email, "password": password})


def _admin(client, bootstrapped):
    tokens = _sign_in(client, bootstrapped["admin_email"], bootstrapped["admin_password"]).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _payload(**overrides):
    body = {
        "contact_type": "GET_A_QUOTE",
        "name": "Ada",
        "last_name": "Lovelace",
        "email": "ada@example.com",
        "phone_no": "+966507559022",
        "country": "Saudi Arabia",
        "details": "We need a quote.",
        "recaptchaToken": "token",
    }
    body.update(overrides)
    return body


def _allow_captcha(monkeypatch):
    monkeypatch.setattr("flycatch_api.services.catalog_service.verify_recaptcha", lambda _token: None)


def test_public_contact_rejects_failed_captcha(client, monkeypatch):
    monkeypatch.setattr(settings, "recaptcha_secret_key", "not-a-real-secret")
    response = client.post("/api/v1/public/contacts", json=_payload())
    assert response.status_code == 400
    assert response.json()["code"] == "captcha_failed"
    assert response.json()["message_key"] == "public.contacts.recaptcha.invalid"


def test_public_contact_verifies_recaptcha_with_google_and_saves(client, bootstrapped, monkeypatch):
    monkeypatch.setattr(settings, "recaptcha_secret_key", "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe")
    monkeypatch.setattr("flycatch_api.api.catalog.notify_contact_submission", lambda _contact_id: None)
    response = client.post(
        "/api/v1/public/contacts",
        json=_payload(email="verified@example.com", recaptchaToken="widget-token"),
    )
    assert response.status_code == 201, response.text
    saved = response.json()
    assert saved["email"] == "verified@example.com"
    headers = _admin(client, bootstrapped)
    detail = client.get(f"/api/v1/admin/contacts/{saved['id']}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["status"] == "draft"
    assert detail.json()["phone"] == "+966507559022"


def test_public_contact_saves_draft_and_keeps_admin_contract(client, bootstrapped, monkeypatch):
    _allow_captcha(monkeypatch)
    queued: list[str] = []
    monkeypatch.setattr(
        "flycatch_api.api.catalog.notify_contact_submission",
        lambda contact_id: queued.append(contact_id),
    )

    response = client.post(
        "/api/v1/public/contacts",
        json=_payload(company_name="Ignored", subject="Ignored"),
    )
    assert response.status_code == 201, response.text
    saved = response.json()
    assert saved["phone"] == "+966507559022"
    assert saved["country"] == "Saudi Arabia"
    assert saved["contact_type"] == "GET_A_QUOTE"
    assert saved["company_name"] == ""
    assert saved["subject"] == ""
    assert saved["contact_date"]
    assert "recaptchaToken" not in saved
    assert "status" not in saved
    assert queued == [saved["id"]]

    public = client.get("/api/v1/public/contacts")
    assert public.status_code == 200
    assert all(item["id"] != saved["id"] for item in public.json()["items"])

    headers = _admin(client, bootstrapped)
    listed = client.get("/api/v1/admin/contacts", headers=headers)
    assert listed.status_code == 200
    match = next(item for item in listed.json()["items"] if item["email"] == "ada@example.com")
    assert match["state"] == "draft"
    detail = client.get(f"/api/v1/admin/contacts/{saved['id']}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["phone"] == "+966507559022"
    assert detail.json()["status"] == "draft"


def test_partnership_requires_company_name(client, monkeypatch):
    _allow_captcha(monkeypatch)
    response = client.post("/api/v1/public/contacts", json=_payload(contact_type="PARTNERSHIP"))
    assert response.status_code == 422


def test_general_enquiry_stores_subject_only(client, monkeypatch):
    _allow_captcha(monkeypatch)
    monkeypatch.setattr("flycatch_api.api.catalog.notify_contact_submission", lambda _contact_id: None)
    response = client.post(
        "/api/v1/public/contacts",
        json=_payload(
            contact_type="GENERAL_ENQUIRY",
            email="general@example.com",
            subject="Hello",
            company_name="Should not stick",
        ),
    )
    assert response.status_code == 201, response.text
    saved = response.json()
    assert saved["subject"] == "Hello"
    assert saved["company_name"] == ""
    assert saved["contact_type"] == "GENERAL_ENQUIRY"


def test_contact_notification_sends_compiled_mail(client, bootstrapped, db, monkeypatch):
    _allow_captcha(monkeypatch)
    _use_test_database(monkeypatch, db)
    monkeypatch.setattr("flycatch_api.api.catalog.notify_contact_submission", lambda _contact_id: None)
    headers = _admin(client, bootstrapped)
    config = client.post(
        "/api/v1/admin/email-configuration",
        headers=headers,
        json={
            "smtp_default_from": "from@example.com",
            "smtp_default_reply_to": "reply@example.com",
            "smtp_admin_email": "admin@example.com",
            "status": "publish",
        },
    )
    assert config.status_code == 201, config.text
    admin_template = client.post(
        "/api/v1/admin/email-templates",
        headers=headers,
        json={
            "slug": "staff-alert",
            "type": "admin_notification",
            "subject": "New {{contact_type}}",
            "body": "<p>{{name}} {{phone_no}} {{details}}</p>",
            "status": "publish",
        },
    )
    user_template = client.post(
        "/api/v1/admin/email-templates",
        headers=headers,
        json={
            "slug": "user_notification",
            "type": "user_notification",
            "subject": "Thanks {{name}}",
            "body": "<p>{{applicationDate}}</p>",
            "status": "publish",
        },
    )
    assert admin_template.status_code == 201, admin_template.text
    assert user_template.status_code == 201, user_template.text

    created = client.post(
        "/api/v1/public/contacts",
        json=_payload(
            contact_type="PARTNERSHIP",
            email="partner@example.com",
            company_name="Acme",
            details="Hello <script>",
        ),
    )
    assert created.status_code == 201, created.text

    sent: list = []

    class FakeSMTP:
        def __init__(self, host, port, timeout=None):
            assert host == "smtp.example.com"
            assert port == 587

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def starttls(self):
            return None

        def login(self, username, password):
            assert username == "mailer"
            assert password == "secret"

        def send_message(self, message):
            sent.append(message)

    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(settings, "smtp_port", 587)
    monkeypatch.setattr(settings, "smtp_username", "mailer")
    monkeypatch.setattr(settings, "smtp_password", "secret")
    monkeypatch.setattr(settings, "smtp_use_tls", True)
    monkeypatch.setattr("flycatch_api.services.contact_notifications.smtplib.SMTP", FakeSMTP)

    notify_contact_submission(created.json()["id"])
    assert [message["To"] for message in sent] == ["admin@example.com", "partner@example.com"]
    assert sent[0]["Subject"] == "New PARTNERSHIP"
    assert "Ada" in sent[0].get_content()
    assert "+966507559022" in sent[0].get_content()
    assert "<script>" not in sent[0].get_content()
    assert sent[1]["Subject"] == "Thanks Ada"
    assert created.json()["contact_date"] in sent[1].get_content()
    assert created.json()["company_name"] == "Acme"

    class BrokenSMTP:
        def __init__(self, *_args, **_kwargs):
            raise OSError("smtp down")

    monkeypatch.setattr("flycatch_api.services.contact_notifications.smtplib.SMTP", BrokenSMTP)
    notify_contact_submission(created.json()["id"])


def test_contact_notification_failure_is_logged(db, monkeypatch):
    _use_test_database(monkeypatch, db)
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")

    class BrokenSMTP:
        def __init__(self, *_args, **_kwargs):
            raise OSError("smtp down")

    monkeypatch.setattr("flycatch_api.services.contact_notifications.smtplib.SMTP", BrokenSMTP)
    notify_contact_submission("00000000-0000-0000-0000-000000000000")
