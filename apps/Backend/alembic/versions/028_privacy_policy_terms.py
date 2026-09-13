"""Add privacy policy and terms content types.

Revision ID: 028
Revises: 027
Create Date: 2026-09-12
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "028"
down_revision: Union[str, None] = "027"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _legal_table(name: str) -> None:
    content_status = postgresql.ENUM("draft", "publish", name="content_status", create_type=False)
    op.create_table(
        name,
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("seo", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(f"ix_{name}_slug", name, ["slug"])


def upgrade() -> None:
    _legal_table("privacy_policies")
    _legal_table("terms")


def downgrade() -> None:
    op.drop_index("ix_terms_slug", table_name="terms")
    op.drop_table("terms")
    op.drop_index("ix_privacy_policies_slug", table_name="privacy_policies")
    op.drop_table("privacy_policies")
