#!/usr/bin/env python3
"""Fetch production HTML metadata for every baseline sitemap URL."""

from __future__ import annotations

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
URLS_PATH = ROOT / "production-urls.json"
OUT_PATH = ROOT / "production-metadata.json"
USER_AGENT = "FlycatchMigrationBaseline/1.0 (+https://www.flycatchtech.com)"


class HeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.title_parts: list[str] = []
        self.metas: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.scripts: list[dict[str, str]] = []
        self.json_ld: list[object] = []
        self._in_ld = False
        self._ld_parts: list[str] = []
        self.in_head = False
        self.head_done = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {k.lower(): (v or "") for k, v in attrs}
        if tag == "head":
            self.in_head = True
        if tag == "title" and self.in_head:
            self.in_title = True
        if tag == "meta":
            self.metas.append(attr)
        if tag == "link":
            self.links.append(attr)
        if tag == "script":
            self.scripts.append(attr)
            t = attr.get("type", "").lower()
            if "ld+json" in t:
                self._in_ld = True
                self._ld_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False
        if tag == "script" and self._in_ld:
            raw = "".join(self._ld_parts).strip()
            if raw:
                try:
                    self.json_ld.append(json.loads(raw))
                except json.JSONDecodeError:
                    self.json_ld.append({"_unparsed": raw[:500]})
            self._in_ld = False
            self._ld_parts = []
        if tag == "head":
            self.in_head = False
            self.head_done = True

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self._in_ld:
            self._ld_parts.append(data)


def meta_content(metas: list[dict[str, str]], *keys: str) -> str | None:
    wanted = {k.lower() for k in keys}
    for m in metas:
        name = (m.get("name") or m.get("property") or m.get("itemprop") or "").lower()
        if name in wanted:
            content = m.get("content")
            return content if content != "" else None
    return None


def canonical_href(links: list[dict[str, str]]) -> str | None:
    for link in links:
        rels = {p.strip() for p in (link.get("rel") or "").lower().split()}
        if "canonical" in rels:
            return link.get("href") or None
    return None


def json_ld_types(blocks: list[object]) -> list[str]:
    found: list[str] = []

    def walk(node: object) -> None:
        if isinstance(node, dict):
            t = node.get("@type")
            if isinstance(t, str):
                found.append(t)
            elif isinstance(t, list):
                found.extend(str(x) for x in t)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    for block in blocks:
        walk(block)
    # preserve first-seen order
    seen: set[str] = set()
    ordered: list[str] = []
    for t in found:
        if t not in seen:
            seen.add(t)
            ordered.append(t)
    return ordered


def fetch_one(url: str) -> dict:
    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    started = time.perf_counter()
    try:
        with urlopen(req, timeout=45) as resp:
            status = getattr(resp, "status", 200)
            final_url = resp.geturl()
            html = resp.read().decode("utf-8", errors="replace")
            headers = {k.lower(): v for k, v in resp.headers.items()}
    except HTTPError as exc:
        return {"url": url, "error": f"HTTP {exc.code}", "status": exc.code}
    except URLError as exc:
        return {"url": url, "error": str(exc.reason), "status": None}

    elapsed_ms = round((time.perf_counter() - started) * 1000)
    parser = HeadParser()
    try:
        parser.feed(html)
    except Exception as exc:  # noqa: BLE001 — capture parse failures per URL
        return {"url": url, "error": f"parse: {exc}", "status": status}

    robots = meta_content(parser.metas, "robots")
    x_robots = headers.get("x-robots-tag")
    return {
        "url": url,
        "final_url": final_url,
        "status": status,
        "title": "".join(parser.title_parts).strip() or None,
        "description": meta_content(parser.metas, "description"),
        "canonical": canonical_href(parser.links),
        "robots": robots,
        "x_robots_tag": x_robots,
        "opengraph": {
            "og:title": meta_content(parser.metas, "og:title"),
            "og:description": meta_content(parser.metas, "og:description"),
            "og:url": meta_content(parser.metas, "og:url"),
            "og:type": meta_content(parser.metas, "og:type"),
            "og:image": meta_content(parser.metas, "og:image"),
            "og:site_name": meta_content(parser.metas, "og:site_name"),
        },
        "twitter": {
            "twitter:card": meta_content(parser.metas, "twitter:card"),
            "twitter:title": meta_content(parser.metas, "twitter:title"),
            "twitter:description": meta_content(parser.metas, "twitter:description"),
            "twitter:image": meta_content(parser.metas, "twitter:image"),
        },
        "json_ld_types": json_ld_types(parser.json_ld),
        "html_bytes": len(html.encode("utf-8")),
        "ttfb_proxy_ms": elapsed_ms,
        "cache_control": headers.get("cache-control"),
    }


def main() -> None:
    inventory = json.loads(URLS_PATH.read_text())
    urls = [entry["url"] for entry in inventory["urls"]]
    pages: dict[str, dict] = {}
    errors: list[dict] = []

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(fetch_one, url): url for url in urls}
        for i, future in enumerate(as_completed(futures), start=1):
            result = future.result()
            pages[result["url"]] = result
            if result.get("error"):
                errors.append(result)
            print(f"{i}/{len(urls)} {result.get('status')} {result['url']}", flush=True)

    missing = [url for url in urls if url not in pages]
    payload = {
        "source_inventory": str(URLS_PATH.name),
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "count": len(pages),
        "inventory_count": len(urls),
        "missing_from_inventory": missing,
        "fetch_errors": errors,
        "pages": [pages[url] for url in urls],
    }
    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"wrote {OUT_PATH} count={len(pages)} errors={len(errors)} missing={len(missing)}")
    if missing or len(pages) != len(urls):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
