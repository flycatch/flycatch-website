from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from flycatch_api.models.case_study import CaseStudy, ContentStatus
from flycatch_api.models.case_study_category import CaseStudyCategoryLink
from flycatch_api.models.home import Home, HomeCaseStudy
from flycatch_api.models.industry import CaseStudyIndustry
from flycatch_api.models.technology import CaseStudyTechnology
from flycatch_api.schemas.admin_auth import FieldErrorDetail, FieldErrors
from flycatch_api.schemas.admin_case_studies import EntityNotFound
from flycatch_api.schemas.admin_homes import (
    ContentSeo,
    HomeFaq,
    HomeList,
    HomeSummary,
    HomeWrite,
)
from flycatch_api.schemas.admin_homes import (
    Home as HomeSchema,
)
from flycatch_api.schemas.admin_homes import (
    HomeService as HomeServiceItem,
)
from flycatch_api.schemas.public_homes import PublicHome, PublicHomeList
from flycatch_api.services.author_service import CatalogError
from flycatch_api.services.case_study_service import CaseStudyService
from flycatch_api.services.industry_service import PER_PAGE, coerce_status
from flycatch_api.services.text import is_valid_media_key, sanitize_html

DEFAULT_LOCALE = "en"
LOCALE_LABEL = "En"

_VIDEO_FORMATS = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
}
_case_studies = CaseStudyService()


def video_format(row: Home) -> str:
    if row.video_content_type:
        mapped = _VIDEO_FORMATS.get(row.video_content_type.lower())
        if mapped:
            return mapped
    if row.video_key and "." in row.video_key:
        return row.video_key.rsplit(".", 1)[-1].lower()
    return ""


def _seo(payload: ContentSeo) -> dict:
    image_key = payload.image_key or None
    if image_key and not is_valid_media_key(image_key):
        raise CatalogError(
            422,
            FieldErrors(
                fields={"seo.image_key": FieldErrorDetail(message_key="admin.media.type.invalid")}
            ).model_dump(),
        )
    return {
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "canonical_url": payload.canonical_url.strip(),
        "meta_title": payload.meta_title.strip(),
        "image_key": image_key,
    }


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


def _services(payload: list[HomeServiceItem]) -> list[dict]:
    items: list[dict] = []
    for index, item in enumerate(payload):
        items.append(
            {
                "services_types_title": item.services_types_title.strip(),
                "services_image_key": _optional_key(
                    item.services_image_key, f"services.{index}.services_image_key"
                ),
                "services_contents": item.services_contents.strip(),
                "our_services_links": item.our_services_links.strip(),
            }
        )
    return items


def _faqs(payload: list[HomeFaq]) -> list[dict]:
    return [
        {"title": item.title.strip(), "contents": item.contents.strip()} for item in payload
    ]


def home_schema(row: Home) -> HomeSchema:
    return HomeSchema(
        id=row.id,
        title=row.title,
        video_key=row.video_key,
        video_content_type=row.video_content_type,
        banner_title=row.banner_title,
        seo=ContentSeo.model_validate(row.seo or {}),
        case_study_ids=[link.case_study_id for link in row.case_study_links],
        services=[HomeServiceItem.model_validate(item) for item in (row.services or [])],
        banner_explore_text=row.banner_explore_text,
        faq_title=row.faq_title,
        faq_description=row.faq_description,
        faqs=[HomeFaq.model_validate(item) for item in (row.faqs or [])],
        content_available_in=list(row.content_available_in or [DEFAULT_LOCALE]),
        status=row.status,
        created_at=row.created_at,
    )


def public_home(row: Home) -> PublicHome:
    return PublicHome(
        title=row.title,
        video_key=row.video_key,
        banner_title=row.banner_title,
        seo=ContentSeo.model_validate(row.seo or {}),
        case_studies=[
            _case_studies._public_detail(link.case_study)
            for link in row.case_study_links
            if link.case_study and link.case_study.status == ContentStatus.publish
        ],
        services=[HomeServiceItem.model_validate(item) for item in (row.services or [])],
        banner_explore_text=row.banner_explore_text,
        faq_title=row.faq_title,
        faq_description=row.faq_description,
        faqs=[HomeFaq.model_validate(item) for item in (row.faqs or [])],
        content_available_in=list(row.content_available_in or [DEFAULT_LOCALE]),
    )


