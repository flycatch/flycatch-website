import importlib.util
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import sqlalchemy as sa
from alembic.operations import Operations
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine

REVISION = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "027_microsoft_oid_and_default_admin.py"
)


def _load_revision():
    spec = importlib.util.spec_from_file_location("revision_027", REVISION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _prepare(connection) -> str:
    connection.execute(
        sa.text(
            """
            CREATE TABLE administrators (
                id CHAR(36) PRIMARY KEY,
                email VARCHAR(320) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                is_active BOOLEAN NOT NULL,
                created_at DATETIME NOT NULL,
                created_by VARCHAR(255) NOT NULL
            )
            """
        )
    )
    connection.execute(
        sa.text(
            """
            CREATE TABLE roles (
                id CHAR(36) PRIMARY KEY,
                name VARCHAR(64) NOT NULL UNIQUE,
                created_at DATETIME NOT NULL
            )
            """
        )
    )
    connection.execute(
        sa.text(
            """
            CREATE TABLE administrator_roles (
                administrator_id CHAR(36) NOT NULL,
                role_id CHAR(36) NOT NULL,
                assigned_at DATETIME NOT NULL,
                assigned_by VARCHAR(255) NOT NULL,
                PRIMARY KEY (administrator_id, role_id)
            )
            """
        )
    )
    now = datetime.now(UTC).isoformat()
    role_id = str(uuid4())
    admin_id = str(uuid4())
    connection.execute(
        sa.text(
            "INSERT INTO roles (id, name, created_at) VALUES (:id, 'administrator', :created_at)"
        ),
        {"id": role_id, "created_at": now},
    )
    connection.execute(
        sa.text(
            """
            INSERT INTO administrators (id, email, password_hash, is_active, created_at, created_by)
            VALUES (
                :id, 'liju@flycatchtech.com', :password_hash, :is_active, :created_at, 'bootstrap'
            )
            """
        ),
        {
            "id": admin_id,
            "password_hash": "kept-hash",
            "is_active": False,
            "created_at": now,
        },
    )
    return admin_id


def test_revision_027_upgrade_is_idempotent_and_downgrades():
    revision = _load_revision()
    engine = create_engine("sqlite://")
    with engine.begin() as connection:
        _prepare(connection)
        context = MigrationContext.configure(connection)
        with Operations.context(context):
            revision.upgrade()
            revision.upgrade()
        row = connection.execute(
            sa.text(
                """
                SELECT a.password_hash, a.is_active, a.microsoft_oid, COUNT(ar.role_id) AS roles
                FROM administrators a
                LEFT JOIN administrator_roles ar ON ar.administrator_id = a.id
                WHERE a.email = 'liju@flycatchtech.com'
                GROUP BY a.password_hash, a.is_active, a.microsoft_oid
                """
            )
        ).one()
        assert row.password_hash == "kept-hash"
        assert row.is_active in (1, True)
        assert row.roles == 1
        counted = connection.execute(sa.text("SELECT COUNT(*) FROM administrators"))
        admin_count = counted.scalar_one()
        assert admin_count == 1
        inspected = sa.inspect(connection).get_columns("administrators")
        columns = {column["name"]: column for column in inspected}
        assert columns["microsoft_oid"]["nullable"] is True
        assert columns["password_hash"]["nullable"] is True
        indexes = sa.inspect(connection).get_indexes("administrators")
        oid_index = next(
            index for index in indexes if index["name"] == "ix_administrators_microsoft_oid"
        )
        assert oid_index["unique"]

        connection.execute(sa.text("DELETE FROM administrator_roles"))
        connection.execute(sa.text("DELETE FROM administrators"))
        with Operations.context(context):
            revision.upgrade()
        created = connection.execute(
            sa.text(
                """
                SELECT password_hash, is_active, created_by
                FROM administrators
                WHERE email = 'liju@flycatchtech.com'
                """
            )
        ).one()
        assert created.password_hash is None
        assert created.is_active in (1, True)
        assert created.created_by == "microsoft-seed"
        counted_roles = connection.execute(sa.text("SELECT COUNT(*) FROM administrator_roles"))
        role_count = counted_roles.scalar_one()
        assert role_count == 1

        with Operations.context(context):
            revision.downgrade()
        names = {column["name"] for column in sa.inspect(connection).get_columns("administrators")}
        assert "microsoft_oid" not in names
        password = next(
            column
            for column in sa.inspect(connection).get_columns("administrators")
            if column["name"] == "password_hash"
        )
        assert password["nullable"] is False
        stored = connection.execute(
            sa.text(
                "SELECT password_hash FROM administrators WHERE email = 'liju@flycatchtech.com'"
            )
        ).scalar_one()
        assert stored
    engine.dispose()
