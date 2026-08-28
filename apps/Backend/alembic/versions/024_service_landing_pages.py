"""Service landing CMS tables.

Revision ID: 024
Revises: 023
Create Date: 2026-08-28
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "024"
down_revision: Union[str, None] = "023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _common(content_status):
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("banner_title", sa.String(200), nullable=False),
        sa.Column("banner_image_key", sa.String(255), nullable=True),
        sa.Column("introduction_title", sa.String(200), nullable=False),
        sa.Column("introduction_first_paragraph", sa.Text(), nullable=False),
        sa.Column("introduction_second_paragraph", sa.Text(), nullable=False),
        sa.Column("seo", sa.JSON(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    ]


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    faq_cols = [
        sa.Column("faq_title", sa.String(200), nullable=False),
        sa.Column("faq_description", sa.Text(), nullable=False),
        sa.Column("faq_accordion", sa.JSON(), nullable=False),
    ]
    offering_cols = [
        sa.Column("accordion", sa.JSON(), nullable=False),
        sa.Column("offering_image_key", sa.String(255), nullable=True),
        sa.Column("offering_title", sa.String(200), nullable=False),
        sa.Column("offering_description", sa.Text(), nullable=False),
    ]
    op.create_table(
        "devops_consults",
        *_common(content_status),
        sa.Column("experience_title", sa.String(200), nullable=False),
        sa.Column("experience_accordion", sa.JSON(), nullable=False),
        sa.Column("experience_image_key", sa.String(255), nullable=True),
        sa.Column("experience_description", sa.Text(), nullable=False),
        *faq_cols,
        sa.UniqueConstraint("slug", name="uq_devops_consults_slug"),
    )
    op.create_table(
        "infrastructure_managements",
        *_common(content_status),
        *faq_cols,
        sa.UniqueConstraint("slug", name="uq_infrastructure_managements_slug"),
    )
    op.create_table(
        "application_developments",
        *_common(content_status),
        *offering_cols,
        *faq_cols,
        sa.Column("content_available_in", sa.JSON(), nullable=False),
        sa.UniqueConstraint("slug", name="uq_application_developments_slug"),
    )
    op.create_table(
        "application_modernizations",
        *_common(content_status),
        *offering_cols,
        *faq_cols,
        sa.UniqueConstraint("slug", name="uq_application_modernizations_slug"),
    )
    op.create_table(
        "mobile_application_developments",
        *_common(content_status),
        sa.Column("introduction_third_paragraph", sa.Text(), nullable=False),
        *offering_cols,
        *faq_cols,
        sa.UniqueConstraint("slug", name="uq_mobile_application_developments_slug"),
    )
    op.create_table(
        "user_centered_designs",
        *_common(content_status),
        *offering_cols,
        *faq_cols,
        sa.UniqueConstraint("slug", name="uq_user_centered_designs_slug"),
    )
    op.create_table(
        "overviews",
        *_common(content_status),
        sa.UniqueConstraint("slug", name="uq_overviews_slug"),
    )


def downgrade() -> None:
    for table in [
        "overviews",
        "user_centered_designs",
        "mobile_application_developments",
        "application_modernizations",
        "application_developments",
        "infrastructure_managements",
        "devops_consults",
    ]:
        op.drop_table(table)
