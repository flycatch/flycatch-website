from io import StringIO
from unittest.mock import patch

from flycatch_api.cli.bootstrap import main
from flycatch_api.models import Administrator, AdministratorRole, Role, RolePermission
from flycatch_api.services.bootstrap_service import (
    BootstrapError,
    BootstrapService,
    BootstrapUser,
)
from flycatch_api.services.role_service import default_grants


def test_bootstrap_creates_two_users_and_catalogue(db):
    result = BootstrapService().run(
        db,
        BootstrapUser("admin1@example.com", "administrator-pass", "administrator"),
        BootstrapUser("editor1@example.com", "editor-password", "editor"),
    )
    assert sorted(result.created_users) == ["admin1@example.com", "editor1@example.com"]
    grants = {
        role.name: {item.permission for item in role.permissions} for role in db.query(Role).all()
    }
    assert grants["administrator"] == set(default_grants("administrator"))
    assert grants["editor"] == set(default_grants("editor"))
    assert "records.publish" not in grants["editor"]
    assert "roles.manage" not in grants["editor"]
    assert "roles.manage" in grants["administrator"]
    assert db.query(Administrator).count() == 2


def test_bootstrap_is_idempotent(db):
    users = (
        BootstrapUser("admin1@example.com", "administrator-pass", "administrator"),
        BootstrapUser("editor1@example.com", "editor-password", "editor"),
    )
    BootstrapService().run(db, *users)
    second = BootstrapService().run(db, *users)
    assert second.created_users == []
    assert second.created_roles == []
    assert "already exist" in second.summary().lower() or second.already_existed
    assert db.query(Administrator).count() == 2
    assert db.query(Role).count() == 2
    assert db.query(RolePermission).count() == len(default_grants("administrator")) + len(
        default_grants("editor")
    )


def test_bootstrap_creates_missing_user_of_the_pair(db):
    BootstrapService().run(
        db,
        BootstrapUser("admin1@example.com", "administrator-pass", "administrator"),
        BootstrapUser("editor1@example.com", "editor-password", "editor"),
    )
    editor = db.query(Administrator).filter(Administrator.email == "editor1@example.com").one()
    db.query(AdministratorRole).filter(
        AdministratorRole.administrator_id == editor.id
    ).delete()
    db.delete(editor)
    db.commit()
    result = BootstrapService().run(
        db,
        BootstrapUser("admin1@example.com", "administrator-pass", "administrator"),
        BootstrapUser("editor1@example.com", "editor-password", "editor"),
    )
    assert result.created_users == ["editor1@example.com"]
    assert db.query(Administrator).count() == 2


def test_bootstrap_fail_closed_missing_inputs(db):
    try:
        BootstrapService().run(
            db,
            BootstrapUser("admin1@example.com", "short", "administrator"),
            BootstrapUser("editor1@example.com", "editor-password", "editor"),
        )
        raise AssertionError("expected BootstrapError")
    except BootstrapError:
        pass
    assert db.query(Administrator).count() == 0
    assert db.query(Role).count() == 0


def test_bootstrap_cli_does_not_print_secrets(db, monkeypatch):
    class _Session:
        def close(self):
            return None

        def __getattr__(self, name):
            return getattr(db, name)

    monkeypatch.setattr("flycatch_api.cli.bootstrap.SessionLocal", lambda: _Session())
    stdout = StringIO()
    with patch("sys.stdout", stdout):
        code = main(
            [
                "--user-1-email",
                "admin1@example.com",
                "--user-1-password",
                "administrator-pass",
                "--user-2-email",
                "editor1@example.com",
                "--user-2-password",
                "editor-password",
                "--user-2-role",
                "editor",
            ]
        )
    assert code == 0
    output = stdout.getvalue()
    assert "administrator-pass" not in output
    assert "editor-password" not in output
    assert "admin1@example.com" in output
