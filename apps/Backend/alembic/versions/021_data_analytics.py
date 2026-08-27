"""Data analytics CMS entries.

Revision ID: 021
Revises: 020
Create Date: 2026-08-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "021"
down_revision: Union[str, None] = "020"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    op.create_table(
        "data_analytics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("page_name", sa.String(64), nullable=False),
        sa.Column("banner_title", sa.String(200), nullable=False),
        sa.Column("banner_image_key", sa.String(255), nullable=True),
        sa.Column("introduction_title", sa.String(200), nullable=False),
        sa.Column("introduction_first_paragraph", sa.Text(), nullable=False),
        sa.Column("introduction_second_paragraph", sa.Text(), nullable=False),
        sa.Column("accordion", sa.JSON(), nullable=False),
        sa.Column("offering_image_key", sa.String(255), nullable=True),
        sa.Column("offering_title", sa.String(200), nullable=False),
        sa.Column("offering_description", sa.Text(), nullable=False),
        sa.Column("faq_title", sa.String(200), nullable=False),
        sa.Column("faq_description", sa.Text(), nullable=False),
        sa.Column("faq_accordion", sa.JSON(), nullable=False),
        sa.Column("seo", sa.JSON(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("page_name", name="uq_data_analytics_page_name"),
    )


def downgrade() -> None:
    op.drop_table("data_analytics")
