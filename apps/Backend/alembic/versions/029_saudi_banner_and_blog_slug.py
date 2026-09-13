"""Store Saudi banner image and allow long source blog slugs.

Revision ID: 029
Revises: 028
Create Date: 2026-09-12
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "029"
down_revision: Union[str, None] = "028"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "flycatch_saudi_arabia",
        sa.Column("banner_image_key", sa.String(255), nullable=True),
    )
    op.alter_column(
        "blogs",
        "slug",
        existing_type=sa.String(128),
        type_=sa.String(255),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "blogs",
        "slug",
        existing_type=sa.String(255),
        type_=sa.String(128),
        existing_nullable=False,
    )
    op.drop_column("flycatch_saudi_arabia", "banner_image_key")
