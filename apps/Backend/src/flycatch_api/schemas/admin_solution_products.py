from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.case_study import ContentStatus


class SolutionProduct(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    product_title: str
    product_description: str
    product_tag: str
    product_logo_key: str | None
    product_card_image_key: str | None
    product_banner_image_key: str | None
    card_image_on_right: bool
    banner_image_on_right: bool
    slug: str
    order: int
    status: ContentStatus
    created_at: datetime


class SolutionProductSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    product_title: str
    product_description: str
    product_tag: str
    state: ContentStatus


class SolutionProductList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SolutionProductSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class SolutionProductWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_title: str = Field(min_length=1, max_length=200)
    product_description: str = ""
    product_tag: str = Field(default="", max_length=120)
    product_logo_key: str | None = None
    product_card_image_key: str | None = None
    product_banner_image_key: str | None = None
    card_image_on_right: bool = False
    banner_image_on_right: bool = False
    slug: str = Field(default="", max_length=128)
    order: int = Field(default=0, ge=0)
    status: ContentStatus = ContentStatus.draft
