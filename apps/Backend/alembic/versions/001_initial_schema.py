"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-08-14
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "administrators",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(255), nullable=False),
    )
    op.create_index("ix_administrators_email", "administrators", ["email"], unique=True)

    op.create_table(
        "admin_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("administrator_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("administrators.id"), nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("idle_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("absolute_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_admin_sessions_token_hash", "admin_sessions", ["token_hash"])

    op.create_table(
        "managed_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("type", sa.Enum("site_settings", "page", name="recordtype"), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("draft_payload", postgresql.JSON(), nullable=True),
        sa.Column("published_payload", postgresql.JSON(), nullable=True),
        sa.Column("draft_updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("draft_updated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("administrators.id"), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("administrators.id"), nullable=True),
        sa.UniqueConstraint("type", "slug", name="uq_managed_record_type_slug"),
    )


def downgrade() -> None:
    op.drop_table("managed_records")
    op.drop_table("admin_sessions")
    op.drop_table("administrators")
    op.execute("DROP TYPE IF EXISTS recordtype")
