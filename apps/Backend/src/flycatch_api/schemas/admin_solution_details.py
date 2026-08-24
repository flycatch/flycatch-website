from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.schemas.admin_homes import ContentSeo


class SolutionTypeItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_key: str | None = None
    description: str = ""
    order: int = Field(default=0, ge=0)
    title: str = Field(default="", max_length=200)


class SolutionBanner(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_key: str | None = None
    title: str = Field(default="", max_length=200)
    sub_title: str = Field(default="", max_length=200)
    industry_type: str = Field(default="", max_length=120)


class IntroductionItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(default="", max_length=200)
    order: int = Field(default=0, ge=0)
    color: str = Field(default="", max_length=20)


class IntroductionBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[IntroductionItem] = Field(default_factory=list)
    description: str = ""
    icon_keys: list[str] = Field(default_factory=list)
    sub_title: str = Field(default="", max_length=200)
    sub_description: str = ""
    image_key: str | None = None


class ChallengeItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(default="", max_length=200)
    order: int = Field(default=0, ge=0)
    color: str = Field(default="", max_length=20)


class ChallengesBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ChallengeItem] = Field(default_factory=list)
    description: str = ""
    image_key: str | None = None
    name: str = Field(default="", max_length=200)
    position: str = Field(default="", max_length=200)
    types: list[SolutionTypeItem] = Field(default_factory=list)


class BenefitItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(default="", max_length=200)
    order: int = Field(default=0, ge=0)
    color: str = Field(default="", max_length=20)


class BenefitsBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[BenefitItem] = Field(default_factory=list)
    description: str = ""
    types: list[SolutionTypeItem] = Field(default_factory=list)


class SolutionsSection(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(default="", max_length=200)
    image_key: str | None = None
    description: str = ""


class SolutionCta(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(default="", max_length=200)
    description: str = ""
    button_name: str = Field(default="", max_length=200)


class SolutionDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    title: str
    slug: str
    banner: SolutionBanner
    introduction: IntroductionBlock
    challenges: ChallengesBlock
    benefits: BenefitsBlock
    solutions_section: SolutionsSection
    cta: SolutionCta
    seo: ContentSeo
    status: ContentStatus
    created_at: datetime


class SolutionDetailSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    banner_title: str
    introduction_title: str
    challenges_title: str
    state: ContentStatus


class SolutionDetailList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SolutionDetailSummary]
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total: int = Field(ge=0)


class SolutionDetailWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    slug: str = Field(default="", max_length=128)
    banner: SolutionBanner = Field(default_factory=SolutionBanner)
    introduction: IntroductionBlock = Field(default_factory=IntroductionBlock)
    challenges: ChallengesBlock = Field(default_factory=ChallengesBlock)
    benefits: BenefitsBlock = Field(default_factory=BenefitsBlock)
    solutions_section: SolutionsSection = Field(default_factory=SolutionsSection)
    cta: SolutionCta = Field(default_factory=SolutionCta)
    seo: ContentSeo = Field(default_factory=ContentSeo)
    status: ContentStatus = ContentStatus.draft
