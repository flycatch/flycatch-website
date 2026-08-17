from __future__ import annotations

from collections.abc import Generator
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.dialects.postgresql import ENUM, JSON, UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from flycatch_api.db import Base, get_db
from flycatch_api.main import app
from flycatch_api.models import Administrator, ManagedRecord, RecordType
from flycatch_api.services.bootstrap_service import BootstrapService, BootstrapUser


@compiles(UUID, "sqlite")
def _compile_uuid_sqlite(_type, _compiler, **_kw):
    return "CHAR(36)"


@compiles(ENUM, "sqlite")
def _compile_enum_sqlite(_type, _compiler, **_kw):
    return "VARCHAR(64)"


@compiles(JSON, "sqlite")
def _compile_json_sqlite(_type, _compiler, **_kw):
    return "JSON"


@pytest.fixture
def engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _fk_on(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db(engine) -> Generator[Session, None, None]:
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db, monkeypatch) -> Generator[TestClient, None, None]:
    from flycatch_api.services.publish_export import PublishExportService

    def _export_without_storage(self, session):
        return self.build_snapshot(session)

    monkeypatch.setattr(PublishExportService, "export_snapshot", _export_without_storage)

    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


SITE_SETTINGS = {
    "site_name": "Flycatch",
    "default_locale": "en",
    "locale_url_strategy": "unprefixed_default",
    "robots_policy": "index_public",
    "default_social_image_key": None,
    "canonical_origin": "http://localhost:8080",
}

HOME_PAGE = {
    "slug": "home",
    "seo": {
        "title": "Flycatch — Foundation",
        "description": "Production-ready SEO-first website foundation placeholder.",
        "canonical_path": "/",
        "indexable": True,
        "social_title": "Flycatch — Foundation",
        "social_description": "Production-ready SEO-first website foundation placeholder.",
        "social_image_key": None,
        "primary_heading": "Flycatch Foundation",
        "summary": "Foundation placeholder for the public website.",
        "structured_data_templates": ["organization", "web_page"],
    },
    "body": "This is the foundation home page.",
    "message_keys": {"summary": "page.home.summary", "body": "page.home.body"},
}


@pytest.fixture
def seeded_records(db, bootstrapped) -> None:
    now = datetime.now(UTC)
    actor = db.query(Administrator).filter_by(email=bootstrapped["admin_email"]).one().id
    db.add(
        ManagedRecord(
            type=RecordType.site_settings,
            slug="default",
            draft_payload=SITE_SETTINGS,
            published_payload=SITE_SETTINGS,
            draft_updated_at=now,
            draft_updated_by=actor,
            published_at=now,
            published_by=actor,
        )
    )
    db.add(
        ManagedRecord(
            type=RecordType.page,
            slug="home",
            draft_payload=HOME_PAGE,
            published_payload=HOME_PAGE,
            draft_updated_at=now,
            draft_updated_by=actor,
            published_at=now,
            published_by=actor,
        )
    )
    db.commit()


@pytest.fixture
def bootstrapped(db) -> dict[str, str]:
    BootstrapService().run(
        db,
        BootstrapUser(
            email="admin1@example.com",
            password="administrator-pass",
            role="administrator",
        ),
        BootstrapUser(
            email="editor1@example.com",
            password="editor-password",
            role="editor",
        ),
        created_by="test",
    )
    return {
        "admin_email": "admin1@example.com",
        "admin_password": "administrator-pass",
        "editor_email": "editor1@example.com",
        "editor_password": "editor-password",
    }


def sign_in(client: TestClient, email: str, password: str):
    return client.post(
        "/api/v1/admin/auth/sign-in",
        json={"email": email, "password": password},
    )


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
