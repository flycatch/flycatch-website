from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_ai_services import AccordionItem
from flycatch_api.schemas.admin_homes import ContentSeo


class DigitalTransformation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    slug: str
    banner_title: str
    banner_image_key: str | None
    banner_tag_line: str
    introduction_title: str
    introduction_first_paragraph: str
    introduction_second_paragraph: str
    accordion: list[AccordionItem]
    outcomes_image_key: str | None
    outcomes_title: str
    outcomes_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]
    seo: ContentSeo
    status: ContentStatus
    created_at: datetime


class DigitalTransformationSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    banner_title: str
    banner_image_key: str | None
    banner_tag_line: str
    state: ContentStatus


class DigitalTransformationList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[DigitalTransformationSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class DigitalTransformationWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    banner_title: str = Field(default="", max_length=200)
    banner_image_key: str | None = None
    banner_tag_line: str = Field(default="", max_length=200)
    introduction_title: str = Field(default="", max_length=200)
    introduction_first_paragraph: str = ""
    introduction_second_paragraph: str = ""
    accordion: list[AccordionItem] = Field(default_factory=list)
    outcomes_image_key: str | None = None
    outcomes_title: str = Field(default="", max_length=200)
    outcomes_description: str = ""
    faq_title: str = Field(default="", max_length=200)
    faq_description: str = ""
    faq_accordion: list[AccordionItem] = Field(default_factory=list)
    seo: ContentSeo = Field(default_factory=ContentSeo)
    status: ContentStatus = ContentStatus.draft
