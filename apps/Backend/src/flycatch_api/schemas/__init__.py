from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl


class SeoMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=70)
    description: str = Field(min_length=1, max_length=160)
    canonical_path: str = Field(pattern=r"^/")
    indexable: bool
    social_title: str | None = Field(default=None, max_length=70)
    social_description: str | None = Field(default=None, max_length=200)
    social_image_key: str | None = None
    primary_heading: str = Field(min_length=1)
    summary: str = Field(min_length=1, max_length=320)
    structured_data_templates: list[Literal["organization", "web_page", "faq"]] = Field(
        default_factory=list
    )


class PageContent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    seo: SeoMetadata
    body: str
    message_keys: dict[str, str] | None = None


class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    site_name: str = Field(min_length=1, max_length=80)
    default_locale: Literal["en"] = "en"
    locale_url_strategy: Literal["unprefixed_default"] = "unprefixed_default"
    robots_policy: Literal["index_public"] = "index_public"
    default_social_image_key: str | None = None
    canonical_origin: HttpUrl


class SignInRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1)


class SessionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    administrator_id: UUID
    email: EmailStr
    idle_expires_at: datetime


class AuthError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["unauthenticated", "invalid_credentials"]
    message_key: str


class FieldErrorDetail(BaseModel):
    message_key: str


class FieldErrors(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fields: dict[str, FieldErrorDetail]


class CsrfToken(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str


class Attribution(BaseModel):
    model_config = ConfigDict(extra="forbid")

    at: datetime
    by: UUID


class ManagedSiteSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["site_settings"] = "site_settings"
    slug: Literal["default"] = "default"
    draft: SiteSettings
    published: SiteSettings | None = None
    draft_updated: Attribution
    published_meta: Attribution | None = None


class ManagedPage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["page"] = "page"
    slug: str
    draft: PageContent
    published: PageContent | None = None
    draft_updated: Attribution
    published_meta: Attribution | None = None


class ActionDenied(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["forbidden", "csrf_failed"]
    message_key: str


class PublishRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["site_settings", "page"]
    slug: str


class PublishResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["site_settings", "page"]
    slug: str
    published_at: datetime
    snapshot_revision: str
    rebuild_required: Literal[True] = True


class PublishRejected(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["validation_failed"] = "validation_failed"
    message_key: str
    fields: dict[str, FieldErrorDetail] | None = None


class PublishedSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    revision: str
    written_at: datetime
    site_settings: SiteSettings
    pages: list[PageContent]


class NotImplementedResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["not_implemented"] = "not_implemented"
    message_key: str
