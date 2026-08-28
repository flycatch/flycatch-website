from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from flycatch_api.models.case_study import ContentStatus
from flycatch_api.models.solution_detail import SolutionDetail
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import EntityNotFound
from flycatch_api.schemas.admin_homes import ContentSeo
from flycatch_api.schemas.admin_solution_details import (
    BenefitsBlock,
    ChallengesBlock,
    IntroductionBlock,
    SolutionBanner,
    SolutionCta,
    SolutionDetailList,
    SolutionDetailSummary,
    SolutionDetailWrite,
    SolutionsSection,
    SolutionTypeItem,
)
from flycatch_api.schemas.admin_solution_details import (
    SolutionDetail as SolutionDetailSchema,
)
from flycatch_api.schemas.public_solution_details import (
    PublicSolutionDetail,
    PublicSolutionDetailList,
    PublicSolutionDetailSummary,
)
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.industry_service import PER_PAGE, coerce_status
from flycatch_api.services.text import is_valid_media_key, is_valid_slug, sanitize_html, slugify


def _optional_key(value: str | None, field: str) -> str | None:
    key = value or None
    if key and not is_valid_media_key(key):
        raise CatalogError(
            422,
            FieldErrors(
                fields={field: FieldErrorDetail(message_key="admin.media.type.invalid")}
            ).model_dump(),
        )
    return key


def _seo(payload: ContentSeo) -> dict:
    return {
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "canonical_url": payload.canonical_url.strip(),
        "meta_title": payload.meta_title.strip(),
        "h1_tag": payload.h1_tag.strip(),
        "image_alt": payload.image_alt.strip(),
        "image_key": _optional_key(payload.image_key, "seo.image_key"),
    }


def _types(items: list[SolutionTypeItem], prefix: str, html: bool) -> list[dict]:
    result: list[dict] = []
    for index, item in enumerate(items):
        description = sanitize_html(item.description) if html else item.description.strip()
        result.append(
            {
                "image_key": _optional_key(item.image_key, f"{prefix}.{index}.image_key"),
                "description": description,
                "order": item.order,
                "title": item.title.strip(),
            }
        )
    return result


def _banner(payload: SolutionBanner) -> dict:
    return {
        "image_key": _optional_key(payload.image_key, "banner.image_key"),
        "title": payload.title.strip(),
        "sub_title": payload.sub_title.strip(),
        "industry_type": payload.industry_type.strip(),
    }


def _first_item(block: dict) -> dict:
    items = block.get("items") if isinstance(block.get("items"), list) else []
    first = items[0] if items else {}
    return first if isinstance(first, dict) else {}


def _heading_items(items: object) -> list[dict]:
    result: list[dict] = []
    if not isinstance(items, list):
        return result
    for item in items:
        if not isinstance(item, dict):
            continue
        result.append(
            {
                "title": str(item.get("title") or ""),
                "order": max(0, int(item.get("order") or 0)),
                "color": str(item.get("color") or ""),
            }
        )
    return result


def _collected_types(block: dict) -> list:
    if isinstance(block.get("types"), list):
        return [row for row in block["types"] if isinstance(row, dict)]
    collected: list = []
    items = block.get("items") if isinstance(block.get("items"), list) else []
    for item in items:
        if not isinstance(item, dict):
            continue
        types = item.get("types") if isinstance(item.get("types"), list) else []
        collected.extend(row for row in types if isinstance(row, dict))
    return collected


def _icon_keys(block: dict, first: dict) -> list[str]:
    raw = block.get("icon_keys")
    if isinstance(raw, list):
        return [str(key) for key in raw if key]
    for candidate in (block.get("icon_key"), first.get("icon_key")):
        if candidate:
            return [str(candidate)]
    return []


def normalize_introduction(raw: object) -> dict:
    block = raw if isinstance(raw, dict) else {}
    first = _first_item(block)
    return {
        "items": [
            {"title": item["title"], "order": item["order"], "color": item["color"]}
            for item in _heading_items(block.get("items"))
        ],
        "description": str(block.get("description") or first.get("description") or ""),
        "icon_keys": _icon_keys(block, first),
        "sub_title": str(block.get("sub_title") or first.get("sub_title") or ""),
        "sub_description": str(block.get("sub_description") or first.get("sub_description") or ""),
        "image_key": block.get("image_key") or first.get("image_key"),
    }


