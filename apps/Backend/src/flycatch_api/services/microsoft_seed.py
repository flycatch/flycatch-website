from datetime import UTC, datetime
from uuid import uuid4

import sqlalchemy as sa

DEFAULT_ADMIN_EMAIL = "liju@flycatchtech.com"
SEED_ACTOR = "microsoft-seed"


def ensure_default_microsoft_admin(bind) -> None:
    """Ensure the default Microsoft admin exists, is active, and has administrator.

    An existing password hash is left unchanged. A second call does not insert
    another row.
    """
    now = datetime.now(UTC)
    existing = bind.execute(
        sa.text("SELECT id FROM administrators WHERE lower(email) = :email"),
        {"email": DEFAULT_ADMIN_EMAIL},
    ).first()
    if existing is None:
        bind.execute(
            sa.text(
                """
                INSERT INTO administrators
                    (id, email, password_hash, is_active, created_at, created_by, microsoft_oid)
                VALUES
                    (:id, :email, NULL, :is_active, :created_at, :created_by, NULL)
                """
            ),
            {
                "id": str(uuid4()),
                "email": DEFAULT_ADMIN_EMAIL,
                "is_active": True,
                "created_at": now,
                "created_by": SEED_ACTOR,
            },
        )
    else:
        bind.execute(
            sa.text(
                """
                UPDATE administrators
                SET is_active = :is_active
                WHERE lower(email) = :email
                """
            ),
            {"is_active": True, "email": DEFAULT_ADMIN_EMAIL},
        )
    _assign_administrator_role(bind, now)


def assign_default_microsoft_admin_role(bind) -> None:
    """Give the seeded admin the administrator role once that role exists.

    Does not create the account and does not change a password. No-op when the
    account or the role is missing.
    """
    _assign_administrator_role(bind, datetime.now(UTC))
    bind.execute(
        sa.text(
            """
            UPDATE administrators
            SET is_active = :is_active
            WHERE lower(email) = :email
            """
        ),
        {"is_active": True, "email": DEFAULT_ADMIN_EMAIL},
    )


def _assign_administrator_role(bind, assigned_at: datetime) -> None:
    bind.execute(
        sa.text(
            """
            INSERT INTO administrator_roles (administrator_id, role_id, assigned_at, assigned_by)
            SELECT a.id, r.id, :assigned_at, :assigned_by
            FROM administrators a
            JOIN roles r ON r.name = 'administrator'
            WHERE lower(a.email) = :email
              AND NOT EXISTS (
                SELECT 1 FROM administrator_roles ar
                WHERE ar.administrator_id = a.id AND ar.role_id = r.id
              )
            """
        ),
        {
            "assigned_at": assigned_at,
            "assigned_by": SEED_ACTOR,
            "email": DEFAULT_ADMIN_EMAIL,
        },
    )
