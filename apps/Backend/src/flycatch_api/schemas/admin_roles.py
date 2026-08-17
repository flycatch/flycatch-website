from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RoleResource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    type: str
    slug: str


class RoleCatalogue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    actions: list[Literal["create", "read", "update", "delete", "publish"]]
    resources: list[RoleResource]


class RoleSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    description: str | None
    user_count: int = Field(ge=0)
    is_system: bool


class RoleList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[RoleSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class RoleDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    description: str | None
    permissions: list[str]
    user_count: int = Field(ge=0)
    is_system: bool


class RoleWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=64)
    description: str | None = Field(default=None, max_length=500)
    permissions: list[str]


class RoleConflict(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["system_role", "role_in_use"]
    message_key: str


class RoleNotFound(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["not_found"] = "not_found"
    message_key: Literal["admin.roles.not_found"] = "admin.roles.not_found"