def normalize_challenges(raw: object) -> dict:
    block = raw if isinstance(raw, dict) else {}
    first = _first_item(block)
    return {
        "items": [
            {"title": item["title"], "order": item["order"], "color": item["color"]}
            for item in _heading_items(block.get("items"))
        ],
        "description": str(block.get("description") or first.get("description") or ""),
        "image_key": block.get("image_key") or first.get("image_key"),
        "name": str(block.get("name") or first.get("name") or ""),
        "position": str(block.get("position") or first.get("position") or ""),
        "types": _collected_types(block),
    }


def normalize_benefits(raw: object) -> dict:
    block = raw if isinstance(raw, dict) else {}
    first = _first_item(block)
    return {
        "items": [
            {"title": item["title"], "order": item["order"], "color": item["color"]}
            for item in _heading_items(block.get("items"))
        ],
        "description": str(block.get("description") or first.get("description") or ""),
        "types": _collected_types(block),
    }


def normalize_solutions_section(raw: object) -> dict:
    block = raw if isinstance(raw, dict) else {}
    keys = block.get("image_keys") if isinstance(block.get("image_keys"), list) else []
    image_key = block.get("image_key") or (keys[0] if keys else None)
    return {
        "title": str(block.get("title") or ""),
        "image_key": image_key,
        "description": str(block.get("description") or ""),
    }


def normalize_cta(raw: object) -> dict:
    block = raw if isinstance(raw, dict) else {}
    return {
        "title": str(block.get("title") or ""),
        "description": str(block.get("description") or ""),
        "button_name": str(block.get("button_name") or ""),
    }


def _first_title(items: object) -> str:
    if not isinstance(items, list):
        return ""
    for item in items:
        if isinstance(item, dict) and item.get("title"):
            return str(item["title"])
    return ""


def _introduction(payload: IntroductionBlock) -> dict:
    items: list[dict] = []
    for item in payload.items:
        items.append(
            {
                "title": item.title.strip(),
                "order": item.order,
                "color": item.color.strip(),
            }
        )
    icon_keys: list[str] = []
    for index, key in enumerate(payload.icon_keys):
        resolved = _optional_key(key, f"introduction.icon_keys.{index}")
        if resolved:
            icon_keys.append(resolved)
    return {
        "items": items,
        "description": payload.description.strip(),
        "icon_keys": icon_keys,
        "sub_title": payload.sub_title.strip(),
        "sub_description": sanitize_html(payload.sub_description),
        "image_key": _optional_key(payload.image_key, "introduction.image_key"),
    }


def _challenges(payload: ChallengesBlock) -> dict:
    items: list[dict] = []
    for item in payload.items:
        items.append(
            {
                "title": item.title.strip(),
                "order": item.order,
                "color": item.color.strip(),
            }
        )
    return {
        "items": items,
        "description": sanitize_html(payload.description),
        "image_key": _optional_key(payload.image_key, "challenges.image_key"),
        "name": payload.name.strip(),
        "position": payload.position.strip(),
        "types": _types(payload.types, "challenges.types", html=True),
    }


def _benefits(payload: BenefitsBlock) -> dict:
    items: list[dict] = []
    for item in payload.items:
        items.append(
            {
                "title": item.title.strip(),
                "order": item.order,
                "color": item.color.strip(),
            }
        )
    return {
        "items": items,
        "description": payload.description.strip(),
        "types": _types(payload.types, "benefits.types", html=True),
    }


def _solutions_section(payload: SolutionsSection) -> dict:
    return {
        "title": payload.title.strip(),
        "image_key": _optional_key(payload.image_key, "solutions_section.image_key"),
        "description": payload.description.strip(),
    }


def _cta(payload: SolutionCta) -> dict:
    return {
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "button_name": payload.button_name.strip(),
    }


def detail_schema(row: SolutionDetail) -> SolutionDetailSchema:
    return SolutionDetailSchema(
        id=row.id,
        title=row.title,
        slug=row.slug,
        banner=SolutionBanner.model_validate(row.banner or {}),
        introduction=IntroductionBlock.model_validate(normalize_introduction(row.introduction)),
        challenges=ChallengesBlock.model_validate(normalize_challenges(row.challenges)),
        benefits=BenefitsBlock.model_validate(normalize_benefits(row.benefits)),
        solutions_section=SolutionsSection.model_validate(
            normalize_solutions_section(row.solutions_section)
        ),
        cta=SolutionCta.model_validate(normalize_cta(row.cta)),
        seo=ContentSeo.model_validate(row.seo or {}),
        status=row.status,
        created_at=row.created_at,
    )


