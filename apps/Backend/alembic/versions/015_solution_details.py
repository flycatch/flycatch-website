"""Solution details CMS entries.

Revision ID: 015
Revises: 014
Create Date: 2026-08-24
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    op.create_table(
        "solution_details",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("banner", postgresql.JSON(), nullable=False),
        sa.Column("introduction", postgresql.JSON(), nullable=False),
        sa.Column("challenges", postgresql.JSON(), nullable=False),
        sa.Column("benefits", postgresql.JSON(), nullable=False),
        sa.Column("solutions_section", postgresql.JSON(), nullable=False),
        sa.Column("seo", postgresql.JSON(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug", name="uq_solution_details_slug"),
    )


def downgrade() -> None:
    op.drop_table("solution_details")
