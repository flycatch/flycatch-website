from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserRole(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str


class UserSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    email: str
    is_active: bool
    roles: list[UserRole]
    created_by: str
    created_at: datetime


class UserList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[UserSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=320)
    role_ids: list[UUID] = Field(default_factory=list)


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role_ids: list[UUID] | None = None
    is_active: bool | None = None


class UserBulkAssign(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role_id: UUID
    user_ids: list[UUID] = Field(min_length=1, max_length=500)
    action: Literal["add", "remove"] = "add"


class UserBulkAssignResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    changed: int = Field(ge=0)


class UserConflict(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["last_administrator", "self_protected"]
    message_key: str


class UserNotFound(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["not_found"] = "not_found"
    message_key: Literal["admin.users.not_found"] = "admin.users.not_found"
