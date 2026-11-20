import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import call, patch
from urllib.error import HTTPError

from scripts import sync_vehicles as sync


class ListingFetchTests(unittest.TestCase):
    url = "https://dealer.example/category/hyundai/51/?page=1"

    def test_transient_403_retries_same_listing(self):
        denied = HTTPError(self.url, 403, "Forbidden", {}, None)
        with (
            patch.object(sync, "fetch", side_effect=[denied, "listing HTML"]) as fetch,
            patch("time.sleep") as sleep,
        ):
            self.assertEqual(sync.fetch_listing_page(self.url), "listing HTML")

        self.assertEqual(fetch.call_args_list, [call(self.url), call(self.url)])
        sleep.assert_called_once_with(60)

    def test_missing_listing_is_not_retried(self):
        missing = HTTPError(self.url, 404, "Not Found", {}, None)
        with (
            patch.object(sync, "fetch", side_effect=missing) as fetch,
            patch("time.sleep") as sleep,
            self.assertRaises(HTTPError) as failure,
        ):
            sync.fetch_listing_page(self.url)

        self.assertIs(failure.exception, missing)
        fetch.assert_called_once_with(self.url)
        sleep.assert_not_called()

    def test_persistent_403_on_page_two_preserves_published_files(self):
        second_url = self.url.replace("page=1", "page=2")
        first_page = ('<li id="anchorBoxId_42"><a href="/product/example/42/">'
                      '<img src="//dealer.example/web/product/42.jpg" alt="Example"></a></li>')
        denied = [HTTPError(second_url, 403, "Forbidden", {}, None) for _ in range(2)]
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "data").mkdir()
            (root / "cars").mkdir()
            (root / "data/sync-config.json").write_text(json.dumps({
                "base": "https://dealer.example",
                "source_categories": [{"path": "hyundai", "id": 51}],
            }))
            published = {
                "data/vehicles.json": json.dumps({"vehicles": [{"id": 7}]}),
                "cars/7.html": "<title>Vehicle 7</title>",
                "sitemap.xml": "<urlset/>",
                "llms.txt": "Vehicle 7",
            }
            for name, content in published.items():
                (root / name).write_text(content)

            with (
                patch.object(sync, "ROOT", root),
                patch.object(sync, "fetch", side_effect=[first_page, *denied]) as fetch,
                patch("time.sleep") as sleep,
                self.assertRaises(HTTPError) as failure,
            ):
                sync.main()

            self.assertIs(failure.exception, denied[1])
            self.assertEqual(fetch.call_args_list,
                             [call(self.url), call(second_url), call(second_url)])
            sleep.assert_called_once_with(60)
            for name, content in published.items():
                self.assertEqual((root / name).read_text(), content)
            self.assertFalse((root / "cars/42.html").exists())
