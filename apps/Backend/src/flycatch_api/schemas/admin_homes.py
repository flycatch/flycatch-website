from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.case_study import ContentStatus


class ContentSeo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(default="", max_length=200)
    description: str = Field(default="", max_length=500)
    canonical_url: str = Field(default="", max_length=500)
    meta_title: str = Field(default="", max_length=200)
    image_key: str | None = None


class HomeService(BaseModel):
    model_config = ConfigDict(extra="forbid")

    services_types_title: str = Field(default="", max_length=200)
    services_image_key: str | None = None
    services_contents: str = ""
    our_services_links: str = ""


class HomeFaq(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(default="", max_length=200)
    contents: str = ""


class Home(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    title: str
    video_key: str | None
    video_content_type: str | None
    banner_title: str
    seo: ContentSeo
    case_study_ids: list[UUID]
    services: list[HomeService]
    banner_explore_text: str
    faq_title: str
    faq_description: str
    faqs: list[HomeFaq]
    content_available_in: list[str]
    status: ContentStatus
    created_at: datetime


class HomeSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    title: str
    video_format: str
    created_at: datetime
    content_available_in: str
    state: ContentStatus


class HomeList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[HomeSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class HomeWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    video_key: str | None = None
    video_content_type: str | None = Field(default=None, max_length=100)
    banner_title: str = Field(default="", max_length=200)
    seo: ContentSeo = Field(default_factory=ContentSeo)
    case_study_ids: list[UUID] = Field(default_factory=list)
    services: list[HomeService] = Field(default_factory=list)
    banner_explore_text: str = Field(default="", max_length=200)
    faq_title: str = Field(default="", max_length=200)
    faq_description: str = ""
    faqs: list[HomeFaq] = Field(default_factory=list)
    status: ContentStatus = ContentStatus.draft
