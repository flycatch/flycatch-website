from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.blog import BlogStatus


class Author(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str


class AuthorList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[Author]


class AuthorWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)


class Category(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str


class CategoryList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[Category]


class CategoryWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)


class BlogSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    title: str
    slug: str
    author: str
    content_available_in: str
    state: BlogStatus


class BlogList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[BlogSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class BlogDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    title: str
    slug: str
    description: str
    body: str
    status: BlogStatus
    reading_time: int
    image_key: str | None
    image_alt: str
    canonical_url: str
    facebook: str
    linkedin: str
    twitter: str
    instagram: str
    full_name: str
    bio: str
    designation: str
    writer_image_keys: list[str]
    content_available_in: list[str]
    author_ids: list[UUID]
    category_ids: list[UUID]
    authors: list[Author]
    categories: list[Category]


class BlogWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=128)
    description: str = ""
    body: str = ""
    status: BlogStatus = BlogStatus.draft
    reading_time: int = Field(default=0, ge=0)
    image_key: str | None = None
    image_alt: str = ""
    canonical_url: str = ""
    facebook: str = ""
    linkedin: str = ""
    twitter: str = ""
    instagram: str = ""
    full_name: str = ""
    bio: str = ""
    designation: str = ""
    writer_image_keys: list[str] = Field(default_factory=list)
    author_ids: list[UUID] = Field(default_factory=list)
    category_ids: list[UUID] = Field(default_factory=list)


class MediaObject(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str


class EntityInUse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["in_use"] = "in_use"
    message_key: str


class EntityNotFound(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal["not_found"] = "not_found"
    message_key: str
