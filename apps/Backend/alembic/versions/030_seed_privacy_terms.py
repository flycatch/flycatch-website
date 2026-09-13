"""Seed published privacy policy and terms from production copy.

Revision ID: 030
Revises: 029
Create Date: 2026-09-12
"""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "030"
down_revision: Union[str, None] = "029"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SEED_PATH = Path(__file__).resolve().parents[2] / "src/flycatch_api/data/legal_seed.json"


def upgrade() -> None:
    seed = json.loads(SEED_PATH.read_text())
    now = datetime.now(UTC)
    content_status = postgresql.ENUM("draft", "publish", name="content_status", create_type=False)
    privacy = sa.table(
        "privacy_policies",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("title", sa.String),
        sa.column("slug", sa.String),
        sa.column("body", sa.Text),
        sa.column("seo", postgresql.JSON),
        sa.column("status", content_status),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    terms = sa.table(
        "terms",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("title", sa.String),
        sa.column("slug", sa.String),
        sa.column("body", sa.Text),
        sa.column("seo", postgresql.JSON),
        sa.column("status", content_status),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    bind = op.get_bind()
    if bind.execute(sa.text("select count(*) from privacy_policies")).scalar() == 0:
        policy = seed["privacy_policy"]
        op.bulk_insert(
            privacy,
            [
                {
                    "id": uuid.uuid4(),
                    "title": policy["title"],
                    "slug": policy["slug"],
                    "body": policy["body"],
                    "seo": policy["seo"],
                    "status": "publish",
                    "created_at": now,
                    "updated_at": now,
                }
            ],
        )
    if bind.execute(sa.text("select count(*) from terms")).scalar() == 0:
        terms_row = seed["terms"]
        op.bulk_insert(
            terms,
            [
                {
                    "id": uuid.uuid4(),
                    "title": terms_row["title"],
                    "slug": terms_row["slug"],
                    "body": terms_row["body"],
                    "seo": terms_row["seo"],
                    "status": "publish",
                    "created_at": now,
                    "updated_at": now,
                }
            ],
        )


def downgrade() -> None:
    op.execute("delete from privacy_policies where slug = 'privacy-policy'")
    op.execute("delete from terms where slug = 'terms-and-conditions'")
