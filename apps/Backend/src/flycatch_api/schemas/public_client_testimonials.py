from pydantic import BaseModel, ConfigDict, Field


class PublicClientTestimonial(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client_name: str
    title: str
    review: str
    client_designation: str
    client_company: str
    country: str
    image_key: str | None
    alt_text: str
    is_clutch_review: bool
    order: int = Field(ge=0)
    review_link: str
    content_available_in: list[str]


class PublicClientTestimonialList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicClientTestimonial]
