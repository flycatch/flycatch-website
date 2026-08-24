from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PermissionDenied(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["permission_denied"] = "permission_denied"
    message_key: Literal["admin.action.forbidden"] = "admin.action.forbidden"
    # Coarse codes (records.view, …) or matrix grants ({resource}.{action}).
    permission: str = Field(min_length=1, max_length=64)
