"""Solution products CMS entries.

Revision ID: 016
Revises: 015
Create Date: 2026-08-24
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    op.create_table(
        "solution_products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("product_title", sa.String(200), nullable=False),
        sa.Column("product_description", sa.Text(), nullable=False),
        sa.Column("product_tag", sa.String(120), nullable=False),
        sa.Column("product_logo_key", sa.String(255), nullable=True),
        sa.Column("product_card_image_key", sa.String(255), nullable=True),
        sa.Column("product_banner_image_key", sa.String(255), nullable=True),
        sa.Column("card_image_on_right", sa.Boolean(), nullable=False),
        sa.Column("banner_image_on_right", sa.Boolean(), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug", name="uq_solution_products_slug"),
    )


def downgrade() -> None:
    op.drop_table("solution_products")
