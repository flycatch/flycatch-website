"""Client logos.

Revision ID: 010
Revises: 009
Create Date: 2026-08-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    op.create_table(
        "client_logos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("colour_logo_key", sa.String(255), nullable=True),
        sa.Column("white_logo_key", sa.String(255), nullable=True),
        sa.Column("alt_text", sa.String(200), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("client_logos")
