def test_openapi_served():
    from fastapi.testclient import TestClient
    from flycatch_api.main import app

    client = TestClient(app)
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "Flycatch API" in response.json()["info"]["title"]
