"""Move writer profile fields from blogs to authors.

Revision ID: 005
Revises: 004
Create Date: 2026-08-19
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("authors", sa.Column("full_name", sa.String(200), nullable=False, server_default=""))
    op.add_column("authors", sa.Column("bio", sa.Text(), nullable=False, server_default=""))
    op.add_column(
        "authors", sa.Column("designation", sa.String(200), nullable=False, server_default="")
    )
    op.add_column(
        "authors",
        sa.Column("writer_image_keys", postgresql.JSON(), nullable=False, server_default="[]"),
    )
    op.alter_column("authors", "full_name", server_default=None)
    op.alter_column("authors", "bio", server_default=None)
    op.alter_column("authors", "designation", server_default=None)
    op.alter_column("authors", "writer_image_keys", server_default=None)
    op.drop_column("blogs", "full_name")
    op.drop_column("blogs", "bio")
    op.drop_column("blogs", "designation")
    op.drop_column("blogs", "writer_image_keys")


def downgrade() -> None:
    op.add_column("blogs", sa.Column("full_name", sa.String(200), nullable=False, server_default=""))
    op.add_column("blogs", sa.Column("bio", sa.Text(), nullable=False, server_default=""))
    op.add_column("blogs", sa.Column("designation", sa.String(200), nullable=False, server_default=""))
    op.add_column(
        "blogs",
        sa.Column("writer_image_keys", postgresql.JSON(), nullable=False, server_default="[]"),
    )
    op.alter_column("blogs", "full_name", server_default=None)
    op.alter_column("blogs", "bio", server_default=None)
    op.alter_column("blogs", "designation", server_default=None)
    op.alter_column("blogs", "writer_image_keys", server_default=None)
    op.drop_column("authors", "writer_image_keys")
    op.drop_column("authors", "designation")
    op.drop_column("authors", "bio")
    op.drop_column("authors", "full_name")
