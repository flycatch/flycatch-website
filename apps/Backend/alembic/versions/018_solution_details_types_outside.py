"""Lift challenge and benefit types out of accordion items.

Revision ID: 018
Revises: 017
Create Date: 2026-08-24
"""

import json
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "018"
down_revision: str | None = "017"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _as_dict(value: object) -> dict:
    return value if isinstance(value, dict) else {}


def _headings(items: object) -> list[dict]:
    result: list[dict] = []
    if not isinstance(items, list):
        return result
    for item in items:
        if not isinstance(item, dict):
            continue
        order = item.get("order")
        result.append(
            {
                "title": item.get("title") or "",
                "order": order if isinstance(order, int) and order >= 0 else 0,
                "color": item.get("color") or "",
            }
        )
    return result


def _collected_types(block: dict) -> list:
    if isinstance(block.get("types"), list):
        return [row for row in block["types"] if isinstance(row, dict)]
    collected: list = []
    items = block.get("items") if isinstance(block.get("items"), list) else []
    for item in items:
        if not isinstance(item, dict):
            continue
        types = item.get("types") if isinstance(item.get("types"), list) else []
        collected.extend(row for row in types if isinstance(row, dict))
    return collected


def _challenges(raw: object) -> dict:
    block = _as_dict(raw)
    return {
        "items": _headings(block.get("items")),
        "description": block.get("description") or "",
        "image_key": block.get("image_key"),
        "name": block.get("name") or "",
        "position": block.get("position") or "",
        "types": _collected_types(block),
    }


def _benefits(raw: object) -> dict:
    block = _as_dict(raw)
    return {
        "items": _headings(block.get("items")),
        "description": block.get("description") or "",
        "types": _collected_types(block),
    }


def upgrade() -> None:
    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id, challenges, benefits FROM solution_details"))
    for row in rows:
        connection.execute(
            sa.text(
                """
                UPDATE solution_details
                SET challenges = CAST(:challenges AS json),
                    benefits = CAST(:benefits AS json)
                WHERE id = :id
                """
            ),
            {
                "id": row.id,
                "challenges": json.dumps(_challenges(row.challenges)),
                "benefits": json.dumps(_benefits(row.benefits)),
            },
        )


def downgrade() -> None:
    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id, challenges, benefits FROM solution_details"))
    for row in rows:
        challenges = _as_dict(row.challenges)
        benefits = _as_dict(row.benefits)
        raw_challenge_items = challenges.get("items")
        raw_benefit_items = benefits.get("items")
        challenge_items = raw_challenge_items if isinstance(raw_challenge_items, list) else []
        benefit_items = raw_benefit_items if isinstance(raw_benefit_items, list) else []
        if challenge_items and isinstance(challenge_items[0], dict):
            challenge_items[0]["types"] = challenges.get("types") or []
        if benefit_items and isinstance(benefit_items[0], dict):
            benefit_items[0]["types"] = benefits.get("types") or []
        connection.execute(
            sa.text(
                """
                UPDATE solution_details
                SET challenges = CAST(:challenges AS json),
                    benefits = CAST(:benefits AS json)
                WHERE id = :id
                """
            ),
            {
                "id": row.id,
                "challenges": json.dumps(
                    {
                        "items": challenge_items,
                        "description": challenges.get("description") or "",
                        "image_key": challenges.get("image_key"),
                        "name": challenges.get("name") or "",
                        "position": challenges.get("position") or "",
                    }
                ),
                "benefits": json.dumps(
                    {
                        "title": "",
                        "description": benefits.get("description") or "",
                        "items": benefit_items,
                    }
                ),
            },
        )
