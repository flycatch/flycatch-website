"""Restore the production blog slug that was truncated at 128 characters.

Revision ID: 031
Revises: 030
Create Date: 2026-09-12
"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = "031"
down_revision: Union[str, None] = "030"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TRUNCATED_SLUG = (
    "explore-practical-cloud-migration-strategies-that-enhance-scalability-"
    "security-and-performance-learn-how-to-plan-execute-and-opt"
)
FULL_SLUG = (
    "explore-practical-cloud-migration-strategies-that-enhance-scalability-"
    "security-and-performance-learn-how-to-plan-execute-and-optimize-your-move-to-the-cloud"
)


def upgrade() -> None:
    op.get_bind().execute(
        text("UPDATE blogs SET slug = :full WHERE slug = :truncated"),
        {"full": FULL_SLUG, "truncated": TRUNCATED_SLUG},
    )


def downgrade() -> None:
    op.get_bind().execute(
        text("UPDATE blogs SET slug = :truncated WHERE slug = :full"),
        {"full": FULL_SLUG, "truncated": TRUNCATED_SLUG},
    )
