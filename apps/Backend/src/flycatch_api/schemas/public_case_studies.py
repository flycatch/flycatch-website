from datetime import date as DateValue

from pydantic import BaseModel, ConfigDict, Field


class PublicNamedItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str


class PublicTechnology(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    logo_key: str | None


class PublicTechnologyList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicTechnology]


class PublicCaseStudySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str
    slug: str
    short_heading: str
    description: str
    order: int
    date: DateValue | None
    image_key: str | None
    image_alt: str
    industries: list[PublicNamedItem]
    categories: list[PublicNamedItem]
    technologies: list[PublicTechnology]


class PublicCaseStudyList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicCaseStudySummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicCaseStudyDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str
    slug: str
    short_heading: str
    description: str
    body: str
    order: int
    date: DateValue | None
    image_key: str | None
    image_alt: str
    content_available_in: list[str]
    industries: list[PublicNamedItem]
    categories: list[PublicNamedItem]
    technologies: list[PublicTechnology]
