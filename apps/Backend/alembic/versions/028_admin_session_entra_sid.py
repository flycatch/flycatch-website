"""Entra sid on admin sessions for front-channel logout.

Revision ID: 028
Revises: 027
Create Date: 2026-10-11
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "028"
down_revision: str | None = "027"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_INDEX = "ix_admin_sessions_entra_sid"


def upgrade() -> None:
    columns = {c["name"] for c in sa.inspect(op.get_bind()).get_columns("admin_sessions")}
    if "entra_sid" not in columns:
        op.add_column(
            "admin_sessions", sa.Column("entra_sid", sa.String(length=128), nullable=True)
        )
    indexes = {i["name"] for i in sa.inspect(op.get_bind()).get_indexes("admin_sessions")}
    if _INDEX not in indexes:
        op.create_index(_INDEX, "admin_sessions", ["entra_sid"])


def downgrade() -> None:
    op.drop_index(_INDEX, table_name="admin_sessions")
    op.drop_column("admin_sessions", "entra_sid")
