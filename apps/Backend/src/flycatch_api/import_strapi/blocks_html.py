from __future__ import annotations

import html
from collections.abc import Callable
from typing import Any

from flycatch_api.services.text import sanitize_html

MediaResolver = Callable[[dict[str, Any]], str | None]

KNOWN_BLOCK_TYPES = frozenset(
    {"paragraph", "heading", "quote", "code", "list", "list-item", "image", "link", "text"}
)


def unknown_block_types(blocks: Any) -> list[str]:
    found: list[str] = []
    if not isinstance(blocks, list):
        return found

    def walk(nodes: list[Any]) -> None:
        for node in nodes:
            if not isinstance(node, dict):
                continue
            block_type = node.get("type")
            if block_type and block_type not in KNOWN_BLOCK_TYPES:
                found.append(str(block_type))
            children = node.get("children")
            if isinstance(children, list):
                walk(children)

    walk(blocks)
    return found


def blocks_to_html(blocks: Any, *, resolve_media: MediaResolver | None = None) -> str:
    """Convert Strapi Blocks JSON (or plain string) into Quill-friendly HTML."""
    if blocks is None:
        return ""
    if isinstance(blocks, str):
        return sanitize_html(blocks)
    if not isinstance(blocks, list):
        return ""
    parts: list[str] = []
    for block in blocks:
        if not isinstance(block, dict):
            continue
        rendered = _render_block(block, resolve_media=resolve_media)
        if rendered:
            parts.append(rendered)
    return sanitize_html("".join(parts))


def _render_block(block: dict[str, Any], *, resolve_media: MediaResolver | None) -> str:
    block_type = block.get("type")
    children = block.get("children") or []
    inline = _render_inlines(children)

    if block_type == "paragraph":
        return f"<p>{inline}</p>" if inline else "<p><br></p>"
    if block_type == "heading":
        level = int(block.get("level") or 2)
        level = min(max(level, 1), 6)
        return f"<h{level}>{inline}</h{level}>"
    if block_type == "quote":
        return f"<blockquote>{inline}</blockquote>"
    if block_type == "code":
        return f"<pre><code>{inline}</code></pre>"
    if block_type == "list":
        tag = "ol" if block.get("format") == "ordered" else "ul"
        items = []
        for item in children:
            if not isinstance(item, dict):
                continue
            if item.get("type") == "list-item":
                items.append(f"<li>{_render_inlines(item.get('children') or [])}</li>")
            else:
                items.append(f"<li>{_render_inlines([item])}</li>")
        return f"<{tag}>{''.join(items)}</{tag}>"
    if block_type == "image":
        return _render_image(block, resolve_media=resolve_media)
    if block_type == "link":
        url = html.escape(str(block.get("url") or "#"), quote=True)
        return f'<a href="{url}">{inline}</a>'
    return f"<p>{inline}</p>" if inline else ""


def _render_image(block: dict[str, Any], *, resolve_media: MediaResolver | None) -> str:
    image = block.get("image") if isinstance(block.get("image"), dict) else block
    alt = html.escape(str(image.get("alternativeText") or image.get("alt") or ""), quote=True)
    key: str | None = None
    if resolve_media is not None:
        key = resolve_media(image if isinstance(image, dict) else {})
    if key:
        src = html.escape(f"media:{key}", quote=True)
        return f'<img src="{src}" data-media-key="{html.escape(key, quote=True)}" alt="{alt}">'
    url = image.get("url") if isinstance(image, dict) else None
    if url:
        src = html.escape(str(url), quote=True)
        return f'<img src="{src}" alt="{alt}">'
    return ""


def _render_inlines(nodes: list[Any]) -> str:
    parts: list[str] = []
    for node in nodes:
        if not isinstance(node, dict):
            continue
        node_type = node.get("type")
        text = html.escape(str(node.get("text") or ""))
        if node.get("code"):
            text = f"<code>{text}</code>"
        if node.get("bold"):
            text = f"<strong>{text}</strong>"
        if node.get("italic"):
            text = f"<em>{text}</em>"
        if node.get("underline"):
            text = f"<u>{text}</u>"
        if node.get("strikethrough"):
            text = f"<s>{text}</s>"
        if node_type == "link":
            url = html.escape(str(node.get("url") or "#"), quote=True)
            inner = _render_inlines(node.get("children") or [])
            parts.append(f'<a href="{url}">{inner}</a>')
            continue
        if node_type in {"text", None} or "text" in node:
            parts.append(text)
            continue
        if node.get("children"):
            parts.append(_render_inlines(node["children"]))
    return "".join(parts)
