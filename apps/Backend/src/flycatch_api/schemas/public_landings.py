from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.schemas.admin_ai_services import AccordionItem
from flycatch_api.schemas.admin_homes import ContentSeo


class PublicLandingSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str
    banner_title: str
    banner_image_key: str | None


class PublicLandingList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicLandingSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicLandingCore(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str
    banner_title: str
    banner_image_key: str | None
    introduction_title: str
    introduction_first_paragraph: str
    introduction_second_paragraph: str
    seo: ContentSeo


class PublicDevOpsConsult(PublicLandingCore):
    experience_title: str
    experience_accordion: list[AccordionItem]
    experience_image_key: str | None
    experience_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]


class PublicInfrastructureManagement(PublicLandingCore):
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]


class PublicApplicationDevelopment(PublicLandingCore):
    accordion: list[AccordionItem]
    offering_image_key: str | None
    offering_title: str
    offering_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]
    content_available_in: list[str]


class PublicApplicationModernization(PublicLandingCore):
    accordion: list[AccordionItem]
    offering_image_key: str | None
    offering_title: str
    offering_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]


class PublicMobileApplicationDevelopment(PublicLandingCore):
    introduction_third_paragraph: str
    accordion: list[AccordionItem]
    offering_image_key: str | None
    offering_title: str
    offering_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]


class PublicUserCenteredDesign(PublicLandingCore):
    accordion: list[AccordionItem]
    offering_image_key: str | None
    offering_title: str
    offering_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]


class PublicOverview(PublicLandingCore):
    pass
