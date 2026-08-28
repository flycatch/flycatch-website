from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.schemas.admin_ai_services import AccordionItem
from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.schemas.admin_named_pages import PageName


class PublicNamedPageSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    page_name: PageName
    banner_title: str
    banner_image_key: str | None
    introduction_title: str


class PublicNamedPageList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicNamedPageSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicNamedPage(BaseModel):
    model_config = ConfigDict(extra="forbid")

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


PublicCloudService = PublicNamedPage
PublicCloudServiceList = PublicNamedPageList
PublicCloudServiceSummary = PublicNamedPageSummary
PublicDataAnalytic = PublicNamedPage
PublicDataAnalyticList = PublicNamedPageList
PublicDataAnalyticSummary = PublicNamedPageSummary
