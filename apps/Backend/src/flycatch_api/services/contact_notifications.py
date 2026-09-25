from __future__ import annotations

import logging
import re
import smtplib
from email.message import EmailMessage
from html import escape
from uuid import UUID

from sqlalchemy import func

from flycatch_api.config import settings
from flycatch_api.db import SessionLocal
from flycatch_api.models.case_study import ContentStatus
from flycatch_api.models.catalog import Contact as ContactRow
from flycatch_api.models.catalog import EmailConfiguration as EmailConfigurationRow
from flycatch_api.models.catalog import EmailTemplate as EmailTemplateRow

logger = logging.getLogger(__name__)

_TOKEN = re.compile(r"\{\{\s*([A-Za-z0-9_]+)\s*\}\}")


def notify_contact_submission(contact_id: str) -> None:
    try:
        _notify(contact_id)
    except Exception:
        logger.exception("contact notification failed for %s", contact_id)


def compile_template(template: str, variables: dict[str, str], *, html: bool) -> str:
    def replace(match: re.Match[str]) -> str:
        value = variables.get(match.group(1), "")
        return escape(value) if html else value

    return _TOKEN.sub(replace, template)


def _notify(contact_id: str) -> None:
    db = SessionLocal()
    try:
        row = db.get(ContactRow, UUID(contact_id))
        if row is None:
            logger.error("contact notification skipped: contact %s was not found", contact_id)
            return
        config = (
            db.query(EmailConfigurationRow)
            .filter(EmailConfigurationRow.status == ContentStatus.publish)
            .order_by(EmailConfigurationRow.created_at.desc())
            .first()
        )
        if config is None:
            logger.error("contact notification skipped: no published email configuration")
            return
        variables = _variables(row)
        messages: list[EmailMessage] = []
        admin_template = _template(db, "admin_notification")
        user_template = _template(db, "user_notification")
        if admin_template is not None:
            messages.append(
                _message(
                    config.smtp_default_from,
                    config.smtp_default_reply_to,
                    config.smtp_admin_email,
                    admin_template,
                    variables,
                )
            )
        else:
            logger.error("contact notification skipped admin mail: template admin_notification was not found")
        if user_template is not None:
            messages.append(
                _message(
                    config.smtp_default_from,
                    config.smtp_default_reply_to,
                    row.email,
                    user_template,
                    variables,
                )
            )
        else:
            logger.error("contact notification skipped user mail: template user_notification was not found")
        if messages:
            _send(messages)
    finally:
        db.close()


def _variables(row: ContactRow) -> dict[str, str]:
    application_date = row.contact_date.isoformat() if row.contact_date else ""
    phone = row.phone or ""
    return {
        "contact_type": row.contact_type or "",
        "name": row.name or "",
        "last_name": row.last_name or "",
        "email": row.email or "",
        "phone_no": phone,
        "phone": phone,
        "country": row.country or "",
        "company_name": row.company_name or "",
        "subject": row.subject or "",
        "details": row.details or "",
        "applicationDate": application_date,
        "contact_date": application_date,
    }


def _template(db, template_type: str) -> EmailTemplateRow | None:
    published = EmailTemplateRow.status == ContentStatus.publish
    by_slug = (
        db.query(EmailTemplateRow)
        .filter(published, func.lower(EmailTemplateRow.slug) == template_type)
        .first()
    )
    if by_slug is not None:
        return by_slug
    return (
        db.query(EmailTemplateRow)
        .filter(published, EmailTemplateRow.template_type == template_type)
        .order_by(EmailTemplateRow.created_at.desc())
        .first()
    )


def _message(
    sender: str,
    reply_to: str,
    recipient: str,
    template: EmailTemplateRow,
    variables: dict[str, str],
) -> EmailMessage:
    message = EmailMessage()
    message["From"] = sender
    message["To"] = recipient
    message["Reply-To"] = reply_to
    message["Subject"] = compile_template(template.subject, variables, html=False)
    message.set_content(compile_template(template.body, variables, html=True), subtype="html")
    return message


def _send(messages: list[EmailMessage]) -> None:
    if not settings.smtp_host.strip():
        logger.error("contact notification skipped: smtp_host is not configured")
        return
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            for message in messages:
                try:
                    smtp.send_message(message)
                except Exception:
                    logger.exception("failed to send contact email to %s", message["To"])
    except Exception:
        logger.exception("contact notification SMTP connection failed")
