from __future__ import annotations

import json
from pathlib import Path

SEED = (
    Path(__file__).resolve().parents[2]
    / "src/flycatch_api/data/legal_seed.json"
)


def test_legal_seed_authors_production_privacy_and_terms():
    payload = json.loads(SEED.read_text())
    policy = payload["privacy_policy"]
    terms = payload["terms"]
    assert policy["slug"] == "privacy-policy"
    assert "personal information" in policy["body"]
    assert policy["seo"]["canonical_url"].endswith("/privacy-policy")
    assert terms["slug"] == "terms-and-conditions"
    assert "Terms" in terms["body"]
    assert terms["seo"]["canonical_url"].endswith("/terms-and-conditions")
