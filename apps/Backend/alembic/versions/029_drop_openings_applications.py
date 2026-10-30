"""Drop openings and applications; careers now live in the HRMS.

Revision ID: 029
Revises: 028
Create Date: 2026-10-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "029"
down_revision: str | None = "028"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_table("opening_applications")
    op.drop_index("ix_openings_slug", table_name="openings")
    op.drop_table("openings")
    op.drop_table("applications")


def downgrade() -> None:
    content_status = postgresql.ENUM("draft", "publish", name="content_status", create_type=False)
    op.create_table(
        "applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("resume_key", sa.String(255), nullable=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("last_name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(40), nullable=False),
        sa.Column("opened", sa.Boolean(), nullable=False),
        sa.Column("current_ctc", sa.Float(), nullable=False),
        sa.Column("expected_ctc", sa.Float(), nullable=False),
        sa.Column("notice_period", sa.Float(), nullable=False),
        sa.Column("experience", sa.Float(), nullable=False),
        sa.Column("additional_info", sa.Text(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "openings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("job_id", sa.String(80), nullable=False),
        sa.Column("exp_date", sa.Date(), nullable=True),
        sa.Column("role", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("experience", sa.String(200), nullable=False),
        sa.Column("location", sa.String(40), nullable=False),
        sa.Column("job_type", sa.String(40), nullable=False),
        sa.Column("job_status", sa.String(40), nullable=False),
        sa.Column("specialization", sa.String(40), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", content_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_openings_slug", "openings", ["slug"])
    op.create_table(
        "opening_applications",
        sa.Column("opening_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("openings.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("applications.id", ondelete="CASCADE"), primary_key=True),
        sa.UniqueConstraint("opening_id", "application_id", name="uq_opening_application"),
    )
