from pydantic import BaseModel, ConfigDict, Field


class PublicAuthor(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    designation: str
    writer_image_keys: list[str]


class PublicAuthorProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    bio: str
    designation: str
    writer_image_keys: list[str]


class PublicCategory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str


class PublicAuthorList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicAuthorProfile]


class PublicCategoryList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicCategory]


class PublicBlogSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    slug: str
    description: str
    reading_time: int
    image_key: str | None
    image_alt: str
    authors: list[PublicAuthor]
    categories: list[PublicCategory]


class PublicBlogList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicBlogSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicBlogDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    slug: str
    description: str
    body: str
    reading_time: int
    image_key: str | None
    image_alt: str
    canonical_url: str
    facebook: str
    linkedin: str
    twitter: str
    instagram: str
    content_available_in: list[str]
    authors: list[PublicAuthor]
    categories: list[PublicCategory]
