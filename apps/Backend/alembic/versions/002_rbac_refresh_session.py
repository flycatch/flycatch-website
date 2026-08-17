"""RBAC roles, permissions, and refresh-session columns.

Revision ID: 002
Revises: 001
Create Date: 2026-08-14
"""

import secrets
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from argon2 import PasswordHasher
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_MICROSOFT_ADMIN_COLUMNS = (
    "microsoft_oid",
    "tenant_id",
    "role",
    "updated_at",
    "updated_by",
)
_MICROSOFT_SESSION_COLUMNS = (
    "microsoft_access_expires_at",
    "microsoft_refresh_token_encrypted",
)


def _inspector():
    return sa.inspect(op.get_bind())


def _table_names() -> set[str]:
    return set(_inspector().get_table_names())


def _column_names(table: str) -> set[str]:
    return {column["name"] for column in _inspector().get_columns(table)}


def _index_names(table: str) -> set[str]:
    return {index["name"] for index in _inspector().get_indexes(table) if index["name"]}


def upgrade() -> None:
    tables = _table_names()
    if "roles" not in tables:
        op.create_table(
            "roles",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("name", sa.String(64), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.UniqueConstraint("name", name="uq_roles_name"),
        )
        op.create_index("ix_roles_name", "roles", ["name"], unique=True)

    permission_enum = postgresql.ENUM(
        "records.view",
        "drafts.save",
        "records.publish",
        name="permission_name",
        create_type=False,
    )
    permission_enum.create(op.get_bind(), checkfirst=True)

    if "role_permissions" not in tables:
        op.create_table(
            "role_permissions",
            sa.Column("role_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("roles.id"), nullable=False),
            sa.Column("permission", permission_enum, nullable=False),
            sa.PrimaryKeyConstraint("role_id", "permission", name="pk_role_permissions"),
        )

    if "administrator_roles" not in tables:
        op.create_table(
            "administrator_roles",
            sa.Column(
                "administrator_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("administrators.id"),
                nullable=False,
            ),
            sa.Column("role_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("roles.id"), nullable=False),
            sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("assigned_by", sa.String(255), nullable=False),
            sa.PrimaryKeyConstraint("administrator_id", "role_id", name="pk_administrator_roles"),
        )

    _reconcile_administrators()
    _reconcile_admin_sessions()


def _reconcile_administrators() -> None:
    columns = _column_names("administrators")
    if "password_hash" not in columns:
        op.add_column("administrators", sa.Column("password_hash", sa.String(255), nullable=True))
        locked = PasswordHasher().hash(secrets.token_urlsafe(32))
        op.execute(
            sa.text("UPDATE administrators SET password_hash = :pw_hash WHERE password_hash IS NULL").bindparams(
                pw_hash=locked
            )
        )
        op.alter_column("administrators", "password_hash", nullable=False)

    indexes = _index_names("administrators")
    if "ix_administrators_microsoft_oid" in indexes:
        op.drop_index("ix_administrators_microsoft_oid", table_name="administrators")

    columns = _column_names("administrators")
    for column in _MICROSOFT_ADMIN_COLUMNS:
        if column in columns:
            op.drop_column("administrators", column)


def _reconcile_admin_sessions() -> None:
    columns = _column_names("admin_sessions")
    if "refresh_token_hash" not in columns:
        op.add_column("admin_sessions", sa.Column("refresh_token_hash", sa.String(255), nullable=True))
    if "family_id" not in columns:
        op.add_column("admin_sessions", sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=True))

    columns = _column_names("admin_sessions")
    if "token_hash" in columns:
        op.execute("UPDATE admin_sessions SET refresh_token_hash = token_hash WHERE refresh_token_hash IS NULL")
    op.execute("UPDATE admin_sessions SET family_id = gen_random_uuid() WHERE family_id IS NULL")
    op.alter_column("admin_sessions", "refresh_token_hash", nullable=False)
    op.alter_column("admin_sessions", "family_id", nullable=False)

    indexes = _index_names("admin_sessions")
    if "ix_admin_sessions_refresh_token_hash" not in indexes:
        op.create_index("ix_admin_sessions_refresh_token_hash", "admin_sessions", ["refresh_token_hash"])
    if "ix_admin_sessions_token_hash" in indexes:
        op.drop_index("ix_admin_sessions_token_hash", table_name="admin_sessions")
    if "token_hash" in columns:
        op.drop_column("admin_sessions", "token_hash")

    columns = _column_names("admin_sessions")
    for column in _MICROSOFT_SESSION_COLUMNS:
        if column in columns:
            op.drop_column("admin_sessions", column)


def downgrade() -> None:
    op.add_column("admin_sessions", sa.Column("token_hash", sa.String(255), nullable=True))
    op.execute("UPDATE admin_sessions SET token_hash = refresh_token_hash")
    op.alter_column("admin_sessions", "token_hash", nullable=False)
    op.create_index("ix_admin_sessions_token_hash", "admin_sessions", ["token_hash"])
    op.drop_index("ix_admin_sessions_refresh_token_hash", table_name="admin_sessions")
    op.drop_column("admin_sessions", "family_id")
    op.drop_column("admin_sessions", "refresh_token_hash")
    op.drop_table("administrator_roles")
    op.drop_table("role_permissions")
    op.drop_table("roles")
    op.execute("DROP TYPE IF EXISTS permission_name")
