from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_ai_services import AccordionItem
from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.services.page_names import CLOUD_PAGE_NAMES, DATA_PAGE_NAMES

CloudPageName = Literal[
    "cloud-services",
    "cloud-consultation",
    "cloud-migration",
    "hybrid-cloud",
    "cloud-security",
    "cloud-optimization",
]
DataPageName = Literal[
    "data-management",
    "data-management-strategy",
    "data-engineering",
    "visualization-and-intelligence",
    "data-migration",
    "big-data-analytics",
]
PageName = CloudPageName | DataPageName


class NamedPage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    page_name: PageName
    banner_title: str
    banner_image_key: str | None
    introduction_title: str
    introduction_first_paragraph: str
    introduction_second_paragraph: str
    accordion: list[AccordionItem]
    offering_image_key: str | None
    offering_title: str
    offering_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]
    seo: ContentSeo
    status: ContentStatus
    created_at: datetime


class NamedPageSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    page_name: PageName
    banner_title: str
    banner_image_key: str | None
    introduction_title: str
    state: ContentStatus


class NamedPageList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[NamedPageSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class NamedPageWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    page_name: PageName
    banner_title: str = Field(default="", max_length=200)
    banner_image_key: str | None = None
    introduction_title: str = Field(default="", max_length=200)
    introduction_first_paragraph: str = ""
    introduction_second_paragraph: str = ""
    accordion: list[AccordionItem] = Field(default_factory=list)
    offering_image_key: str | None = None
    offering_title: str = Field(default="", max_length=200)
    offering_description: str = ""
    faq_title: str = Field(default="", max_length=200)
    faq_description: str = ""
    faq_accordion: list[AccordionItem] = Field(default_factory=list)
    seo: ContentSeo = Field(default_factory=ContentSeo)
    status: ContentStatus = ContentStatus.draft


class CloudServiceWrite(NamedPageWrite):
    page_name: CloudPageName


class DataAnalyticWrite(NamedPageWrite):
    page_name: DataPageName


CloudService = NamedPage
CloudServiceSummary = NamedPageSummary
CloudServiceList = NamedPageList
DataAnalytic = NamedPage
DataAnalyticSummary = NamedPageSummary
DataAnalyticList = NamedPageList

assert CLOUD_PAGE_NAMES and DATA_PAGE_NAMES
