"""AI services FAQ accordion and Solution Details links.

Revision ID: 023
Revises: 022
Create Date: 2026-08-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "023"
down_revision: Union[str, None] = "022"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ai_services",
        sa.Column("faq_accordion", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
    )
    op.alter_column("ai_services", "faq_accordion", server_default=None)
    op.drop_table("ai_service_solutions")
    op.create_table(
        "ai_service_solutions",
        sa.Column(
            "ai_service_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ai_services.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "solution_detail_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("solution_details.id"),
            primary_key=True,
        ),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.UniqueConstraint(
            "ai_service_id", "solution_detail_id", name="uq_ai_service_solution_detail"
        ),
    )


def downgrade() -> None:
    op.drop_table("ai_service_solutions")
    op.create_table(
        "ai_service_solutions",
        sa.Column(
            "ai_service_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ai_services.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "solution_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("solutions.id"),
            primary_key=True,
        ),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.UniqueConstraint("ai_service_id", "solution_id", name="uq_ai_service_solution"),
    )
    op.drop_column("ai_services", "faq_accordion")
