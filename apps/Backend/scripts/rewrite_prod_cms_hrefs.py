"""One-off: rewrite stored CMS hrefs in the connected database. Do not print secrets."""

from __future__ import annotations

import os
import re
import sys
from urllib.parse import urlparse, urlunparse

from sqlalchemy import create_engine, text

SITE_HOSTS = {"www.flycatchtech.com", "flycatchtech.com"}
_LEGACY_EXACT = {
    "/about": "/company/about-us",
    "/about-us": "/company/about-us",
    "/company/membership": "/company/memberships",
    "/services/data-management": "/services/data-migration",
    "/services/data-management-strategy": "/services/data-migration",
    "/services/data-engineering": "/services/data-migration",
    "/services/big-data-analytics": "/services/data-migration",
    "/services/visualization-and-intelligence": "/services/data-migration",
    "/services/ai-services/agentic-ai": "/services/ai-services",
    "/application-development": "/services/application-development-services",
    "/solutions/combus": "/solutions/com-bus",
}
_SOLUTION_PATHS = {
    "doctcare-ai": "/solutions/doctCare-ai",
    "docsis-ai": "/solutions/docSis-ai",
    "talkshop-ai": "/solutions/talkShop-ai",
    "flygrid-ai": "/solutions/flyGrid-ai",
}
_HREF_RE = re.compile(r'href=(["\'])([^"\']*)\1', re.IGNORECASE)
TABLES = ("blogs", "news", "case_studies", "openings")


def _strip_trailing_slash(pathname: str) -> str:
    if len(pathname) > 1 and pathname.endswith("/"):
        return pathname[:-1]
    return pathname


def _strip_locale_prefix(pathname: str) -> str:
    path = _strip_trailing_slash(pathname)
    if path == "/en":
        return "/"
    if path.startswith("/en/"):
        return _strip_trailing_slash(path[3:] or "/")
    return path


def redirect_target(pathname: str) -> str | None:
    if pathname.startswith("/admin") or pathname.startswith("/api"):
        return None
    without_locale = _strip_locale_prefix(pathname)
    mapped = _LEGACY_EXACT.get(without_locale)
    if mapped is None and without_locale.startswith("/blogs/"):
        slug = without_locale.removeprefix("/blogs/")
        if slug and "/" not in slug:
            mapped = f"/company/blogs/{slug}"
    if mapped is None and without_locale.startswith("/solutions/"):
        slug = without_locale.removeprefix("/solutions/")
        mapped = _SOLUTION_PATHS.get(slug.lower())
        if mapped == without_locale:
            mapped = None
    target = mapped if mapped is not None else (
        without_locale if without_locale != pathname else None
    )
    if target is None or target == pathname:
        return None
    return target


def rewrite_public_href(href: str) -> str:
    raw = href.strip()
    if not raw or raw.startswith("#") or raw.startswith("mailto:") or raw.startswith("tel:"):
        return href
    if raw.startswith("/") and not raw.startswith("//"):
        parsed = urlparse(f"https://www.flycatchtech.com{raw}")
        target = redirect_target(parsed.path)
        if not target:
            return href
        extra = ""
        if parsed.query:
            extra += f"?{parsed.query}"
        if parsed.fragment:
            extra += f"#{parsed.fragment}"
        return f"{target}{extra}"
    if not raw.startswith("http://") and not raw.startswith("https://"):
        return href
    parsed = urlparse(raw)
    if parsed.hostname is None or parsed.hostname.lower() not in SITE_HOSTS:
        return href
    target = redirect_target(parsed.path)
    if not target:
        return href
    return urlunparse(parsed._replace(path=target))


def rewrite_public_hrefs(html: str) -> str:
    def replace(match: re.Match[str]) -> str:
        quote, value = match.group(1), match.group(2)
        nxt = rewrite_public_href(value)
        if nxt == value:
            return match.group(0)
        return f"href={quote}{nxt}{quote}"

    return _HREF_RE.sub(replace, html)


def main() -> int:
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL is not set", file=sys.stderr)
        return 1
    engine = create_engine(url)
    updated = {table: 0 for table in TABLES}
    with engine.begin() as conn:
        existing = set(
            conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")).scalars()
        )
        for table in TABLES:
            if table not in existing:
                continue
            rows = conn.execute(text(f"SELECT id, body FROM {table}")).all()
            for row in rows:
                current = row.body or ""
                nxt = rewrite_public_hrefs(current)
                if nxt == current:
                    continue
                conn.execute(
                    text(f"UPDATE {table} SET body = :body WHERE id = :id"),
                    {"body": nxt, "id": row.id},
                )
                updated[table] += 1
    for table, count in updated.items():
        print(f"{table}: {count} row(s) updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
