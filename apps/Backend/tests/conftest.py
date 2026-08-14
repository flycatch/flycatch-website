import pytest
from fastapi.testclient import TestClient

from flycatch_api.main import app

@pytest.fixture
def client():
    return TestClient(app)
