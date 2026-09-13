from flycatch_api.import_strapi.fixture_client import FixtureStrapiClient


def test_fixture_client_reads_local_collections(tmp_path):
    (tmp_path / "blogs.json").write_text('[{"id": 1, "attributes": {"slug": "hello"}}]')
    client = FixtureStrapiClient(tmp_path)
    rows = client.list_all("blogs")
    assert rows[0]["slug"] == "hello"
    assert client.list_all("news") == []
    data, mime = client.download_bytes("/uploads/pack.pdf")
    assert mime == "application/pdf"
    assert data.startswith(b"%PDF")
