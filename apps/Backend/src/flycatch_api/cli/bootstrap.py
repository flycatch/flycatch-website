from __future__ import annotations

import argparse
import getpass
import sys

from flycatch_api.db import SessionLocal
from flycatch_api.services.bootstrap_service import (
    ROLE_ADMINISTRATOR,
    ROLE_EDITOR,
    BootstrapError,
    BootstrapService,
    BootstrapUser,
)


def _prompt_secret(label: str) -> str:
    return getpass.getpass(f"{label} (min 12 chars): ")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Create default roles and at least two administrative users"
    )
    parser.add_argument("--user-1-email", required=True)
    parser.add_argument("--user-1-password", default=None)
    parser.add_argument("--user-2-email", required=True)
    parser.add_argument("--user-2-password", default=None)
    parser.add_argument(
        "--user-2-role",
        choices=[ROLE_ADMINISTRATOR, ROLE_EDITOR],
        default=ROLE_ADMINISTRATOR,
    )
    parser.add_argument("--created-by", default="cli")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    password_1 = args.user_1_password or _prompt_secret("User 1 password")
    password_2 = args.user_2_password or _prompt_secret("User 2 password")

    db = SessionLocal()
    try:
        result = BootstrapService().run(
            db,
            BootstrapUser(
                email=args.user_1_email,
                password=password_1,
                role=ROLE_ADMINISTRATOR,
            ),
            BootstrapUser(
                email=args.user_2_email,
                password=password_2,
                role=args.user_2_role,
            ),
            created_by=args.created_by,
        )
        print(result.summary())
        print(f"user 1: {args.user_1_email.lower()} role={ROLE_ADMINISTRATOR}")
        print(f"user 2: {args.user_2_email.lower()} role={args.user_2_role}")
        return 0
    except BootstrapError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
