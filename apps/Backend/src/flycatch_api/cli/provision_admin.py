import argparse
import getpass
import sys

from flycatch_api.db import SessionLocal
from flycatch_api.services.auth_service import AuthService
from flycatch_api.services.bootstrap_service import CATALOGUE_ROLES


def main() -> None:
    parser = argparse.ArgumentParser(description="Provision an administrator with a required role")
    parser.add_argument("--email", required=True)
    parser.add_argument("--role", required=True, choices=sorted(CATALOGUE_ROLES))
    parser.add_argument("--created-by", default="cli")
    args = parser.parse_args()
    password = getpass.getpass("Password (min 12 chars): ")
    if len(password) < 12:
        print("Password must be at least 12 characters", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        AuthService().provision_administrator(
            db, args.email, password, args.created_by, args.role
        )
        print(f"Provisioned {args.role}: {args.email.lower()}")
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
