"""Client testimonials.

Revision ID: 011
Revises: 010
Create Date: 2026-08-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    op.create_table(
        "client_testimonials",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("client_name", sa.String(120), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("review", sa.Text(), nullable=False),
        sa.Column("client_designation", sa.String(200), nullable=False),
        sa.Column("client_company", sa.String(200), nullable=False),
        sa.Column("country", sa.String(120), nullable=False),
        sa.Column("image_key", sa.String(255), nullable=True),
        sa.Column("alt_text", sa.String(200), nullable=False),
        sa.Column("is_clutch_review", sa.Boolean(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("review_link", sa.String(500), nullable=False),
        sa.Column("content_available_in", postgresql.JSON(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("client_testimonials")
