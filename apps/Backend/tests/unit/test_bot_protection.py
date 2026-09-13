from flycatch_api.security.bot_protection import assert_human_submission
from flycatch_api.services.author_service import CatalogError


def test_recaptcha_required_when_secret_configured(monkeypatch):
    monkeypatch.setattr(
        "flycatch_api.security.bot_protection.settings.recaptcha_secret",
        "test-secret",
    )

    def fake_post(url, data, timeout):
        class Response:
            def json(self):
                return {"success": data.get("response") == "ok-token"}

        return Response()

    monkeypatch.setattr("flycatch_api.security.bot_protection.httpx.post", fake_post)

    try:
        assert_human_submission(website="", recaptcha_token="")
        raise AssertionError("expected rejection")
    except CatalogError as error:
        assert error.status_code == 422

    assert_human_submission(website="", recaptcha_token="ok-token")
