#!/usr/bin/env python3
"""Auto-update the include list in data/sync-config.json from the Facebook page feed.

Fully-automatic mode for the daily sync: reads recent posts from the
"Samantha Used car" Facebook page via the official Graph API, matches each
car post against the current Gorilla Motors inventory (model + price + year),
and rewrites filter.include with the matched product ids.

Runs only when the FB_PAGE_TOKEN environment variable is set (a Meta Page
Access Token stored as a GitHub Actions secret - see README). Without the
token it exits 0 without touching anything, so the hand-maintained include
list keeps working.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from sync_vehicles import fetch, parse_listing  # noqa: E402

# Words that don't identify a model
STOPWORDS = {
    "LOW", "MILES", "US", "SPEC", "SEATER", "SEATS", "AWD", "4WD", "4X4",
    "GAS", "GASOLINE", "DIESEL", "AUTO", "MANUAL", "ASKING", "PRICE",
    "MILEAGE", "SOLD", "PCS", "SALE", "NEW", "ALL", "THE", "AND", "FOR",
}


def tokens(text):
    words = re.sub(r"[^A-Z0-9 ]", " ", text.upper()).split()
    return {w for w in words if w not in STOPWORDS and not re.fullmatch(r"(19|20)\d{2}", w)}


def post_facts(message):
    price = re.search(r"\$\s?([\d,]{3,})", message)
    year = re.search(r"\b((?:19|20)\d{2})\b", message)
    return (
        price.group(1).replace(",", "") if price else None,
        year.group(1) if year else None,
        tokens(message.splitlines()[0] if message else ""),
    )


def match_post(message, inventory):
    price, year, words = post_facts(message)
    if not words:
        return None
    best, best_score = None, 0
    for car in inventory:
        car_words = tokens(car["title"])
        shared = len(words & car_words)
        if not shared:
            continue
        score = shared
        if price and car["price"].replace("$", "").replace(",", "") == price:
            score += 3
        if year and year in car["title"]:
            score += 1
        if score > best_score:
            best, best_score = car, score
    return best if best_score >= 3 else None


def main():
    token = os.environ.get("FB_PAGE_TOKEN", "").strip()
    if not token:
        print("FB_PAGE_TOKEN not set - skipping Facebook auto-match")
        return 0

    page = os.environ.get("FB_PAGE_ID", "me").strip() or "me"
    url = (f"https://graph.facebook.com/v21.0/{page}/posts?"
           + urllib.parse.urlencode({"fields": "message,created_time", "limit": 25,
                                     "access_token": token}))
    with urllib.request.urlopen(url, timeout=30) as resp:
        posts = json.load(resp).get("data", [])
    if not posts:
        print("Facebook returned no posts - leaving include list unchanged")
        return 0

    cfg_path = ROOT / "data" / "sync-config.json"
    cfg = json.loads(cfg_path.read_text("utf-8"))
    base = cfg["base"].rstrip("/")

    inventory, seen = [], set()
    for cat in cfg["source_categories"]:
        for page_no in range(1, 6):
            found = [c for c in parse_listing(
                fetch(f"{base}/category/{cat['path']}/{cat['id']}/?page={page_no}"), base)
                if c["id"] not in seen]
            if not found:
                break
            seen.update(c["id"] for c in found)
            inventory.extend(found)

    include = []
    for post in posts:
        message = post.get("message") or ""
        if not message or message.upper().startswith("SOLD"):
            continue
        car = match_post(message, inventory)
        if car and car["id"] not in include:
            include.append(car["id"])
            print(f"matched: {message.splitlines()[0][:60]!r} -> #{car['id']} {car['title']}")

    if not include:
        print("No posts matched current inventory - leaving include list unchanged")
        return 0

    cfg["filter"]["mode"] = "include"
    cfg["filter"]["include"] = include
    cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"Updated include list with {len(include)} vehicles")
    return 0


if __name__ == "__main__":
    sys.exit(main())
