"""Case studies, industries, and case study categories.

Revision ID: 007
Revises: 006
Create Date: 2026-08-19
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    content_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "industries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("name", name="uq_industries_name"),
    )
    op.create_table(
        "case_study_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("name", name="uq_case_study_categories_name"),
    )
    op.create_table(
        "case_studies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("heading", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("short_heading", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("occurred_on", sa.Date(), nullable=True),
        sa.Column("status", content_status, nullable=False),
        sa.Column("image_key", sa.String(255), nullable=True),
        sa.Column("image_alt", sa.String(200), nullable=False),
        sa.Column("content_available_in", postgresql.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug", name="uq_case_studies_slug"),
    )
    op.create_index("ix_case_studies_slug", "case_studies", ["slug"])
    op.create_table(
        "case_study_industries",
        sa.Column(
            "case_study_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("case_studies.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "industry_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("industries.id"),
            primary_key=True,
        ),
        sa.UniqueConstraint("case_study_id", "industry_id", name="uq_case_study_industry"),
    )
    op.create_table(
        "case_study_category_links",
        sa.Column(
            "case_study_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("case_studies.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("case_study_categories.id"),
            primary_key=True,
        ),
        sa.UniqueConstraint("case_study_id", "category_id", name="uq_case_study_category"),
    )


def downgrade() -> None:
    op.drop_table("case_study_category_links")
    op.drop_table("case_study_industries")
    op.drop_index("ix_case_studies_slug", table_name="case_studies")
    op.drop_table("case_studies")
    op.drop_table("case_study_categories")
    op.drop_table("industries")
    op.execute("DROP TYPE IF EXISTS content_status")
