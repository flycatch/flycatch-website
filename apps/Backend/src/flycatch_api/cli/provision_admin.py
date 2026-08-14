import argparse
import getpass
import sys

from flycatch_api.db import SessionLocal
from flycatch_api.services.auth_service import AuthService


def main() -> None:
    parser = argparse.ArgumentParser(description="Provision an administrator")
    parser.add_argument("--email", required=True)
    parser.add_argument("--created-by", default="cli")
    args = parser.parse_args()
    password = getpass.getpass("Password (min 12 chars): ")
    if len(password) < 12:
        print("Password must be at least 12 characters", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        AuthService().provision_administrator(db, args.email, password, args.created_by)
        print(f"Provisioned administrator: {args.email.lower()}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
