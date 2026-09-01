from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from flycatch_api.db import Base
from flycatch_api.models.case_study import ContentStatus

if TYPE_CHECKING:
    from flycatch_api.models.author import Author


class EmailTemplateType(str, enum.Enum):
    user_notification = "user_notification"
    admin_notification = "admin_notification"


class OpeningApplication(Base):
    __tablename__ = "opening_applications"
    __table_args__ = (UniqueConstraint("opening_id", "application_id", name="uq_opening_application"),)

    opening_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("openings.id", ondelete="CASCADE"), primary_key=True
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), primary_key=True
    )

    opening: Mapped[Opening] = relationship(back_populates="application_links")
    application: Mapped[Application] = relationship(back_populates="opening_links")


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    opened: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    current_ctc: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    expected_ctc: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    notice_period: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    experience: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    additional_info: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    opening_links: Mapped[list[OpeningApplication]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )


class Opening(Base):
    __tablename__ = "openings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[str] = mapped_column(String(80), nullable=False)
    exp_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    role: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    experience: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    location: Mapped[str] = mapped_column(String(40), nullable=False, default="Kochi")
    job_type: Mapped[str] = mapped_column(String(40), nullable=False, default="Full-Time")
    job_status: Mapped[str] = mapped_column(String(40), nullable=False, default="Ongoing")
    specialization: Mapped[str] = mapped_column(String(40), nullable=False, default="FullStack")
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    application_links: Mapped[list[OpeningApplication]] = relationship(
        back_populates="opening", cascade="all, delete-orphan"
    )


class EmployeeTestimonial(Base):
    __tablename__ = "employee_testimonials"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    designation: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    review: Mapped[str] = mapped_column(Text, nullable=False)
    image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column("order", Integer, nullable=False, default=0)
    listed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    publish_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class EmailConfiguration(Base):
    __tablename__ = "email_configurations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    smtp_default_from: Mapped[str] = mapped_column(String(200), nullable=False)
    smtp_default_reply_to: Mapped[str] = mapped_column(String(200), nullable=False)
    smtp_admin_email: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    template_type: Mapped[str] = mapped_column("type", String(40), nullable=False)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class NewsCategory(Base):
    __tablename__ = "news_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    news_links: Mapped[list[NewsCategoryLink]] = relationship(back_populates="category")


class ResourceCategory(Base):
    __tablename__ = "resource_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    resource_links: Mapped[list[ResourceCategoryLink]] = relationship(back_populates="category")


class NewsCategoryLink(Base):
    __tablename__ = "news_news_categories"
    __table_args__ = (UniqueConstraint("news_id", "category_id", name="uq_news_news_category"),)

    news_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("news.id", ondelete="CASCADE"), primary_key=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("news_categories.id"), primary_key=True
    )

    news: Mapped[News] = relationship(back_populates="category_links")
    category: Mapped[NewsCategory] = relationship(back_populates="news_links")


class NewsAuthorLink(Base):
    __tablename__ = "news_authors"
    __table_args__ = (UniqueConstraint("news_id", "author_id", name="uq_news_author"),)

    news_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("news.id", ondelete="CASCADE"), primary_key=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("authors.id"), primary_key=True
    )

    news: Mapped[News] = relationship(back_populates="author_links")
    author: Mapped[Author] = relationship()


class News(Base):
    __tablename__ = "news"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    button_name: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    reading_time: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    facebook: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    linkedin: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    twitter: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    instagram: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    youtube_url: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    seo: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    category_links: Mapped[list[NewsCategoryLink]] = relationship(
        back_populates="news", cascade="all, delete-orphan"
    )
    author_links: Mapped[list[NewsAuthorLink]] = relationship(
        back_populates="news", cascade="all, delete-orphan"
    )


class ResourceCategoryLink(Base):
    __tablename__ = "resource_resource_categories"
    __table_args__ = (UniqueConstraint("resource_id", "category_id", name="uq_resource_category"),)

    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resource_categories.id"), primary_key=True
    )

    resource: Mapped[Resource] = relationship(back_populates="category_links")
    category: Mapped[ResourceCategory] = relationship(back_populates="resource_links")


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reading_time: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    button_name: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    pdf_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    category_links: Mapped[list[ResourceCategoryLink]] = relationship(
        back_populates="resource", cascade="all, delete-orphan"
    )


class Membership(Base):
    __tablename__ = "memberships"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    images: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    seo: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    phone: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    subject: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    contact_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    details: Mapped[str] = mapped_column(Text, nullable=False, default="")
    contact_type: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    company_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Download(Base):
    __tablename__ = "downloads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    company: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    file_key: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class FlycatchSaudiArabia(Base):
    __tablename__ = "flycatch_saudi_arabia"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    banner_title: Mapped[str] = mapped_column(String(200), nullable=False)
    service_section: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    banner_explore_text: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    services_title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    video_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[ContentStatus] = mapped_column(
        Enum(ContentStatus, name="content_status", create_type=False),
        nullable=False,
        default=ContentStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
