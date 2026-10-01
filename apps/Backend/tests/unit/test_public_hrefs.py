from flycatch_api.services.public_hrefs import rewrite_public_href, rewrite_public_hrefs


def test_rewrites_ahrefs_broken_blog_hrefs():
    assert rewrite_public_href("/en/services/ai-services/agentic-ai") == "/services/ai-services"
    assert rewrite_public_href("/en/services/big-data-analytics") == "/services/data-migration"
    assert rewrite_public_href("/en/services/data-engineering") == "/services/data-migration"
    assert rewrite_public_href("/en/services/data-management-strategy") == "/services/data-migration"
    assert (
        rewrite_public_href("/application-development")
        == "/services/application-development-services"
    )
    assert (
        rewrite_public_href("https://www.flycatchtech.com/en/services/big-data-analytics")
        == "https://www.flycatchtech.com/services/data-migration"
    )
    assert rewrite_public_href("https://flycatchtech.com/en/services/ai-services") == (
        "https://flycatchtech.com/services/ai-services"
    )
    assert rewrite_public_href("https://example.com/en/services/big-data-analytics") == (
        "https://example.com/en/services/big-data-analytics"
    )
    assert rewrite_public_href("/services/data-migration") == "/services/data-migration"


def test_rewrites_href_attributes_in_html():
    html = (
        '<p><a href="/en/services/big-data-analytics">data analytics</a> and '
        "<a href='https://www.flycatchtech.com/application-development'>apps</a></p>"
    )
    assert rewrite_public_hrefs(html) == (
        '<p><a href="/services/data-migration">data analytics</a> and '
        "<a href='https://www.flycatchtech.com/services/application-development-services'>apps</a></p>"
    )
