"""CMS catalog tables.

Revision ID: 025
Revises: 024
Create Date: 2026-08-31
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "025"
down_revision: Union[str, None] = "024"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM("draft", "publish", name="content_status", create_type=False)
    op.create_table(
        "applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("resume_key", sa.String(255), nullable=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("last_name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(40), nullable=False),
        sa.Column("opened", sa.Boolean(), nullable=False),
        sa.Column("current_ctc", sa.Float(), nullable=False),
        sa.Column("expected_ctc", sa.Float(), nullable=False),
        sa.Column("notice_period", sa.Float(), nullable=False),
        sa.Column("experience", sa.Float(), nullable=False),
        sa.Column("additional_info", sa.Text(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "openings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("job_id", sa.String(80), nullable=False),
        sa.Column("exp_date", sa.Date(), nullable=True),
        sa.Column("role", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("experience", sa.String(200), nullable=False),
        sa.Column("location", sa.String(40), nullable=False),
        sa.Column("job_type", sa.String(40), nullable=False),
        sa.Column("job_status", sa.String(40), nullable=False),
        sa.Column("specialization", sa.String(40), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_openings_slug", "openings", ["slug"])
    op.create_table(
        "opening_applications",
        sa.Column("opening_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("openings.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("applications.id", ondelete="CASCADE"), primary_key=True),
        sa.UniqueConstraint("opening_id", "application_id", name="uq_opening_application"),
    )
    op.create_table(
        "employee_testimonials",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("designation", sa.String(200), nullable=False),
        sa.Column("review", sa.Text(), nullable=False),
        sa.Column("image_key", sa.String(255), nullable=True),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("listed", sa.Boolean(), nullable=False),
        sa.Column("publish_date", sa.Date(), nullable=True),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "email_configurations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("smtp_default_from", sa.String(200), nullable=False),
        sa.Column("smtp_default_reply_to", sa.String(200), nullable=False),
        sa.Column("smtp_admin_email", sa.String(200), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "email_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("type", sa.String(40), nullable=False),
        sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_email_templates_slug", "email_templates", ["slug"])
    op.create_table(
        "news_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "resource_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "news",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("image_key", sa.String(255), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("button_name", sa.String(120), nullable=False),
        sa.Column("reading_time", sa.Integer(), nullable=False),
        sa.Column("facebook", sa.String(500), nullable=False),
        sa.Column("linkedin", sa.String(500), nullable=False),
        sa.Column("twitter", sa.String(500), nullable=False),
        sa.Column("instagram", sa.String(500), nullable=False),
        sa.Column("youtube_url", sa.String(500), nullable=False),
        sa.Column("seo", sa.JSON(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_news_slug", "news", ["slug"])
    op.create_table(
        "news_news_categories",
        sa.Column("news_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("news.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("news_categories.id"), primary_key=True),
        sa.UniqueConstraint("news_id", "category_id", name="uq_news_news_category"),
    )
    op.create_table(
        "news_authors",
        sa.Column("news_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("news.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("authors.id"), primary_key=True),
        sa.UniqueConstraint("news_id", "author_id", name="uq_news_author"),
    )
    op.create_table(
        "resources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("image_key", sa.String(255), nullable=True),
        sa.Column("reading_time", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("button_name", sa.String(120), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("pdf_key", sa.String(255), nullable=True),
        sa.Column("seo", sa.JSON(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_resources_slug", "resources", ["slug"])
    op.create_table(
        "resource_resource_categories",
        sa.Column("resource_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resource_categories.id"), primary_key=True),
        sa.UniqueConstraint("resource_id", "category_id", name="uq_resource_category"),
    )
    op.create_table(
        "memberships",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("images", sa.JSON(), nullable=False),
        sa.Column("seo", sa.JSON(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    for table in [
        "memberships",
        "resource_resource_categories",
        "resources",
        "news_authors",
        "news_news_categories",
        "news",
        "resource_categories",
        "news_categories",
        "email_templates",
        "email_configurations",
        "employee_testimonials",
        "opening_applications",
        "openings",
        "applications",
    ]:
        op.drop_table(table)
