from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_homes import ContentSeo

Location = Literal["Kochi", "Saudi Arabia", "Hybrid", "Remote"]
JobType = Literal["Full-Time", "Part-Time", "Contract"]
JobStatus = Literal["Opening Soon", "Ongoing"]
Specialization = Literal[
    "Frontend",
    "Backend",
    "DevOps",
    "Testing",
    "BDE",
    "CMS",
    "FullStack",
    "UI/UX",
    "IT Recruiter",
]
EmailTemplateType = Literal["user_notification", "admin_notification"]


class Application(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    resume_key: str | None
    resume_format: str
    name: str
    last_name: str
    email: EmailStr
    phone: str
    opened: bool
    current_ctc: float = Field(ge=0)
    expected_ctc: float = Field(ge=0)
    notice_period: float = Field(ge=0)
    experience: float = Field(ge=0)
    additional_info: str
    openings: str
    status: ContentStatus
    created_at: datetime


class ApplicationSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    openings: str
    resume_format: str
    name: str
    state: ContentStatus


class ApplicationList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ApplicationSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class ApplicationWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    resume_key: str | None = None
    name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    opened: bool = False
    current_ctc: float = Field(default=0, ge=0)
    expected_ctc: float = Field(default=0, ge=0)
    notice_period: float = Field(default=0, ge=0)
    experience: float = Field(default=0, ge=0)
    additional_info: str = ""
    status: ContentStatus = ContentStatus.draft


class Opening(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    job_id: str
    exp_date: date | None
    role: str
    slug: str
    experience: str
    location: Location
    job_type: JobType
    job_status: JobStatus
    specialization: Specialization
    body: str
    application_ids: list[UUID]
    applications: list[Application]
    status: ContentStatus
    created_at: datetime


class OpeningSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    job_id: str
    exp_date: date | None
    role: str
    state: ContentStatus


class OpeningList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[OpeningSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class OpeningWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: str = Field(min_length=1, max_length=80)
    exp_date: date | None = None
    role: str = Field(min_length=1, max_length=200)
    slug: str = Field(default="", max_length=128)
    experience: str = Field(default="", max_length=200)
    location: Location = "Kochi"
    job_type: JobType = "Full-Time"
    job_status: JobStatus = "Ongoing"
    specialization: Specialization = "FullStack"
    body: str = ""
    application_ids: list[UUID] = Field(default_factory=list)
    status: ContentStatus = ContentStatus.draft


class EmployeeTestimonial(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    designation: str
    review: str
    image_key: str | None
    order: int = Field(ge=0)
    listed: bool
    publish_date: date | None
    status: ContentStatus
    created_at: datetime


class EmployeeTestimonialSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    designation: str
    image_key: str | None
    state: ContentStatus


class EmployeeTestimonialList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[EmployeeTestimonialSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class EmployeeTestimonialWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    designation: str = Field(default="", max_length=200)
    review: str = Field(min_length=1)
    image_key: str | None = None
    order: int = Field(default=0, ge=0)
    listed: bool = False
    publish_date: date | None = None
    status: ContentStatus = ContentStatus.draft


class EmailConfiguration(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    smtp_default_from: EmailStr
    smtp_default_reply_to: EmailStr
    smtp_admin_email: EmailStr
    status: ContentStatus
    created_at: datetime


class EmailConfigurationSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    smtp_default_from: str
    smtp_default_reply_to: str
    smtp_admin_email: str
    state: ContentStatus


class EmailConfigurationList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[EmailConfigurationSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class EmailConfigurationWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    smtp_default_from: EmailStr
    smtp_default_reply_to: EmailStr
    smtp_admin_email: EmailStr
    status: ContentStatus = ContentStatus.draft


class EmailTemplate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    body: str
    slug: str
    type: EmailTemplateType
    subject: str
    status: ContentStatus
    created_at: datetime


class EmailTemplateSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    slug: str
    type: EmailTemplateType
    subject: str
    state: ContentStatus


class EmailTemplateList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[EmailTemplateSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class EmailTemplateWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    body: str = ""
    slug: str = Field(min_length=1, max_length=128)
    type: EmailTemplateType
    subject: str = Field(min_length=1, max_length=200)
    status: ContentStatus = ContentStatus.draft


class NewsCategory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    status: ContentStatus
    created_at: datetime


class NewsCategorySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    state: ContentStatus


class NewsCategoryList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[NewsCategorySummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class NewsCategoryWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    status: ContentStatus = ContentStatus.draft


class NestedAuthor(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    bio: str
    designation: str
    writer_image_keys: list[str]
    status: ContentStatus


class News(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    title: str
    slug: str
    body: str
    news_category_ids: list[UUID]
    news_categories: list[NewsCategory]
    author_ids: list[UUID]
    authors: list[NestedAuthor]
    image_key: str | None
    description: str
    button_name: str
    reading_time: int = Field(ge=0)
    facebook: str
    linkedin: str
    twitter: str
    instagram: str
    youtube_url: str
    seo: ContentSeo
    status: ContentStatus
    created_at: datetime


class NewsSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    seo: str
    slug: str
    news_categories: int
    news_category_names: list[str]
    state: ContentStatus


class NewsList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[NewsSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class NewsWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    slug: str = Field(default="", max_length=128)
    body: str = ""
    news_category_ids: list[UUID] = Field(default_factory=list)
    author_ids: list[UUID] = Field(default_factory=list)
    image_key: str | None = None
    description: str = ""
    button_name: str = Field(default="", max_length=120)
    reading_time: int = Field(default=0, ge=0)
    facebook: str = ""
    linkedin: str = ""
    twitter: str = ""
    instagram: str = ""
    youtube_url: str = ""
    seo: ContentSeo = Field(default_factory=ContentSeo)
    status: ContentStatus = ContentStatus.draft


class ResourcesCategory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    status: ContentStatus
    created_at: datetime


class ResourcesCategorySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    state: ContentStatus


class ResourcesCategoryList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ResourcesCategorySummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class ResourcesCategoryWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    status: ContentStatus = ContentStatus.draft


class Resource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    image_key: str | None
    reading_time: int = Field(ge=0)
    title: str
    button_name: str
    slug: str
    pdf_key: str | None
    resource_category_ids: list[UUID]
    resource_categories: list[ResourcesCategory]
    seo: ContentSeo
    status: ContentStatus
    created_at: datetime


class ResourceSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    seo: str
    created_at: datetime
    image_key: str | None
    state: ContentStatus


class ResourceList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ResourceSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class ResourceWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_key: str | None = None
    reading_time: int = Field(default=0, ge=0)
    title: str = Field(min_length=1, max_length=200)
    button_name: str = Field(default="", max_length=120)
    slug: str = Field(default="", max_length=128)
    pdf_key: str | None = None
    resource_category_ids: list[UUID] = Field(default_factory=list)
    seo: ContentSeo = Field(default_factory=ContentSeo)
    status: ContentStatus = ContentStatus.draft


class MembershipImage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_key: str | None = None
    alt: str = ""


class Membership(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    title: str
    description: str
    images: list[MembershipImage]
    seo: ContentSeo
    status: ContentStatus
    created_at: datetime


class MembershipSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    title: str
    images: int
    seo_title: str
    state: ContentStatus


class MembershipList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[MembershipSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class MembershipWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    images: list[MembershipImage] = Field(default_factory=list)
    seo: ContentSeo = Field(default_factory=ContentSeo)
    status: ContentStatus = ContentStatus.draft
