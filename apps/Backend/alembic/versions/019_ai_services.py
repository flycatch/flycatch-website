"""AI services CMS entries.

Revision ID: 019
Revises: 018
Create Date: 2026-08-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "019"
down_revision: Union[str, None] = "018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    op.create_table(
        "ai_services",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("banner_title", sa.String(200), nullable=False),
        sa.Column("banner_image_key", sa.String(255), nullable=True),
        sa.Column("introduction_title", sa.String(200), nullable=False),
        sa.Column("introduction_description", sa.Text(), nullable=False),
        sa.Column("solutions_title", sa.String(200), nullable=False),
        sa.Column("solutions_description", sa.Text(), nullable=False),
        sa.Column("industry_title", sa.String(200), nullable=False),
        sa.Column("industry_description", sa.Text(), nullable=False),
        sa.Column("industry_items", sa.JSON(), nullable=False),
        sa.Column("ai_expertise_title", sa.String(200), nullable=False),
        sa.Column("ai_expertise_image_key", sa.String(255), nullable=True),
        sa.Column("ai_expertise_accordion", sa.JSON(), nullable=False),
        sa.Column("ai_expertise_accordion_description", sa.Text(), nullable=False),
        sa.Column("faq_title", sa.String(200), nullable=False),
        sa.Column("faq_description", sa.Text(), nullable=False),
        sa.Column("seo", sa.JSON(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug", name="uq_ai_services_slug"),
    )
    op.create_table(
        "ai_service_solutions",
        sa.Column("ai_service_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ai_services.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("solution_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("solutions.id"), primary_key=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.UniqueConstraint("ai_service_id", "solution_id", name="uq_ai_service_solution"),
    )


def downgrade() -> None:
    op.drop_table("ai_service_solutions")
    op.drop_table("ai_services")
