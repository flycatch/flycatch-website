from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from collections.abc import Callable
from pathlib import Path

from flycatch_api.db import SessionLocal
from flycatch_api.import_strapi.client import StrapiClient
from flycatch_api.import_strapi.context import ImportContext
from flycatch_api.import_strapi.editorial import (
    import_blogs,
    import_case_studies,
    import_news,
    import_resources,
)
from flycatch_api.import_strapi.leads import (
    import_applications,
    import_client_logos,
    import_client_testimonials,
    import_contacts,
    import_downloads,
    import_employee_testimonials,
    import_memberships,
    import_openings,
    import_subscriptions,
)
from flycatch_api.import_strapi.media import MediaImporter
from flycatch_api.import_strapi.pages import (
    import_ai_services,
    import_application_development,
    import_application_modernization,
    import_cloud_services,
    import_data_analytics,
    import_devops_consult,
    import_digital_transformation,
    import_flycatch_saudi_arabia,
    import_homes,
    import_infrastructure_management,
    import_mobile_application_development,
    import_overview,
    import_solution_details,
    import_solution_products,
    import_solutions,
    import_user_centered_design,
)
from flycatch_api.import_strapi.populate import IMPORT_ORDER
from flycatch_api.import_strapi.taxonomies import (
    import_authors_from_blogs,
    import_case_study_categories,
    import_categories,
    import_industries,
    import_news_categories,
    import_resource_categories,
    import_technologies,
)

logger = logging.getLogger(__name__)

RUNNERS: dict[str, Callable[[ImportContext], object]] = {
    "categories": import_categories,
    "case-study-categories": import_case_study_categories,
    "industries": import_industries,
    "technologies": import_technologies,
    "news-categories": import_news_categories,
    "resource-categories": import_resource_categories,
    "authors": import_authors_from_blogs,
    "blogs": import_blogs,
    "case-studies": import_case_studies,
    "news": import_news,
    "resources": import_resources,
    "client-logos": import_client_logos,
    "client-testimonials": import_client_testimonials,
    "employee-testimonials": import_employee_testimonials,
    "openings": import_openings,
    "applications": import_applications,
    "downloads": import_downloads,
    "memberships": import_memberships,
    "contacts": import_contacts,
    "subscriptions": import_subscriptions,
    "solution-details": import_solution_details,
    "solution-products": import_solution_products,
    "solutions": import_solutions,
    "homes": import_homes,
    "ai-services": import_ai_services,
    "cloud-services": import_cloud_services,
    "data-analytics": import_data_analytics,
    "digital-transformation": import_digital_transformation,
    "application-development": import_application_development,
    "application-modernization": import_application_modernization,
    "mobile-application-development": import_mobile_application_development,
    "user-centered-design": import_user_centered_design,
    "devops-consult": import_devops_consult,
    "infrastructure-management": import_infrastructure_management,
    "overview": import_overview,
    "flycatch-saudi-arabia": import_flycatch_saudi_arabia,
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Import Strapi CMS collections into the Flycatch Postgres database."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and map without writing to Postgres or MinIO.",
    )
    parser.add_argument(
        "--only",
        type=str,
        default="",
        help=f"Comma-separated steps to run. Available: {','.join(IMPORT_ORDER)}",
    )
    parser.add_argument(
        "--publication-state",
        choices=("preview", "live"),
        default="preview",
        help="Strapi publicationState (preview includes drafts).",
    )
    parser.add_argument(
        "--id-map",
        type=Path,
        default=None,
        help="Optional JSON sidecar path to load/save Strapi id → UUID map.",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable debug logging.",
    )
    return parser


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s %(message)s",
    )

    api_url = os.environ.get("STRAPI_API_URL", "").strip()
    token = os.environ.get("STRAPI_API_TOKEN", "").strip()
    image_base = os.environ.get("STRAPI_IMAGE_BASE_URL", "").strip() or None
    if not api_url or not token:
        print(
            "STRAPI_API_URL and STRAPI_API_TOKEN environment variables are required.",
            file=sys.stderr,
        )
        raise SystemExit(2)

    only = {part.strip() for part in args.only.split(",") if part.strip()}
    if only:
        unknown = only - set(RUNNERS)
        if unknown:
            print(f"Unknown --only steps: {', '.join(sorted(unknown))}", file=sys.stderr)
            raise SystemExit(2)
        steps = [step for step in IMPORT_ORDER if step in only]
    else:
        steps = list(IMPORT_ORDER)

    db = SessionLocal()
    try:
        with StrapiClient(
            api_url,
            token,
            image_base_url=image_base,
            publication_state=args.publication_state,
        ) as client:
            media = MediaImporter(client, dry_run=args.dry_run)
            ctx = ImportContext(db=db, client=client, media=media, dry_run=args.dry_run)
            if args.id_map and args.id_map.exists():
                ctx.id_map.load_dict(json.loads(args.id_map.read_text()))
                logger.info("Loaded id map from %s", args.id_map)

            for step in steps:
                logger.info("=== Importing %s ===", step)
                runner = RUNNERS[step]
                stats = runner(ctx)
                logger.info("%s: %s", step, getattr(stats, "summary", lambda: stats)())
                if not args.dry_run:
                    db.commit()

            if args.id_map:
                args.id_map.write_text(json.dumps(ctx.id_map.to_dict(), indent=2, sort_keys=True))
                logger.info("Wrote id map to %s", args.id_map)

            print(
                f"Import complete ({'dry-run' if args.dry_run else 'applied'}): "
                f"{ctx.stats.summary()}; media uploaded={media.uploaded} skipped={media.skipped}"
            )
            if ctx.stats.errors:
                print(f"Errors ({len(ctx.stats.errors)}):", file=sys.stderr)
                for err in ctx.stats.errors[:50]:
                    print(f"  - {err}", file=sys.stderr)
            if media.errors:
                print(f"Media errors ({len(media.errors)}):", file=sys.stderr)
                for err in media.errors[:20]:
                    print(f"  - {err}", file=sys.stderr)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
