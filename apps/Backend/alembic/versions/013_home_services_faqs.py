"""Repeatable Home services/FAQs and ordered case studies.

Revision ID: 013
Revises: 012
Create Date: 2026-08-21
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "homes",
        sa.Column("services", postgresql.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "homes",
        sa.Column("faqs", postgresql.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "home_case_studies",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.execute(
        """
        UPDATE homes SET services = json_build_array(
            json_build_object(
                'services_types_title', services_types_title,
                'services_image_key', services_image_key,
                'services_contents', services_contents,
                'our_services_links', our_services_links
            )
        )
        WHERE coalesce(services_types_title, '') <> ''
           OR services_image_key IS NOT NULL
           OR coalesce(services_contents, '') <> ''
           OR coalesce(our_services_links, '') <> ''
        """
    )
    op.execute(
        """
        UPDATE homes SET faqs = json_build_array(
            json_build_object(
                'title', faq_ai_expertise_title,
                'contents', faq_ai_expertise_contents
            )
        )
        WHERE coalesce(faq_ai_expertise_title, '') <> ''
           OR coalesce(faq_ai_expertise_contents, '') <> ''
        """
    )
    op.drop_column("homes", "services_types_title")
    op.drop_column("homes", "services_image_key")
    op.drop_column("homes", "services_contents")
    op.drop_column("homes", "our_services_links")
    op.drop_column("homes", "faq_ai_expertise_title")
    op.drop_column("homes", "faq_ai_expertise_contents")
    op.alter_column("homes", "services", server_default=None)
    op.alter_column("homes", "faqs", server_default=None)
    op.alter_column("home_case_studies", "sort_order", server_default=None)


def downgrade() -> None:
    op.add_column("homes", sa.Column("services_types_title", sa.String(200), nullable=False, server_default=""))
    op.add_column("homes", sa.Column("services_image_key", sa.String(255), nullable=True))
    op.add_column("homes", sa.Column("services_contents", sa.Text(), nullable=False, server_default=""))
    op.add_column("homes", sa.Column("our_services_links", sa.Text(), nullable=False, server_default=""))
    op.add_column(
        "homes", sa.Column("faq_ai_expertise_title", sa.String(200), nullable=False, server_default="")
    )
    op.add_column("homes", sa.Column("faq_ai_expertise_contents", sa.Text(), nullable=False, server_default=""))
    op.drop_column("home_case_studies", "sort_order")
    op.drop_column("homes", "services")
    op.drop_column("homes", "faqs")
