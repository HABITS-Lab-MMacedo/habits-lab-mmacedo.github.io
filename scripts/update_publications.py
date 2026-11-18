#!/usr/bin/env python3
"""
Fetch the PI's publications and write them to _data/auto_publications.json,
which the Publications page lists (merged with _data/publications.yml).

Source:
  * Google Scholar, through SerpApi (https://serpapi.com/google-scholar-author-api),
    when the SERPAPI_KEY environment variable is set. Google Scholar itself
    has no official API; SerpApi provides one.
  * OpenAlex (https://openalex.org) otherwise — free, no key needed.

Run by .github/workflows/update-publications.yml every week, or by hand:
  python3 scripts/update_publications.py --scholar-id 1tGv4IIAAAAJ --openalex A5009239429
  SERPAPI_KEY=... python3 scripts/update_publications.py --scholar-id 1tGv4IIAAAAJ

Only the Python standard library is used.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request

OUT = os.path.join(os.path.dirname(__file__), "..", "_data", "auto_publications.json")
UA = "habits-lab-website-publications-updater"

PREPRINT = re.compile(r"arxiv|biorxiv|medrxiv|ssrn|socarxiv|preprint|research square|osf\.io|psyarxiv", re.I)
DATA = re.compile(r"zenodo|dataverse|figshare|dryad|dataset", re.I)
CONFERENCE = re.compile(
    r"conference|proceedings|symposium|workshop|congress|lecture notes|\bLNCS\b|"
    r"\b(LA-?CCI|CEC|GECCO|IJCAI|AAAI|FLAIRS|BRACIS|CBIC|ENIAC|ICALT|IDEAL|ICSI|"
    r"CompleNet|NetSci|IC2S2|CCS|SBAI|SBR|LARS|BRICS)\b|complex networks [ivxlc]+\b|AI research society",
    re.I,
)
BOOK = re.compile(r"handbook|book|ebooks|chapter|IGI Global|CRC Press", re.I)


def classify(venue, title=""):
    text = f"{venue} {title}"
    if PREPRINT.search(venue or ""):
        return "preprint"
    if DATA.search(venue or ""):
        return "data"
    if CONFERENCE.search(text):
        return "conference"
    if BOOK.search(venue or ""):
        return "book"
    return "journal"


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


# ---------- Google Scholar via SerpApi ----------
def from_scholar(author_id, key):
    items, start = [], 0
    while True:
        q = urllib.parse.urlencode({
            "engine": "google_scholar_author", "author_id": author_id, "hl": "en",
            "sort": "pubdate", "num": 100, "start": start, "api_key": key,
        })
        data = get_json("https://serpapi.com/search.json?" + q)
        if "error" in data:
            raise RuntimeError("SerpApi: " + data["error"])
        arts = data.get("articles", [])
        for a in arts:
            pub = a.get("publication") or ""
            # "Applied Intelligence 56 (1), 33, 2026" -> "Applied Intelligence"
            venue = re.split(r"\s+\d|,", pub, maxsplit=1)[0].strip() if pub else ""
            year = a.get("year") or ""
            items.append({
                "title": a.get("title", "").strip(),
                "authors": a.get("authors", ""),
                "venue": venue,
                "year": int(year) if str(year).isdigit() else None,
                "type": classify(pub, a.get("title", "")),
                "url": a.get("link", ""),
                "citations": ((a.get("cited_by") or {}).get("value")) or 0,
            })
        if len(arts) < 100:
            break
        start += 100
    return items


# ---------- OpenAlex ----------
def from_openalex(author_id):
    author_id = author_id.rsplit("/", 1)[-1]
    url = ("https://api.openalex.org/works?filter=author.id:" + author_id +
           "&sort=publication_year:desc&per-page=200"
           "&select=display_name,doi,publication_year,type,primary_location,authorships,cited_by_count")
    items = []
    for w in get_json(url)["results"]:
        loc = w.get("primary_location") or {}
        src = loc.get("source") or {}
        venue = src.get("display_name") or ""
        authors = [((a.get("author") or {}).get("display_name") or "") for a in w.get("authorships") or []]
        if len(authors) > 12:
            authors = authors[:10] + ["…"]
        t = w.get("type")
        kind = {"dataset": "data", "preprint": "preprint"}.get(t)
        if not kind:
            kind = classify(venue, w.get("display_name") or "")
            if kind == "journal" and t in ("book", "book-chapter"):
                kind = "book"
        items.append({
            "title": re.sub(r"<[^>]+>", "", w.get("display_name") or "").strip(),
            "authors": ", ".join(authors),
            "venue": venue,
            "year": w.get("publication_year"),
            "type": kind,
            "url": w.get("doi") or loc.get("landing_page_url") or "",
            "citations": w.get("cited_by_count") or 0,
        })
    return items


def dedupe(items):
    seen, out = set(), []
    for it in items:
        k = re.sub(r"[^a-z0-9]", "", it["title"].lower())
        if k and k not in seen:
            seen.add(k)
            out.append(it)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scholar-id", default="")
    ap.add_argument("--openalex", default="")
    args = ap.parse_args()

    key = os.environ.get("SERPAPI_KEY", "").strip()
    if key and args.scholar_id:
        source, items = "Google Scholar", from_scholar(args.scholar_id, key)
    elif args.openalex:
        source, items = "OpenAlex", from_openalex(args.openalex)
    else:
        sys.exit("Nothing to do: give --scholar-id (with SERPAPI_KEY set) or --openalex.")

    items = dedupe([i for i in items if i["title"]])
    items.sort(key=lambda i: (i["year"] or 0), reverse=True)

    # Safety net: never replace a good list with an empty or much shorter one
    try:
        with open(OUT, encoding="utf-8") as f:
            previous = len(json.load(f).get("items", []))
    except (OSError, ValueError):
        previous = 0
    if not items or len(items) < previous * 0.6:
        sys.exit(f"Refusing to write: got {len(items)} items, previously {previous}.")

    data = {
        "source": source,
        "profile": (f"https://scholar.google.com/citations?user={args.scholar_id}" if source == "Google Scholar"
                    else f"https://openalex.org/{args.openalex.rsplit('/', 1)[-1]}"),
        "updated": dt.date.today().isoformat(),
        "items": items,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write("\n")
    counts = {}
    for i in items:
        counts[i["type"]] = counts.get(i["type"], 0) + 1
    print(f"{source}: wrote {len(items)} publications {counts}")


if __name__ == "__main__":
    main()
