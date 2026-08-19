"""Drop unused authors.full_name after Name became the single display field.

Revision ID: 006
Revises: 005
Create Date: 2026-08-19
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("authors", "full_name")


def downgrade() -> None:
    op.add_column("authors", sa.Column("full_name", sa.String(200), nullable=False, server_default=""))
    op.alter_column("authors", "full_name", server_default=None)
