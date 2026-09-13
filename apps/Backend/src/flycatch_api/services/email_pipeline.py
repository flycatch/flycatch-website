from __future__ import annotations

import smtplib
from datetime import UTC, datetime
from email.message import EmailMessage
from typing import Protocol
from uuid import UUID

from sqlalchemy.orm import Session

from flycatch_api.config import settings
from flycatch_api.models.case_study import ContentStatus
from flycatch_api.models.catalog import EmailConfiguration, EmailOutbox, EmailTemplate


class MailSender(Protocol):
    def __call__(self, *, sender: str, recipient: str, subject: str, body: str, reply_to: str) -> None: ...


def enqueue_notification(
    db: Session,
    *,
    kind: str,
    source_id: UUID | None,
    context: dict[str, str],
) -> EmailOutbox:
    config = (
        db.query(EmailConfiguration)
        .filter(EmailConfiguration.status == ContentStatus.publish)
        .order_by(EmailConfiguration.created_at.desc())
        .first()
    )
    template = (
        db.query(EmailTemplate)
        .filter(
            EmailTemplate.status == ContentStatus.publish,
            EmailTemplate.slug == kind,
        )
        .first()
    )
    recipient = (
        (config.smtp_admin_email if config else "")
        or settings.smtp_fallback_recipient
        or settings.smtp_from
    )
    subject = _render(template.subject if template else f"New {kind} submission", context)
    body = _render(template.body if template else _default_body(kind, context), context)
    row = EmailOutbox(
        kind=kind,
        source_id=source_id,
        recipient=recipient,
        subject=subject,
        body=body,
        status="pending",
        attempts=0,
        last_error="",
        created_at=datetime.now(UTC),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    deliver_pending(db, limit=1, item_id=row.id)
    db.refresh(row)
    return row


def deliver_pending(
    db: Session,
    *,
    limit: int = 20,
    item_id: UUID | None = None,
    sender: MailSender | None = None,
) -> list[EmailOutbox]:
    query = db.query(EmailOutbox).filter(EmailOutbox.status.in_(["pending", "failed"]))
    if item_id is not None:
        query = query.filter(EmailOutbox.id == item_id)
    rows = query.order_by(EmailOutbox.created_at.asc()).limit(limit).all()
    send = sender or _smtp_send
    config = (
        db.query(EmailConfiguration)
        .filter(EmailConfiguration.status == ContentStatus.publish)
        .order_by(EmailConfiguration.created_at.desc())
        .first()
    )
    from_addr = (config.smtp_default_from if config else "") or settings.smtp_from
    reply_to = (config.smtp_default_reply_to if config else "") or from_addr
    for row in rows:
        row.attempts += 1
        try:
            send(
                sender=from_addr,
                recipient=row.recipient,
                subject=row.subject,
                body=row.body,
                reply_to=reply_to,
            )
            row.status = "sent"
            row.last_error = ""
            row.sent_at = datetime.now(UTC)
        except Exception as exc:  # noqa: BLE001 — record and keep the submission
            row.status = "failed"
            row.last_error = str(exc)
        db.add(row)
    db.commit()
    return rows


def _default_body(kind: str, context: dict[str, str]) -> str:
    lines = [f"A {kind} submission was received."]
    for key, value in context.items():
        lines.append(f"{key}: {value}")
    return "\n".join(lines)


def _render(template: str, context: dict[str, str]) -> str:
    rendered = template
    for key, value in context.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", value)
    return rendered


def _smtp_send(*, sender: str, recipient: str, subject: str, body: str, reply_to: str) -> None:
    if not recipient:
        raise RuntimeError("email.recipient.missing")
    host = settings.smtp_host.strip()
    if not host:
        raise RuntimeError("email.smtp.unconfigured")
    message = EmailMessage()
    message["From"] = sender or settings.smtp_from
    message["To"] = recipient
    message["Subject"] = subject
    if reply_to:
        message["Reply-To"] = reply_to
    message.set_content(body)
    with smtplib.SMTP(host, settings.smtp_port, timeout=10) as client:
        if settings.smtp_use_tls:
            client.starttls()
        if settings.smtp_username:
            client.login(settings.smtp_username, settings.smtp_password)
        client.send_message(message)
