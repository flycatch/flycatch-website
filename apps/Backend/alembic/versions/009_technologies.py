"""Technologies and case study technology links.

Revision ID: 009
Revises: 008
Create Date: 2026-08-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    content_status = postgresql.ENUM(
        "draft", "publish", name="content_status", create_type=False
    )
    op.create_table(
        "technologies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("logo_key", sa.String(255), nullable=True),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("name", name="uq_technologies_name"),
    )
    op.create_table(
        "case_study_technologies",
        sa.Column(
            "case_study_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("case_studies.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "technology_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("technologies.id"),
            primary_key=True,
        ),
        sa.UniqueConstraint("case_study_id", "technology_id", name="uq_case_study_technology"),
    )


def downgrade() -> None:
    op.drop_table("case_study_technologies")
    op.drop_table("technologies")
