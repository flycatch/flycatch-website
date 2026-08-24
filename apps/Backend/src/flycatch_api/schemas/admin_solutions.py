from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_homes import ContentSeo


class Solution(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    banner_image_key: str | None
    banner_title: str
    section_title: str
    seo: ContentSeo
    status: ContentStatus
    created_at: datetime


class SolutionSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    banner_image_key: str | None
    banner_title: str
    section_title: str
    state: ContentStatus


class SolutionList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SolutionSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class SolutionWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    banner_image_key: str | None = None
    banner_title: str = Field(default="", max_length=200)
    section_title: str = Field(default="", max_length=200)
    seo: ContentSeo = Field(default_factory=ContentSeo)
    status: ContentStatus = ContentStatus.draft
