"""Microsoft oid, nullable password, and default admin seed.

Revision ID: 027
Revises: 026
Create Date: 2026-09-30
"""

import secrets
from collections.abc import Sequence

import sqlalchemy as sa
from argon2 import PasswordHasher

from alembic import op
from flycatch_api.services.microsoft_seed import ensure_default_microsoft_admin

revision: str = "027"
down_revision: str | None = "026"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_OID_INDEX = "ix_administrators_microsoft_oid"


def _columns() -> dict[str, dict]:
    inspected = sa.inspect(op.get_bind()).get_columns("administrators")
    return {column["name"]: column for column in inspected}


def _index_names() -> set[str]:
    inspected = sa.inspect(op.get_bind()).get_indexes("administrators")
    return {index["name"] for index in inspected if index["name"]}


def upgrade() -> None:
    columns = _columns()
    if "microsoft_oid" not in columns:
        op.add_column(
            "administrators",
            sa.Column("microsoft_oid", sa.String(length=64), nullable=True),
        )
    if _OID_INDEX not in _index_names():
        op.create_index(_OID_INDEX, "administrators", ["microsoft_oid"], unique=True)
    columns = _columns()
    if columns["password_hash"]["nullable"] is not True:
        with op.batch_alter_table("administrators") as batch:
            batch.alter_column("password_hash", existing_type=sa.String(length=255), nullable=True)
    ensure_default_microsoft_admin(op.get_bind())


def downgrade() -> None:
    locked = PasswordHasher().hash(secrets.token_urlsafe(32))
    op.execute(
        sa.text(
            "UPDATE administrators SET password_hash = :pw_hash WHERE password_hash IS NULL"
        ).bindparams(pw_hash=locked)
    )
    if _OID_INDEX in _index_names():
        op.drop_index(_OID_INDEX, table_name="administrators")
    with op.batch_alter_table("administrators") as batch:
        if "microsoft_oid" in _columns():
            batch.drop_column("microsoft_oid")
        batch.alter_column("password_hash", existing_type=sa.String(length=255), nullable=False)
