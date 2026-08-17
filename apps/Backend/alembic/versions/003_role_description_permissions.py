"""Role description and string permissions.

Revision ID: 003
Revises: 002
Create Date: 2026-08-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("roles", sa.Column("description", sa.Text(), nullable=True))
    op.alter_column(
        "role_permissions",
        "permission",
        existing_type=postgresql.ENUM(
            "records.view",
            "drafts.save",
            "records.publish",
            name="permission_name",
        ),
        type_=sa.String(64),
        existing_nullable=False,
        postgresql_using="permission::text",
    )
    op.execute("DROP TYPE IF EXISTS permission_name")


def downgrade() -> None:
    permission_enum = postgresql.ENUM(
        "records.view",
        "drafts.save",
        "records.publish",
        name="permission_name",
        create_type=False,
    )
    permission_enum.create(op.get_bind(), checkfirst=True)
    op.execute(
        "DELETE FROM role_permissions WHERE permission NOT IN "
        "('records.view', 'drafts.save', 'records.publish')"
    )
    op.alter_column(
        "role_permissions",
        "permission",
        existing_type=sa.String(64),
        type_=permission_enum,
        existing_nullable=False,
        postgresql_using="permission::permission_name",
    )
    op.drop_column("roles", "description")
