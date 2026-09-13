"""Add SEO JSON storage for blogs, case studies, and solution products.

Revision ID: 027
Revises: 026
Create Date: 2026-09-12
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "027"
down_revision: Union[str, None] = "026"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "blogs",
        sa.Column("seo", postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::json")),
    )
    op.add_column(
        "case_studies",
        sa.Column("seo", postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::json")),
    )
    op.add_column(
        "solution_products",
        sa.Column("seo", postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::json")),
    )
    op.alter_column("blogs", "seo", server_default=None)
    op.alter_column("case_studies", "seo", server_default=None)
    op.alter_column("solution_products", "seo", server_default=None)


def downgrade() -> None:
    op.drop_column("solution_products", "seo")
    op.drop_column("case_studies", "seo")
    op.drop_column("blogs", "seo")
