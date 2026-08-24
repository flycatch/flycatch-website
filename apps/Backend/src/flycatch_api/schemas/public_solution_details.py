from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.schemas.admin_solution_details import (
    BenefitsBlock,
    ChallengesBlock,
    IntroductionBlock,
    SolutionBanner,
    SolutionCta,
    SolutionsSection,
)


class PublicSolutionDetailSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str
    title: str
    banner: SolutionBanner


class PublicSolutionDetailList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PublicSolutionDetailSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class PublicSolutionDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    slug: str
    banner: SolutionBanner
    introduction: IntroductionBlock
    challenges: ChallengesBlock
    benefits: BenefitsBlock
    solutions_section: SolutionsSection
    cta: SolutionCta
    seo: ContentSeo
