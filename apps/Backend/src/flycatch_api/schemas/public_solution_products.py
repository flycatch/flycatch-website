from pydantic import BaseModel, ConfigDict, Field


class PublicSolutionProductSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str
    product_title: str
    product_description: str
    product_tag: str
    product_logo_key: str | None = None
    product_card_image_key: str | None = None
    card_image_on_right: bool = False
    order: int = 0


class PublicSolutionProductList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicSolutionProductSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicSolutionProduct(BaseModel):
    model_config = ConfigDict(extra="forbid")

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
