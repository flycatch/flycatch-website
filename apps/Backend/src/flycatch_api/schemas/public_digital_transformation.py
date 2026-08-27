from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.schemas.admin_ai_services import AccordionItem
from flycatch_api.schemas.admin_homes import ContentSeo


class PublicDigitalTransformationSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str
    banner_title: str
    banner_image_key: str | None
    banner_tag_line: str


class PublicDigitalTransformationList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicDigitalTransformationSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicDigitalTransformation(BaseModel):
    model_config = ConfigDict(extra="forbid")

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
