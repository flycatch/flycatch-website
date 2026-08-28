from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_ai_services import AccordionItem
from flycatch_api.schemas.admin_homes import ContentSeo


class LandingWriteBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    banner_title: str = Field(default="", max_length=200)
    banner_image_key: str | None = None
    introduction_title: str = Field(default="", max_length=200)
    introduction_first_paragraph: str = ""
    introduction_second_paragraph: str = ""
    seo: ContentSeo = Field(default_factory=ContentSeo)
    status: ContentStatus = ContentStatus.draft


class DevOpsConsultWrite(LandingWriteBase):
    experience_title: str = Field(default="", max_length=200)
    experience_accordion: list[AccordionItem] = Field(default_factory=list)
    experience_image_key: str | None = None
    experience_description: str = ""
    faq_title: str = Field(default="", max_length=200)
    faq_description: str = ""
    faq_accordion: list[AccordionItem] = Field(default_factory=list)


class InfrastructureManagementWrite(LandingWriteBase):
    faq_title: str = Field(default="", max_length=200)
    faq_description: str = ""
    faq_accordion: list[AccordionItem] = Field(default_factory=list)


class ApplicationDevelopmentWrite(LandingWriteBase):
    accordion: list[AccordionItem] = Field(default_factory=list)
    offering_image_key: str | None = None
    offering_title: str = Field(default="", max_length=200)
    offering_description: str = ""
    faq_title: str = Field(default="", max_length=200)
    faq_description: str = ""
    faq_accordion: list[AccordionItem] = Field(default_factory=list)


class ApplicationModernizationWrite(LandingWriteBase):
    accordion: list[AccordionItem] = Field(default_factory=list)
    offering_image_key: str | None = None
    offering_title: str = Field(default="", max_length=200)
    offering_description: str = ""
    faq_title: str = Field(default="", max_length=200)
    faq_description: str = ""
    faq_accordion: list[AccordionItem] = Field(default_factory=list)


class MobileApplicationDevelopmentWrite(LandingWriteBase):
    introduction_third_paragraph: str = ""
    accordion: list[AccordionItem] = Field(default_factory=list)
    offering_image_key: str | None = None
    offering_title: str = Field(default="", max_length=200)
    offering_description: str = ""
    faq_title: str = Field(default="", max_length=200)
    faq_description: str = ""
    faq_accordion: list[AccordionItem] = Field(default_factory=list)


class UserCenteredDesignWrite(LandingWriteBase):
    accordion: list[AccordionItem] = Field(default_factory=list)
    offering_image_key: str | None = None
    offering_title: str = Field(default="", max_length=200)
    offering_description: str = ""
    faq_title: str = Field(default="", max_length=200)
    faq_description: str = ""
    faq_accordion: list[AccordionItem] = Field(default_factory=list)


class OverviewWrite(LandingWriteBase):
    pass


class LandingCore(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    slug: str
    banner_title: str
    banner_image_key: str | None
    introduction_title: str
    introduction_first_paragraph: str
    introduction_second_paragraph: str
    seo: ContentSeo
    status: ContentStatus
    created_at: datetime


class DevOpsConsult(LandingCore):
    experience_title: str
    experience_accordion: list[AccordionItem]
    experience_image_key: str | None
    experience_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]


class InfrastructureManagement(LandingCore):
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]


class ApplicationDevelopment(LandingCore):
    accordion: list[AccordionItem]
    offering_image_key: str | None
    offering_title: str
    offering_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]
    content_available_in: list[str]


class ApplicationModernization(LandingCore):
    accordion: list[AccordionItem]
    offering_image_key: str | None
    offering_title: str
    offering_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]


class MobileApplicationDevelopment(LandingCore):
    introduction_third_paragraph: str
    accordion: list[AccordionItem]
    offering_image_key: str | None
    offering_title: str
    offering_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]


class UserCenteredDesign(LandingCore):
    accordion: list[AccordionItem]
    offering_image_key: str | None
    offering_title: str
    offering_description: str
    faq_title: str
    faq_description: str
    faq_accordion: list[AccordionItem]


class Overview(LandingCore):
    pass


class IntroTitleSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    banner_title: str
    banner_image_key: str | None
    introduction_title: str
    state: ContentStatus


class IntroFirstSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    banner_title: str
    banner_image_key: str | None
    introduction_first_paragraph: str
    content_available_in: str
    state: ContentStatus


class SeoSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    banner_title: str
    banner_image_key: str | None
    seo: str
    state: ContentStatus


class DevOpsConsultSummary(IntroTitleSummary):
    pass


class InfrastructureManagementSummary(IntroTitleSummary):
    pass


class ApplicationDevelopmentSummary(IntroFirstSummary):
    pass


class ApplicationModernizationSummary(SeoSummary):
    pass


class MobileApplicationDevelopmentSummary(SeoSummary):
    pass


class UserCenteredDesignSummary(IntroTitleSummary):
    pass


class OverviewSummary(IntroTitleSummary):
    pass


class LandingListBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class DevOpsConsultList(LandingListBase):
    items: list[DevOpsConsultSummary]


class InfrastructureManagementList(LandingListBase):
    items: list[InfrastructureManagementSummary]


class ApplicationDevelopmentList(LandingListBase):
    items: list[ApplicationDevelopmentSummary]


class ApplicationModernizationList(LandingListBase):
    items: list[ApplicationModernizationSummary]


class MobileApplicationDevelopmentList(LandingListBase):
    items: list[MobileApplicationDevelopmentSummary]


class UserCenteredDesignList(LandingListBase):
    items: list[UserCenteredDesignSummary]


class OverviewList(LandingListBase):
    items: list[OverviewSummary]
