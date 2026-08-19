from datetime import date as DateValue
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.case_study import ContentStatus


class Industry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    status: ContentStatus
    created_at: datetime


class IndustrySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    created_at: datetime
    state: ContentStatus


class IndustryList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[IndustrySummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class IndustryWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    status: ContentStatus = ContentStatus.draft


class CaseStudyCategory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    status: ContentStatus
    created_at: datetime
    case_studies: int = Field(ge=0)


class CaseStudyCategorySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    case_studies: int = Field(ge=0)
    created_at: datetime
    state: ContentStatus


class CaseStudyCategoryList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[CaseStudyCategorySummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class CaseStudyCategoryWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    status: ContentStatus = ContentStatus.draft


class CaseStudySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    heading: str
    industry: str
    order: int
    short_heading: str
    content_available_in: str
    state: ContentStatus


class CaseStudyList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[CaseStudySummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class CaseStudyDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    heading: str
    slug: str
    short_heading: str
    description: str
    body: str
    order: int
    date: DateValue | None
    status: ContentStatus
    image_key: str | None
    image_alt: str
    content_available_in: list[str]
    industry_ids: list[UUID]
    category_ids: list[UUID]
    industries: list[Industry]
    categories: list[CaseStudyCategory]


class CaseStudyWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=128)
    short_heading: str = ""
    description: str = ""
    body: str = ""
    order: int = 0
    date: DateValue | None = None
    status: ContentStatus = ContentStatus.draft
    image_key: str | None = None
    image_alt: str = ""
    industry_ids: list[UUID] = Field(default_factory=list)
    category_ids: list[UUID] = Field(default_factory=list)


class EntityInUse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = "in_use"
    message_key: str


class EntityNotFound(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = "not_found"
    message_key: str
