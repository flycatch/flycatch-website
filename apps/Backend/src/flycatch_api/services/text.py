from __future__ import annotations

import re

_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_SCRIPT = re.compile(r"(?is)<script[^>]*>.*?</script>")
_MEDIA_KEY = re.compile(r"^[A-Za-z0-9._-]+$")


def slugify(value: str) -> str:
    slug = _NON_ALNUM.sub("-", value.lower().strip()).strip("-")
    return slug


def is_valid_slug(value: str) -> bool:
    return bool(_SLUG_PATTERN.fullmatch(value))


def sanitize_html(value: str) -> str:
    return _SCRIPT.sub("", value)


def is_valid_media_key(value: str) -> bool:
    return bool(_MEDIA_KEY.fullmatch(value))