class HomeService:
    def _options(self):
        return (
            selectinload(Home.case_study_links).selectinload(HomeCaseStudy.case_study).selectinload(
                CaseStudy.industry_links
            ).selectinload(CaseStudyIndustry.industry),
            selectinload(Home.case_study_links).selectinload(HomeCaseStudy.case_study).selectinload(
                CaseStudy.category_links
            ).selectinload(CaseStudyCategoryLink.category),
            selectinload(Home.case_study_links).selectinload(HomeCaseStudy.case_study).selectinload(
                CaseStudy.technology_links
            ).selectinload(CaseStudyTechnology.technology),
        )

    def list_homes(self, db: Session, q: str | None, page: int, per_page: int) -> HomeList:
        page = max(page, 1)
        per_page = min(max(per_page, 1), PER_PAGE)
        query = db.query(Home)
        if q and q.strip():
            query = query.filter(Home.title.ilike(f"%{q.strip()}%"))
        total = query.count()
        rows = (
            query.order_by(Home.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return HomeList(
            items=[
                HomeSummary(
                    id=row.id,
                    title=row.title,
                    video_format=video_format(row),
                    created_at=row.created_at,
                    content_available_in=LOCALE_LABEL,
                    state=row.status,
                )
                for row in rows
            ],
            page=page,
            per_page=per_page,
            total=total,
        )

    def list_published(self, db: Session) -> PublicHomeList:
        rows = (
            db.query(Home)
            .options(*self._options())
            .filter(Home.status == ContentStatus.publish)
            .order_by(Home.created_at.asc())
            .all()
        )
        return PublicHomeList(items=[public_home(row) for row in rows])

    def get(self, db: Session, home_id: UUID) -> HomeSchema:
        return home_schema(self._row(db, home_id))

    def create(self, db: Session, payload: HomeWrite) -> HomeSchema:
        now = datetime.now(UTC)
        row = Home(
            created_at=now,
            updated_at=now,
            content_available_in=[DEFAULT_LOCALE],
        )
        self._apply(db, row, payload)
        db.add(row)
        db.commit()
        return home_schema(self._row(db, row.id))

    def update(self, db: Session, home_id: UUID, payload: HomeWrite) -> HomeSchema:
        row = self._row(db, home_id)
        self._apply(db, row, payload)
        row.updated_at = datetime.now(UTC)
        row.content_available_in = [DEFAULT_LOCALE]
        db.commit()
        return home_schema(self._row(db, home_id))

    def delete(self, db: Session, home_id: UUID) -> None:
        row = self._row(db, home_id)
        db.delete(row)
        db.commit()

    def _row(self, db: Session, home_id: UUID) -> Home:
        row = db.query(Home).options(*self._options()).filter(Home.id == home_id).first()
        if row is None:
            raise CatalogError(
                404,
                EntityNotFound(message_key="admin.homes.not_found").model_dump(),
            )
        return row

    def _apply(self, db: Session, row: Home, payload: HomeWrite) -> None:
        row.title = self._required(payload.title, "title")
        row.video_key = _optional_key(payload.video_key, "video_key")
        row.video_content_type = (payload.video_content_type or None) if row.video_key else None
        if row.video_content_type:
            row.video_content_type = row.video_content_type.strip() or None
        row.banner_title = payload.banner_title.strip()
        row.seo = _seo(payload.seo)
        row.services = _services(payload.services)
        row.banner_explore_text = payload.banner_explore_text.strip()
        row.faq_title = payload.faq_title.strip()
        row.faq_description = sanitize_html(payload.faq_description)
        row.faqs = _faqs(payload.faqs)
        row.status = coerce_status(payload.status)
        studies = self._case_studies(db, payload.case_study_ids)
        row.case_study_links = [
            HomeCaseStudy(case_study=item, sort_order=index) for index, item in enumerate(studies)
        ]

    def _case_studies(self, db: Session, ids: list[UUID]) -> list[CaseStudy]:
        if not ids:
            return []
        unique = list(dict.fromkeys(ids))
        rows = db.query(CaseStudy).filter(CaseStudy.id.in_(unique)).all()
        if len(rows) != len(unique):
            raise CatalogError(
                422,
                FieldErrors(
                    fields={
                        "case_study_ids": FieldErrorDetail(
                            message_key="admin.homes.case_studies.invalid"
                        )
                    }
                ).model_dump(),
            )
        by_id = {row.id: row for row in rows}
        return [by_id[item] for item in unique]

    def _required(self, value: str, field: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise CatalogError(
                422,
                FieldErrors(
                    fields={field: FieldErrorDetail(message_key="admin.field.required")}
                ).model_dump(),
            )
        return trimmed
