from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from flycatch_api.schemas.admin_homes import ContentSeo


class PublicApplicationWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=40)
    additional_info: str = ""
    opening_slug: str = ""
    website: str = Field(default="", max_length=200)
    recaptcha_token: str = ""
    current_ctc: float = Field(default=0, ge=0)
    expected_ctc: float = Field(default=0, ge=0)
    notice_period: float = Field(default=0, ge=0)
    experience: float = Field(default=0, ge=0)


class PublicApplication(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    resume_key: str | None
    resume_format: str
    name: str
    last_name: str
    email: str
    phone: str
    opened: bool
    current_ctc: float
    expected_ctc: float
    notice_period: float
    experience: float
    additional_info: str
    openings: str


class PublicApplicationList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicApplication]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicOpening(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: str
    exp_date: date | None
    role: str
    slug: str
    experience: str
    location: str
    job_type: str
    job_status: str
    specialization: str
    body: str
    applications: list[PublicApplication]


class PublicOpeningList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicOpening]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicEmployeeTestimonial(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    designation: str
    review: str
    image_key: str | None
    order: int
    listed: bool
    publish_date: date | None


class PublicEmployeeTestimonialList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicEmployeeTestimonial]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicEmailConfiguration(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    smtp_default_from: str
    smtp_default_reply_to: str
    smtp_admin_email: str


class PublicEmailConfigurationList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicEmailConfiguration]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicEmailTemplate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str
    type: str
    subject: str
    body: str


class PublicEmailTemplateList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicEmailTemplate]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicNewsCategory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID | None = None
    name: str


class PublicNewsCategoryList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicNewsCategory]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicAuthor(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    bio: str
    designation: str
    writer_image_keys: list[str]


class PublicNews(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    slug: str
    body: str
    news_categories: list[PublicNewsCategory]
    authors: list[PublicAuthor]
    image_key: str | None
    description: str
    button_name: str
    reading_time: int
    facebook: str
    linkedin: str
    twitter: str
    instagram: str
    youtube_url: str
    seo: ContentSeo


class PublicNewsList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicNews]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicResourcesCategory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID | None = None
    name: str


class PublicResourcesCategoryList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicResourcesCategory]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicResourceCategory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str


class PublicResource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_key: str | None
    reading_time: int
    title: str
    button_name: str
    slug: str
    pdf_key: str | None
    resource_categories: list[PublicResourceCategory]
    seo: ContentSeo


class PublicResourceList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicResource]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class MembershipImage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_key: str | None = None
    alt: str = ""


class PublicMembership(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    title: str
    description: str
    images: list[MembershipImage]
    seo: ContentSeo


class PublicMembershipList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicMembership]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicContactWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    country: str = Field(default="", max_length=120)
    phone: str = Field(min_length=1, max_length=40)
    subject: str = Field(default="", max_length=200)
    details: str = ""
    contact_type: str = Field(default="", max_length=120)
    company_name: str = Field(default="", max_length=200)
    website: str = Field(default="", max_length=200)
    recaptcha_token: str = ""


class PublicContact(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    last_name: str
    email: EmailStr
    country: str
    phone: str
    subject: str
    contact_date: date | None = None
    details: str
    contact_type: str
    company_name: str


class PublicContactList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicContact]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicDownload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    company: str
    file_key: str


class PublicDownloadRequestWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    company: str = Field(default="", max_length=200)
    website: str = Field(default="", max_length=200)
    recaptcha_token: str = ""


class PublicDownloadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    download_id: UUID
    name: str
    email: EmailStr
    company: str
    file_key: str


class PublicDownloadList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicDownload]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicServiceSectionItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_key: str | None = None
    types_title: str = ""
    contents: str = ""
    links: str = ""


class PublicFlycatchSaudiArabia(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    banner_title: str
    service_section: list[PublicServiceSectionItem]
    banner_explore_text: str
    services_title: str
    banner_image_key: str | None = None
    video_key: str | None = None
    seo: ContentSeo


class PublicFlycatchSaudiArabiaList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicFlycatchSaudiArabia]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicLegalPage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    slug: str
    body: str
    seo: ContentSeo


class PublicLegalPageList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicLegalPage]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


PublicPrivacyPolicy = PublicLegalPage
PublicPrivacyPolicyList = PublicLegalPageList
PublicTerms = PublicLegalPage
PublicTermsList = PublicLegalPageList


class PublicSubscriptionWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    website: str = Field(default="", max_length=200)
    recaptcha_token: str = ""


class PublicSubscription(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    email: EmailStr
    active: bool
    created_at: datetime


class PublicSubscriptionList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicSubscription]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)
