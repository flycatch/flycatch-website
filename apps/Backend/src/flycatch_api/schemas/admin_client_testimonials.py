from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.case_study import ContentStatus


class ClientTestimonial(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    client_name: str
    title: str
    review: str
    client_designation: str
    client_company: str
    country: str
    image_key: str | None
    alt_text: str
    is_clutch_review: bool
    order: int
    review_link: str
    content_available_in: list[str]
    status: ContentStatus
    created_at: datetime


class ClientTestimonialSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    client_name: str
    title: str
    review: str
    content_available_in: str
    state: ContentStatus


class ClientTestimonialList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ClientTestimonialSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class ClientTestimonialWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client_name: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=200)
    review: str = Field(min_length=1)
    client_designation: str = Field(default="", max_length=200)
    client_company: str = Field(default="", max_length=200)
    country: str = Field(default="", max_length=120)
    image_key: str | None = None
    alt_text: str = Field(default="", max_length=200)
    is_clutch_review: bool = False
    order: int = Field(default=0, ge=0)
    review_link: str = Field(default="", max_length=500)
    status: ContentStatus = ContentStatus.draft
