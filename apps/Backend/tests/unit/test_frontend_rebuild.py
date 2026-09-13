from flycatch_api.services.frontend_rebuild import should_rebuild_after_admin_request


def test_publish_action_triggers_rebuild():
    assert should_rebuild_after_admin_request("POST", "/api/v1/admin/publish", 200)


def test_content_patch_triggers_rebuild():
    assert should_rebuild_after_admin_request("PATCH", "/api/v1/admin/blogs/abc", 200)


def test_auth_and_reads_do_not_trigger_rebuild():
    assert not should_rebuild_after_admin_request("POST", "/api/v1/admin/auth/sign-in", 200)
    assert not should_rebuild_after_admin_request("GET", "/api/v1/admin/blogs", 200)
    assert not should_rebuild_after_admin_request("POST", "/api/v1/admin/publish", 401)
