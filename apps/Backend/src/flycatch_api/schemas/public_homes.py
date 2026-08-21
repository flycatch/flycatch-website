from pydantic import BaseModel, ConfigDict

from flycatch_api.schemas.admin_homes import ContentSeo, HomeFaq, HomeService
from flycatch_api.schemas.public_case_studies import PublicCaseStudyDetail


class PublicHome(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    video_key: str | None
    banner_title: str
    seo: ContentSeo
    case_studies: list[PublicCaseStudyDetail]
    services: list[HomeService]
    banner_explore_text: str
    faq_title: str
    faq_description: str
    faqs: list[HomeFaq]
    content_available_in: list[str]


class PublicHomeList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicHome]
