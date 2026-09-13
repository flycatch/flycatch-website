from __future__ import annotations

from flycatch_api.import_strapi.blocks_html import blocks_to_html, unknown_block_types


def test_blocks_to_html_paragraph_and_marks():
    blocks = [
        {
            "type": "paragraph",
            "children": [
                {"type": "text", "text": "Hello ", "bold": True},
                {"type": "text", "text": "world", "italic": True},
            ],
        }
    ]
    html = blocks_to_html(blocks)
    assert "<p>" in html
    assert "<strong>Hello </strong>" in html
    assert "<em>world</em>" in html


def test_blocks_to_html_heading_list_quote():
    blocks = [
        {"type": "heading", "level": 2, "children": [{"type": "text", "text": "Title"}]},
        {
            "type": "list",
            "format": "ordered",
            "children": [
                {"type": "list-item", "children": [{"type": "text", "text": "A"}]},
                {"type": "list-item", "children": [{"type": "text", "text": "B"}]},
            ],
        },
        {"type": "quote", "children": [{"type": "text", "text": "Quoted"}]},
    ]
    html = blocks_to_html(blocks)
    assert "<h2>Title</h2>" in html
    assert "<ol>" in html
    assert "<li>A</li>" in html
    assert "<blockquote>Quoted</blockquote>" in html


def test_blocks_to_html_image_uses_media_resolver():
    blocks = [
        {
            "type": "image",
            "image": {"id": 1, "url": "/uploads/x.png", "alternativeText": "Alt"},
        }
    ]
    html = blocks_to_html(blocks, resolve_media=lambda _img: "abc123.png")
    assert 'src="media:abc123.png"' in html
    assert 'data-media-key="abc123.png"' in html
    assert 'alt="Alt"' in html


def test_unknown_block_types_are_reported():
    blocks = [
        {"type": "paragraph", "children": [{"type": "text", "text": "ok"}]},
        {"type": "widget", "children": [{"type": "text", "text": "x"}]},
    ]
    assert unknown_block_types(blocks) == ["widget"]
    assert unknown_block_types("<p>plain</p>") == []


def test_blocks_to_html_plain_string_and_script_stripped():
    assert blocks_to_html("<p>ok</p><script>alert(1)</script>") == "<p>ok</p>"
    assert blocks_to_html(None) == ""


def test_media_import_field_accepts_bare_url_string():
    from types import SimpleNamespace

    from flycatch_api.import_strapi.client import StrapiClient
    from flycatch_api.import_strapi.media import MediaImporter

    class FakeUploader:
        def upload(self, filename, content_type, data):
            assert filename and filename.endswith(".webm")
            return SimpleNamespace(key="cover.webm")

    client = StrapiClient("https://cms.example/api", "token", image_base_url="https://cms.example")
    client.download_bytes = lambda url: (b"fake-webm", "video/webm")  # type: ignore[method-assign]
    media = MediaImporter(client, uploader=FakeUploader())
    key = media.import_field("https://cms.example/uploads/cover.webm")
    assert key == "cover.webm"
    assert media.guess_content_type("https://cms.example/uploads/cover.webm") == "video/webm"

