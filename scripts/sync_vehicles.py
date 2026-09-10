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
BASE_URL = "https://samanthausedcar.com"
# Clean URLs: GitHub Pages serves /vehicles from vehicles.html, /cars/123 from
# cars/123.html (Vercel mirror does the same via "cleanUrls" in vercel.json).
STATIC_PAGES = ["", "vehicles", "faq", "contact", "business-card", "privacy"]
INDEXNOW_KEY = "c5a92d7e41f8460b8f3ad2c96b17e0d4"


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


def display_title(title):
    """Same cleanup the site JS applies: drop US-SPEC decorations and plate parens."""
    t = re.sub(r"^[\s*!]*US[\s.\-]?SPEC[\s*!]*", "", title or "", flags=re.I)
    t = re.sub(r"[(（][^()（）]*[가-힣ㄱ-ㅎㅏ-ㅣ][^()（）]*[)）]", "", t)
    return re.sub(r"\s{2,}", " ", t).strip()


def car_blurb(car):
    bits = []
    if car.get("engine"):
        bits.append(car["engine"])
    if car.get("transmission"):
        bits.append("automatic transmission" if car["transmission"].upper().startswith("AUTO")
                    else car["transmission"])
    miles = re.sub(r"[^0-9]", "", str(car.get("miles", "")))
    if miles:
        bits.append(f"{int(miles):,} miles")
    s = "Well-maintained " + display_title(car["title"])
    s += " — " + ", ".join(bits) + "." if bits else "."
    if car.get("options"):
        s += " Features: " + car["options"] + "."
    s += (" Ready-drive car with 1-month engine & transmission warranty, SOFA registration"
          " support, and free delivery to base. Contact Samantha to schedule a test drive!")
    return s


def photos_of(car):
    return car.get("images") or [car["image"]]


def car_jsonld(car, title, canonical):
    price_digits = re.sub(r"[^0-9]", "", car.get("price", ""))
    miles_digits = re.sub(r"[^0-9]", "", str(car.get("miles", "")))
    data = {
        "@context": "https://schema.org",
        "@type": "Vehicle",
        "name": title,
        "url": canonical,
        "image": photos_of(car)[:5],
        "itemCondition": "https://schema.org/UsedCondition",
        "offers": {
            "@type": "Offer",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "url": canonical,
            "seller": {
                "@type": "AutoDealer",
                "@id": "https://samanthausedcar.com/#dealer",
                "name": "Samantha Used Car",
                "telephone": "+82-10-7170-4513",
                "address": ("186-3, Songhwa 2-gil, Paengseong-eup, Pyeongtaek-si,"
                            " Gyeonggi-do, Republic of Korea"),
            },
        },
    }
    if price_digits:
        data["offers"]["price"] = price_digits
    if miles_digits:
        data["mileageFromOdometer"] = {"@type": "QuantitativeValue",
                                       "value": int(miles_digits), "unitCode": "SMI"}
    if car.get("transmission"):
        data["vehicleTransmission"] = car["transmission"]
    return json.dumps(data, ensure_ascii=False)


def render_car_page(template, car):
    title = display_title(car["title"])
    canonical = f"{BASE_URL}/cars/{car['id']}"
    blurb = car_blurb(car)
    meta_desc = blurb if len(blurb) <= 155 else blurb[:152].rsplit(" ", 1)[0] + "…"
    meta_line = " · ".join(x for x in [
        f"{car['miles']} MILES" if car.get("miles") else "",
        car.get("engine", ""), car.get("transmission", "")] if x)

    specs_rows = [("PRICE", car.get("price")), ("MILEAGE", car.get("miles")),
                  ("ENGINE", car.get("engine")), ("TRANSMISSION", car.get("transmission")),
                  ("OPTIONS", car.get("options"))]
    specs_html = "".join(
        f'<div class="bg-white rounded-lg p-3 md:p-4 border border-black/5'
        f'{" col-span-2" if label == "OPTIONS" else ""}">'
        f'<p class="text-[9px] md:text-[10px] text-gray-400 tracking-widest mb-1">{label}</p>'
        f'<p class="font-bold">{html.escape(value)}</p></div>'
        for label, value in specs_rows if value)

    gallery_html = "".join(
        f'<img src="{html.escape(src)}" alt="{html.escape(title)} photo {i + 1}"'
        f'{"" if i == 0 else " loading=\"lazy\""} decoding="async" class="w-full rounded">'
        for i, src in enumerate(photos_of(car)))

    wa_url = ("https://api.whatsapp.com/send?phone=821071704513&text="
              + urllib.parse.quote(f"Hi Samantha! I am interested in: {title}"
                                   + (f" ({car['price']})" if car.get("price") else "")))

    page = template
    for token, value in {
        "%%ID%%": str(car["id"]),
        "%%PRICE_NUM%%": re.sub(r"[^0-9]", "", car.get("price", "")) or "0",
        "%%PAGE_TITLE%%": html.escape(f"{title} for sale"
                                      + (f" — {car['price']}" if car.get("price") else "")
                                      + " | Samantha Used Car"),
        "%%META_DESC%%": html.escape(meta_desc),
        "%%CANONICAL%%": canonical,
        "%%OG_TITLE%%": html.escape(title + (f" — {car['price']}" if car.get("price") else "")),
        "%%OG_IMAGE%%": html.escape(car["image"]),
        "%%JSONLD%%": car_jsonld(car, title, canonical),
        "%%TITLE%%": html.escape(title),
        "%%PRICE%%": html.escape(car.get("price", "")),
        "%%META_LINE%%": html.escape(meta_line),
        "%%DESC%%": html.escape(blurb),
        "%%SPECS_HTML%%": specs_html,
        "%%GALLERY_HTML%%": gallery_html,
        "%%WA_URL%%": html.escape(wa_url),
    }.items():
        page = page.replace(token, value)
    return page


