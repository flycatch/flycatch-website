from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.case_study import ContentStatus


class ClientLogo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    colour_logo_key: str | None
    white_logo_key: str | None
    alt_text: str
    status: ContentStatus
    created_at: datetime


class ClientLogoSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    colour_logo_key: str | None
    white_logo_key: str | None
    alt_text: str
    state: ContentStatus


class ClientLogoList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ClientLogoSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class ClientLogoWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    colour_logo_key: str | None = None
    white_logo_key: str | None = None
    alt_text: str = Field(min_length=1, max_length=200)
    status: ContentStatus = ContentStatus.draft
