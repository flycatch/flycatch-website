"""Author and category publish status.

Revision ID: 008
Revises: 007
Create Date: 2026-08-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    content_status.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "authors",
        sa.Column("status", content_status, nullable=False, server_default="publish"),
    )
    op.add_column(
        "categories",
        sa.Column("status", content_status, nullable=False, server_default="publish"),
    )
    op.alter_column("authors", "status", server_default=None)
    op.alter_column("categories", "status", server_default=None)


def downgrade() -> None:
    op.drop_column("categories", "status")
    op.drop_column("authors", "status")
