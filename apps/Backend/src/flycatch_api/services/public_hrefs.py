"""Rewrite stored CMS hrefs onto the live public path.

Mirrors apps/Frontend/src/lib/seo-redirects.ts so blog/news/case-study
bodies do not keep /en/ or retired service URLs.
"""

from __future__ import annotations

import re
from urllib.parse import urlparse, urlunparse

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
        return f"{target}{('?' + parsed.query) if parsed.query else ''}{('#' + parsed.fragment) if parsed.fragment else ''}"
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
