from typing import Literal

from pydantic import BaseModel, ConfigDict

from flycatch_api.models.role_permission import PermissionName


class PermissionDenied(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["permission_denied"] = "permission_denied"
    message_key: Literal["admin.action.forbidden"] = "admin.action.forbidden"
    permission: PermissionName
