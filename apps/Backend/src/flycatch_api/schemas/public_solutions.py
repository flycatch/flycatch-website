from pydantic import BaseModel, ConfigDict

from flycatch_api.schemas.admin_homes import ContentSeo


class PublicSolution(BaseModel):
    model_config = ConfigDict(extra="forbid")

    banner_image_key: str | None
    banner_title: str
    section_title: str
    seo: ContentSeo


class PublicSolutionList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicSolution]
