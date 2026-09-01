"""Contacts, downloads, Flycatch Saudi Arabia, and subscriptions.

Revision ID: 026
Revises: 025
Create Date: 2026-09-01
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "026"
down_revision: Union[str, None] = "025"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM("draft", "publish", name="content_status", create_type=False)
    op.create_table(
        "contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("last_name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("country", sa.String(120), nullable=False),
        sa.Column("phone", sa.String(40), nullable=False),
        sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("contact_date", sa.Date(), nullable=True),
        sa.Column("details", sa.Text(), nullable=False),
        sa.Column("contact_type", sa.String(120), nullable=False),
        sa.Column("company_name", sa.String(200), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "downloads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("company", sa.String(200), nullable=False),
        sa.Column("file_key", sa.String(255), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "flycatch_saudi_arabia",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("banner_title", sa.String(200), nullable=False),
        sa.Column("service_section", sa.JSON(), nullable=False),
        sa.Column("banner_explore_text", sa.String(200), nullable=False),
        sa.Column("services_title", sa.String(200), nullable=False),
        sa.Column("video_key", sa.String(255), nullable=True),
        sa.Column("seo", sa.JSON(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_subscriptions_email", "subscriptions", ["email"])


def downgrade() -> None:
    op.drop_index("ix_subscriptions_email", table_name="subscriptions")
    op.drop_table("subscriptions")
    op.drop_table("flycatch_saudi_arabia")
    op.drop_table("downloads")
    op.drop_table("contacts")
