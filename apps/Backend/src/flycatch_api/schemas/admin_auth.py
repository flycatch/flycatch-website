from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SignInRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1)


class RefreshRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    refresh_token: str = Field(min_length=1)


class SignOutRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    refresh_token: str | None = Field(default=None, min_length=1)


class SessionContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    administrator_id: UUID
    email: EmailStr
    roles: list[str]
    permissions: list[str]
    idle_expires_at: datetime
    absolute_expires_at: datetime


class TokenPair(BaseModel):
    model_config = ConfigDict(extra="forbid")

    access_token: str = Field(min_length=1)
    refresh_token: str = Field(min_length=1)
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = Field(ge=1)
    session: SessionContext


class AuthError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["unauthenticated", "invalid_credentials"]
    message_key: str


class FieldErrorDetail(BaseModel):
    message_key: str


class FieldErrors(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fields: dict[str, FieldErrorDetail]
