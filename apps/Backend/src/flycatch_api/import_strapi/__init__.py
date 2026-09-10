"""One-shot Strapi REST → Postgres importer for Flycatch CMS content."""

from __future__ import annotations

__all__ = ["main"]


def main() -> None:
    from flycatch_api.import_strapi.cli import main as cli_main

    cli_main()
