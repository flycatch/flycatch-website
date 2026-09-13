def test_newsletter_signup_handles_valid_duplicate_and_malformed(client):
    created = client.post("/api/v1/public/newsletter/signup", json={"email": "reader@example.com"})
    assert created.status_code == 201, created.text
    assert created.json()["email"] == "reader@example.com"
    assert created.json()["active"] is True

    via_canonical = client.post("/api/v1/public/subscriptions", json={"email": "second@example.com"})
    assert via_canonical.status_code == 201, via_canonical.text

    duplicate = client.post("/api/v1/public/newsletter/signup", json={"email": "reader@example.com"})
    assert duplicate.status_code == 422

    malformed = client.post("/api/v1/public/newsletter/signup", json={"email": "not-an-email"})
    assert malformed.status_code == 422
