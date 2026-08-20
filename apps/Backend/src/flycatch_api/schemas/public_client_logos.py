from pydantic import BaseModel, ConfigDict


class PublicClientLogo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    colour_logo_key: str | None
    white_logo_key: str | None
    alt_text: str


class PublicClientLogoList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicClientLogo]
