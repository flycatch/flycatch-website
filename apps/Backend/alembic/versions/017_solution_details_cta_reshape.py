"""Reshape solution-details JSON and add CTA.

Revision ID: 017
Revises: 016
Create Date: 2026-08-24
"""

import json
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "017"
down_revision: str | None = "016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _as_dict(value: object) -> dict:
    return value if isinstance(value, dict) else {}


def _first_item(block: dict) -> dict:
    items = block.get("items") if isinstance(block.get("items"), list) else []
    first = items[0] if items else {}
    return first if isinstance(first, dict) else {}


def _headings(items: object, include_types: bool) -> list[dict]:
    result: list[dict] = []
    if not isinstance(items, list):
        return result
    for item in items:
        if not isinstance(item, dict):
            continue
        order = item.get("order")
        heading = {
            "title": item.get("title") or "",
            "order": order if isinstance(order, int) and order >= 0 else 0,
            "color": item.get("color") or "",
        }
        if include_types:
            heading["types"] = item.get("types") if isinstance(item.get("types"), list) else []
        result.append(heading)
    return result


def _intro(raw: object) -> dict:
    block = _as_dict(raw)
    first = _first_item(block)
    keys = block.get("icon_keys") if isinstance(block.get("icon_keys"), list) else []
    if not keys:
        for candidate in (block.get("icon_key"), first.get("icon_key")):
            if candidate:
                keys = [candidate]
                break
    return {
        "items": _headings(block.get("items"), False),
        "description": block.get("description") or first.get("description") or "",
        "icon_keys": [key for key in keys if key],
        "sub_title": block.get("sub_title") or first.get("sub_title") or "",
        "sub_description": block.get("sub_description") or first.get("sub_description") or "",
        "image_key": block.get("image_key") or first.get("image_key"),
    }


def _challenges(raw: object) -> dict:
    block = _as_dict(raw)
    first = _first_item(block)
    return {
        "items": _headings(block.get("items"), True),
        "description": block.get("description") or first.get("description") or "",
        "image_key": block.get("image_key") or first.get("image_key"),
        "name": block.get("name") or first.get("name") or "",
        "position": block.get("position") or first.get("position") or "",
    }


def _benefits(raw: object) -> dict:
    block = _as_dict(raw)
    first = _first_item(block)
    return {
        "title": block.get("title") or "",
        "description": block.get("description") or first.get("description") or "",
        "items": _headings(block.get("items"), True),
    }


def _solutions(raw: object) -> dict:
    block = _as_dict(raw)
    keys = block.get("image_keys") if isinstance(block.get("image_keys"), list) else []
    return {
        "title": block.get("title") or "",
        "image_key": block.get("image_key") or (keys[0] if keys else None),
        "description": block.get("description") or "",
    }


def upgrade() -> None:
    op.add_column(
        "solution_details",
        sa.Column("cta", postgresql.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
    )
    connection = op.get_bind()
    rows = connection.execute(
        sa.text(
            "SELECT id, introduction, challenges, benefits, solutions_section FROM solution_details"
        )
    )
    for row in rows:
        connection.execute(
            sa.text(
                """
                UPDATE solution_details
                SET introduction = CAST(:introduction AS json),
                    challenges = CAST(:challenges AS json),
                    benefits = CAST(:benefits AS json),
                    solutions_section = CAST(:solutions_section AS json)
                WHERE id = :id
                """
            ),
            {
                "id": row.id,
                "introduction": json.dumps(_intro(row.introduction)),
                "challenges": json.dumps(_challenges(row.challenges)),
                "benefits": json.dumps(_benefits(row.benefits)),
                "solutions_section": json.dumps(_solutions(row.solutions_section)),
            },
        )
    op.alter_column("solution_details", "cta", server_default=None)


def downgrade() -> None:
    op.drop_column("solution_details", "cta")
