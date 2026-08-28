from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.schemas.admin_ai_services import AccordionItem, IndustryItem
from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.schemas.public_solution_details import PublicSolutionDetail


class PublicAiServiceSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str
    banner_title: str
    banner_image_key: str | None
    introduction_title: str


class PublicAiServiceList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicAiServiceSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicAiService(BaseModel):
    model_config = ConfigDict(extra="forbid")

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
    solutions: list[PublicSolutionDetail]
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]
    seo: ContentSeo
