import pytest


def test_analytics_schema_files_exist():
    from pathlib import Path

    path = Path(__file__).resolve().parents[4] / "specs/001-website-foundation/contracts/analytics-events.v1.yaml"
    assert path.exists()
    content = path.read_text()
    assert "AnalyticsEvent" in content
