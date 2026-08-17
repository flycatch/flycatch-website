"""Blogs, authors, and categories.

Revision ID: 004
Revises: 003
Create Date: 2026-08-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "authors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("name", name="uq_authors_name"),
    )
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("name", name="uq_categories_name"),
    )
    op.create_table(
        "blogs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("draft", "publish", name="blog_status"),
            nullable=False,
        ),
        sa.Column("reading_time", sa.Integer(), nullable=False),
        sa.Column("image_key", sa.String(255), nullable=True),
        sa.Column("image_alt", sa.String(200), nullable=False),
        sa.Column("canonical_url", sa.String(500), nullable=False),
        sa.Column("facebook", sa.String(500), nullable=False),
        sa.Column("linkedin", sa.String(500), nullable=False),
        sa.Column("twitter", sa.String(500), nullable=False),
        sa.Column("instagram", sa.String(500), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=False),
        sa.Column("bio", sa.Text(), nullable=False),
        sa.Column("designation", sa.String(200), nullable=False),
        sa.Column("writer_image_keys", postgresql.JSON(), nullable=False),
        sa.Column("content_available_in", postgresql.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug", name="uq_blogs_slug"),
    )
    op.create_index("ix_blogs_slug", "blogs", ["slug"])
    op.create_table(
        "blog_authors",
        sa.Column(
            "blog_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("blogs.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "author_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("authors.id"),
            primary_key=True,
        ),
        sa.UniqueConstraint("blog_id", "author_id", name="uq_blog_author"),
    )
    op.create_table(
        "blog_categories",
        sa.Column(
            "blog_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("blogs.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("categories.id"),
            primary_key=True,
        ),
        sa.UniqueConstraint("blog_id", "category_id", name="uq_blog_category"),
    )


def downgrade() -> None:
    op.drop_table("blog_categories")
    op.drop_table("blog_authors")
    op.drop_index("ix_blogs_slug", table_name="blogs")
    op.drop_table("blogs")
    op.drop_table("categories")
    op.drop_table("authors")
    op.execute("DROP TYPE IF EXISTS blog_status")
