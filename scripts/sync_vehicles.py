#!/usr/bin/env python3
"""Sync Samantha's vehicle inventory from gorillamotors.co.kr into data/vehicles.json.

Runs daily in GitHub Actions (.github/workflows/sync-vehicles.yml) and locally:

    python scripts/sync_vehicles.py

Which cars are picked up is controlled by data/sync-config.json:
  - source_categories: Gorilla Motors category pages to scan (e.g. us-spec / 64)
  - filter.mode "all": every car in those categories, minus filter.exclude ids
  - filter.mode "include": only the product ids listed in filter.include
"""
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0 Safari/537.36")


def fetch(url):
    # Percent-encode non-ASCII (Korean plate numbers appear in product URLs)
    url = urllib.parse.quote(url, safe=":/?#[]@!$&'()*+,;=%")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "replace")


def parse_listing(page_html, base, category=""):
    """Parse a Cafe24 category listing page into vehicle dicts."""
    cars = []
    blocks = re.split(r'<li id="anchorBoxId_(\d+)"', page_html)
    for i in range(1, len(blocks) - 1, 2):
        pid, block = int(blocks[i]), blocks[i + 1]
        link = re.search(r'href="(/product/[^"]+)"', block)
        img = re.search(r'<img src="(//[^"]+/web/product/[^"]+?)"[^>]*alt="([^"]*)"', block)
        if not link or not img:
            continue
        specs = {
            html.unescape(k).strip(): html.unescape(v).strip()
            for k, v in re.findall(
                r'<strong class="title[^"]*">.*?>([^<]+)</span>\s*:</strong>\s*<span[^>]*>([^<]*)</span>',
                block)
        }
        price = specs.get("판매가", "")
        dollars = re.match(r"^([\d,]+)\s*\$$", price)
        if dollars:
            price = "$" + dollars.group(1)
        cars.append({
            "id": pid,
            "title": html.unescape(img.group(2)).strip(),
            "url": base + html.unescape(link.group(1)),
            "image": "https:" + img.group(1),
            "price": price,
            "engine": specs.get("Engine", ""),
            "miles": specs.get("MILES", ""),
            "transmission": specs.get("Transmission", ""),
            "options": specs.get("Option", ""),
            "category": category,
        })
    return cars


def fetch_detail_images(url):
    """Collect a product page's high-res photos: the big main image + extra gallery."""
    try:
        page = fetch(url)
    except Exception:
        return []
    images = []
    main = re.search(r'"(//[^"]+/web/product/big/[^"]+?)"', page)
    if main:
        images.append("https:" + html.unescape(main.group(1)))
    for src in re.findall(r'"(//[^"]+/web/product/extra/small/[^"]+?)"', page):
        big = "https:" + html.unescape(src).replace("/extra/small/", "/extra/big/")
        if big not in images:
            images.append(big)
    return images[:15]


def main():
    cfg = json.loads((ROOT / "data" / "sync-config.json").read_text("utf-8"))
    base = cfg["base"].rstrip("/")

    seen, cars = set(), []
    for cat in cfg["source_categories"]:
        for page in range(1, 6):
            url = f"{base}/category/{cat['path']}/{cat['id']}/?page={page}"
            found = [c for c in parse_listing(fetch(url), base, cat["path"]) if c["id"] not in seen]
            if not found:
                break
            seen.update(c["id"] for c in found)
            cars.extend(found)

    flt = cfg.get("filter", {})
    include = set(flt.get("include") or [])
    exclude = set(flt.get("exclude") or [])
    if flt.get("mode") == "include":
        cars = [c for c in cars if c["id"] in include]
    cars = [c for c in cars if c["id"] not in exclude]

    if not cars:
        # Never clobber the last good inventory with an empty one (site change, outage, ...)
        print("No vehicles parsed - keeping existing data/vehicles.json", file=sys.stderr)
        return 1

    for n, car in enumerate(cars, 1):
        car["images"] = fetch_detail_images(car["url"])
        if n % 20 == 0:
            print(f"  gallery photos: {n}/{len(cars)} products")

    cars.sort(key=lambda c: c["id"], reverse=True)
    out = {
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": base,
        "vehicles": cars,
    }
    (ROOT / "data" / "vehicles.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"Wrote {len(cars)} vehicles to data/vehicles.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
