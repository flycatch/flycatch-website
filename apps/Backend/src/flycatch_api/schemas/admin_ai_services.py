from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_homes import ContentSeo


class IndustryItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(default="", max_length=200)
    image_key: str | None = None
    order: int = Field(default=0, ge=0)


class AccordionItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(default="", max_length=200)
    contents: str = ""
    order: int = Field(default=0, ge=0)


class AiService(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    slug: str
    banner_title: str
    banner_image_key: str | None
    introduction_title: str
    introduction_description: str
    solutions_title: str
    solutions_description: str
    industry_title: str
    industry_description: str
    industry_items: list[IndustryItem]
    ai_expertise_title: str
    ai_expertise_image_key: str | None
    ai_expertise_accordion: list[AccordionItem]
    ai_expertise_accordion_description: str
    solution_ids: list[UUID]
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]
    seo: ContentSeo
    status: ContentStatus
    created_at: datetime


class AiServiceSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    banner_title: str
    banner_image_key: str | None
    introduction_title: str
    state: ContentStatus


class AiServiceList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[AiServiceSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class AiServiceWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    banner_title: str = Field(default="", max_length=200)
    banner_image_key: str | None = None
    introduction_title: str = Field(default="", max_length=200)
    introduction_description: str = ""
    solutions_title: str = Field(default="", max_length=200)
    solutions_description: str = ""
    industry_title: str = Field(default="", max_length=200)
    industry_description: str = ""
    industry_items: list[IndustryItem] = Field(default_factory=list)
    ai_expertise_title: str = Field(default="", max_length=200)
    ai_expertise_image_key: str | None = None
    ai_expertise_accordion: list[AccordionItem] = Field(default_factory=list)
    ai_expertise_accordion_description: str = ""
    solution_ids: list[UUID] = Field(default_factory=list)
    faq_title: str = Field(default="", max_length=200)
    faq_description: str = ""
    faq_accordion: list[AccordionItem] = Field(default_factory=list)
    seo: ContentSeo = Field(default_factory=ContentSeo)
    status: ContentStatus = ContentStatus.draft
