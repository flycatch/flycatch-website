"""Home CMS entries.

Revision ID: 012
Revises: 011
Create Date: 2026-08-21
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    op.create_table(
        "homes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("video_key", sa.String(255), nullable=True),
        sa.Column("video_content_type", sa.String(100), nullable=True),
        sa.Column("banner_title", sa.String(200), nullable=False),
        sa.Column("seo", postgresql.JSON(), nullable=False),
        sa.Column("services_types_title", sa.String(200), nullable=False),
        sa.Column("services_image_key", sa.String(255), nullable=True),
        sa.Column("services_contents", sa.Text(), nullable=False),
        sa.Column("our_services_links", sa.Text(), nullable=False),
        sa.Column("banner_explore_text", sa.String(200), nullable=False),
        sa.Column("faq_title", sa.String(200), nullable=False),
        sa.Column("faq_description", sa.Text(), nullable=False),
        sa.Column("faq_ai_expertise_title", sa.String(200), nullable=False),
        sa.Column("faq_ai_expertise_contents", sa.Text(), nullable=False),
        sa.Column("content_available_in", postgresql.JSON(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "home_case_studies",
        sa.Column(
            "home_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("homes.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "case_study_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("case_studies.id"),
            primary_key=True,
        ),
        sa.UniqueConstraint("home_id", "case_study_id", name="uq_home_case_study"),
    )


def downgrade() -> None:
    op.drop_table("home_case_studies")
    op.drop_table("homes")