def generate_static(cars, updated_iso):
    """Write cars/<id>.html pages, sitemap.xml and llms.txt (all owned by this script)."""
    today = updated_iso[:10]
    template = (ROOT / "scripts" / "car_template.html").read_text("utf-8")

    cars_dir = ROOT / "cars"
    cars_dir.mkdir(exist_ok=True)
    current = set()
    for car in cars:
        name = f"{car['id']}.html"
        current.add(name)
        (cars_dir / name).write_text(render_car_page(template, car), "utf-8")
    for stale in cars_dir.glob("*.html"):
        if stale.name not in current:
            stale.unlink()

    urls = [f"{BASE_URL}/{p}" for p in STATIC_PAGES]
    urls += [f"{BASE_URL}/cars/{car['id']}" for car in cars]
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sitemap += [f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>" for u in urls]
    sitemap.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sitemap) + "\n", "utf-8")

    lines = [
        "# Samantha Used Car",
        "",
        "> Used car dealership for US military & SOFA personnel, minutes from Camp Humphreys.",
        "> Samantha Kim (SOFA Vehicle Specialist) at Gorilla Motors — buy, sell, junk.",
        "> Every car: 1-month engine & transmission warranty, SOFA registration support,",
        "> free delivery to base, free loaner car during repairs, towing & roadside help.",
        "",
        "- Address: 186-3, Songhwa 2-gil, Paengseong-eup, Pyeongtaek-si, Gyeonggi-do, Korea",
        "- Phone / WhatsApp: +82-10-7170-4513 (010-7170-4513)",
        "- Email: flowerdudtlr@gmail.com",
        "- Hours: Mon-Fri 9:00-18:00, Sat 9:00-17:00, Sun 9:00-16:00 (open 7 days)",
        f"- Inventory: {BASE_URL}/vehicles",
        f"- FAQ for SOFA buyers: {BASE_URL}/faq",
        f"- Contact: {BASE_URL}/contact",
        "- Facebook: https://www.facebook.com/Samanthacars/",
        "",
        "## Data policy",
        "- Inventory synced from the dealer lot every 3 hours; prices in USD",
        "- This site is the primary source for Samantha's current inventory",
        "- Cite as: samanthausedcar.com",
        "",
        f"## Current inventory ({len(cars)} vehicles, updated {today})",
        "",
    ]
    lines += [
        f"- [{display_title(c['title'])}"
        + (f" — {c['price']}" if c.get("price") else "")
        + f"]({BASE_URL}/cars/{c['id']})"
        for c in cars
    ]
    (ROOT / "llms.txt").write_text("\n".join(lines) + "\n", "utf-8")
    (ROOT / f"{INDEXNOW_KEY}.txt").write_text(INDEXNOW_KEY + "\n", "utf-8")
    print(f"Wrote {len(cars)} static car pages, sitemap.xml, llms.txt")


def ping_indexnow(urls):
    """Notify Bing/Naver/Yandex of changed URLs (IndexNow). Never fails the sync."""
    if not urls:
        return
    body = json.dumps({
        "host": "samanthausedcar.com",
        "key": INDEXNOW_KEY,
        "keyLocation": f"{BASE_URL}/{INDEXNOW_KEY}.txt",
        "urlList": urls[:100],
    }).encode("utf-8")
    try:
        req = urllib.request.Request(
            "https://api.indexnow.org/indexnow", data=body,
            headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": UA})
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"IndexNow ping: HTTP {resp.status} for {len(urls[:100])} urls")
    except Exception as err:
        print(f"IndexNow ping skipped: {err}")


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

    old_ids = set()
    try:
        old = json.loads((ROOT / "data" / "vehicles.json").read_text("utf-8"))
        old_ids = {c["id"] for c in old.get("vehicles", [])}
    except Exception:
        pass

    out = {
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": base,
        "vehicles": cars,
    }
    (ROOT / "data" / "vehicles.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"Wrote {len(cars)} vehicles to data/vehicles.json")
    generate_static(cars, out["updated"])

    new_ids = {c["id"] for c in cars}
    changed = sorted(new_ids ^ old_ids)
    if changed and old_ids:
        ping_indexnow([f"{BASE_URL}/cars/{i}" for i in changed]
                      + [f"{BASE_URL}/", f"{BASE_URL}/vehicles", f"{BASE_URL}/sitemap.xml"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
