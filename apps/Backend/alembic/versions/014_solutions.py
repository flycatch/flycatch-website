"""Solutions CMS entries.

Revision ID: 014
Revises: 013
Create Date: 2026-08-24
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    op.create_table(
        "solutions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("banner_image_key", sa.String(255), nullable=True),
        sa.Column("banner_title", sa.String(200), nullable=False),
        sa.Column("section_title", sa.String(200), nullable=False),
        sa.Column("seo", postgresql.JSON(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("solutions")