def public_detail(row: SolutionDetail) -> PublicSolutionDetail:
    schema = detail_schema(row)
    return PublicSolutionDetail(
        title=schema.title,
        slug=schema.slug,
        banner=schema.banner,
        introduction=schema.introduction,
        challenges=schema.challenges,
        benefits=schema.benefits,
        solutions_section=schema.solutions_section,
        cta=schema.cta,
        seo=schema.seo,
    )


class SolutionDetailService:
    def list_details(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> SolutionDetailList:
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=False)
        return SolutionDetailList(
            items=[
                SolutionDetailSummary(
                    id=row.id,
                    title=row.title,
                    banner_title=(row.banner or {}).get("title", "") or "",
                    introduction_title=_first_title((row.introduction or {}).get("items")),
                    challenges_title=_first_title((row.challenges or {}).get("items")),
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(
        self, db: Session, q: str | None, page: int, per_page: int
    ) -> PublicSolutionDetailList:
        page, per_page, rows, total = self._page(db, q, page, per_page, published_only=True)
        return PublicSolutionDetailList(
            items=[
                PublicSolutionDetailSummary(
                    slug=row.slug,
                    title=row.title,
                    banner=SolutionBanner.model_validate(row.banner or {}),
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def get_published_by_slug(self, db: Session, slug: str) -> PublicSolutionDetail:
        row = (
            db.query(SolutionDetail)
            .filter(
                func.lower(SolutionDetail.slug) == slug.strip().lower(),
                SolutionDetail.status == ContentStatus.publish,
            )
            .first()
        )
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="public.solution_details.not_found").model_dump(),
            )
        return public_detail(row)

    def get(self, db: Session, detail_id: UUID) -> SolutionDetailSchema:
        return detail_schema(self._row(db, detail_id))

    def create(self, db: Session, payload: SolutionDetailWrite) -> SolutionDetailSchema:
        now = datetime.now(UTC)
        row = SolutionDetail(created_at=now, updated_at=now)
        self._apply(db, row, payload, None)
        db.add(row)
        db.commit()
        return detail_schema(row)

    def update(
        self, db: Session, detail_id: UUID, payload: SolutionDetailWrite
    ) -> SolutionDetailSchema:
        row = self._row(db, detail_id)
        self._apply(db, row, payload, row.id)
        row.updated_at = datetime.now(UTC)
        db.commit()
        return detail_schema(row)

    def delete(self, db: Session, detail_id: UUID) -> None:
        row = self._row(db, detail_id)
        db.delete(row)
        db.commit()

    def _page(
        self,
        db: Session,
        q: str | None,
        page: int,
        per_page: int,
        *,
        published_only: bool,
    ) -> tuple[int, int, list[SolutionDetail], int]:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(SolutionDetail)
        if published_only:
            query = query.filter(SolutionDetail.status == ContentStatus.publish)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(SolutionDetail.title.ilike(term), SolutionDetail.slug.ilike(term))
            )
        total = query.count()
        rows = (
            query.order_by(SolutionDetail.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return page, per_page, rows, total

    def _row(self, db: Session, detail_id: UUID) -> SolutionDetail:
        row = db.get(SolutionDetail, detail_id)
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.solution_details.not_found").model_dump(),
            )
        return row

    def _apply(
        self,
        db: Session,
        row: SolutionDetail,
        payload: SolutionDetailWrite,
        detail_id: UUID | None,
    ) -> None:
        title = payload.title.strip()
        if not title:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={"title": FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        slug = slugify(payload.slug) or slugify(title)
        if not is_valid_slug(slug):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "slug": FieldErrorDetail(message_key="admin.solution_details.slug.invalid")
                    }
                ).model_dump(),
            )
        existing = (
            db.query(SolutionDetail)
            .filter(func.lower(SolutionDetail.slug) == slug.lower())
            .first()
        )
        if existing is not None and existing.id != detail_id:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "slug": FieldErrorDetail(
                            message_key="admin.solution_details.slug.duplicate"
                        )
                    }
                ).model_dump(),
            )
        row.title = title
        row.slug = slug
        row.banner = _banner(payload.banner)
        row.introduction = _introduction(payload.introduction)
        row.challenges = _challenges(payload.challenges)
        row.benefits = _benefits(payload.benefits)
        row.solutions_section = _solutions_section(payload.solutions_section)
        row.cta = _cta(payload.cta)
        row.seo = _seo(payload.seo)
        row.status = coerce_status(payload.status)
