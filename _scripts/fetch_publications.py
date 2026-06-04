#!/usr/bin/env python3
"""
Fetch publications for Rubén Sánchez-Ramírez from NASA ADS and write
_data/publications.json for the GitHub Pages Jekyll site.

Disambiguation strategy
-----------------------
* If AUTHOR_ORCID is set (env var or GitHub Secret), searches by ORCID —
  the most accurate method, zero false positives.
* Otherwise searches by author name + year range and disambiguates by
  inspecting the full author string:
    - Entries explicitly containing a known *excluded* first name
      (e.g. "Roberto") are dropped.
    - Ambiguous "R." entries are kept (minimal false positives since
      Roberto S-R publishes in a different field).
* Any bibcodes listed in EXCLUDE_BIBCODES are always removed (manual
  override for edge-cases).

Usage
-----
    pip install requests
    export ADS_DEV_KEY="<token>"           # required
    export AUTHOR_ORCID="0000-…"           # optional but recommended
    python _scripts/fetch_publications.py
"""

import json
import os
import sys
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    sys.exit("requests is required: pip install requests")


# ── Configuration ─────────────────────────────────────────────────────────────

ADS_BASE_URL         = "https://api.adsabs.harvard.edu/v1"
AUTHOR_NAME          = "Sánchez-Ramírez, R"   # ADS accent-insensitive search
RESEARCH_START_YEAR  = 2010

# First-name substrings (case-insensitive) that belong to *other* people
EXCLUDED_FIRST_NAMES = ["roberto"]

# Bibcodes to always exclude regardless of author matching
EXCLUDE_BIBCODES: set[str] = set()

# ADS fields to retrieve
ADS_FIELDS = [
    "bibcode", "title", "author", "year", "pubdate",
    "pub", "bibstem", "volume", "page", "doi",
    "abstract", "citation_count", "read_count",
    "identifier", "doctype", "property",
    "orcid_pub", "orcid_user",
]


# ── Token loading ─────────────────────────────────────────────────────────────

def load_ads_token() -> str:
    token = os.environ.get("ADS_DEV_KEY", "").strip()
    if token:
        return token
    key_file = os.path.expanduser("~/.ads/dev_key")
    if os.path.exists(key_file):
        with open(key_file) as fh:
            return fh.read().strip()
    sys.exit(
        "ADS_DEV_KEY not found.\n"
        "  • Set the environment variable: export ADS_DEV_KEY=<token>\n"
        "  • Or write the token to ~/.ads/dev_key\n"
        "  • Get a token at https://ui.adsabs.harvard.edu (Account → API Token)"
    )


# ── ADS search (handles pagination) ──────────────────────────────────────────

def search_ads(token: str, orcid: str) -> list[dict]:
    headers = {"Authorization": f"Bearer {token}"}
    year_now = datetime.now().year

    if orcid:
        query = f"orcid:{orcid}"
        print(f"  Query: {query}")
    else:
        query = f'author:"{AUTHOR_NAME}" year:{RESEARCH_START_YEAR}-{year_now}'
        print(f"  Query: {query}")

    params: dict = {
        "q":    query,
        "fl":   ",".join(ADS_FIELDS),
        "rows": 200,
        "start": 0,
        "sort": "date desc",
    }

    all_docs: list[dict] = []
    while True:
        resp = requests.get(
            f"{ADS_BASE_URL}/search/query",
            headers=headers,
            params=params,
            timeout=30,
        )
        resp.raise_for_status()
        body  = resp.json()["response"]
        docs  = body["docs"]
        all_docs.extend(docs)
        print(f"  Retrieved {len(all_docs)} / {body['numFound']}…", end="\r")
        if len(all_docs) >= body["numFound"]:
            break
        params["start"] += len(docs)

    print()  # newline after progress output
    return all_docs


# ── Author disambiguation ─────────────────────────────────────────────────────

def is_target_author(paper: dict, orcid: str) -> bool:
    """Return True if this paper is authored by Rubén Sánchez-Ramírez."""
    if orcid:
        # Already searched by ORCID — every result belongs to the author
        return True

    authors    = paper.get("author") or []
    orcids_pub  = paper.get("orcid_pub")  or []
    orcids_user = paper.get("orcid_user") or []

    for i, author in enumerate(authors):
        name_lc = author.lower()
        # Only inspect Sánchez-Ramírez / Sanchez-Ramirez entries
        if "nchez-ram" not in name_lc:
            continue

        # If ADS has an ORCID for this author position it belongs to someone else
        orcid_at = (
            (orcids_pub[i]  if i < len(orcids_pub)  else None)
            or
            (orcids_user[i] if i < len(orcids_user) else None)
        )
        if orcid_at and orcid_at not in ("-", ""):
            # A different person with their own ORCID → not Rubén
            return False

        # Exclude by known other first name
        for excl in EXCLUDED_FIRST_NAMES:
            if excl in name_lc:
                return False

        # If we reach here: matches the target surname, no disqualifying ORCID,
        # and no excluded first name → accept
        return True

    return False  # surname not found at all


# ── Normalisation ─────────────────────────────────────────────────────────────

def _first_doi(paper: dict) -> str | None:
    for ident in (paper.get("identifier") or []):
        if ident.startswith("10."):
            return ident
    doi_field = paper.get("doi")
    if doi_field:
        return doi_field[0] if isinstance(doi_field, list) else doi_field
    return None


def _arxiv_id(paper: dict) -> str | None:
    for ident in (paper.get("identifier") or []):
        if ident.startswith("arXiv:"):
            return ident[6:]  # strip "arXiv:" prefix
    return None


def normalise(paper: dict) -> dict:
    props    = paper.get("property") or []
    bibstem  = ((paper.get("bibstem") or [""])[0])
    page     = ((paper.get("page")    or [""])[0])
    title    = (paper.get("title")    or [""])[0]
    doi      = _first_doi(paper)
    arxiv_id = _arxiv_id(paper)
    bibcode  = paper.get("bibcode", "")

    return {
        "bibcode":        bibcode,
        "title":          title or "(no title)",
        "authors":        paper.get("author") or [],
        "year":           int(paper.get("year") or 0),
        "pubdate":        paper.get("pubdate", ""),
        "journal":        paper.get("pub", ""),
        "bibstem":        bibstem,
        "volume":         paper.get("volume", ""),
        "page":           page,
        "doi":            doi,
        "arxiv_id":       arxiv_id,
        "abstract":       paper.get("abstract", ""),
        "citation_count": int(paper.get("citation_count") or 0),
        "read_count":     int(paper.get("read_count")     or 0),
        "doctype":        paper.get("doctype", "article"),
        "refereed":       "REFEREED" in props,
        "ads_url":        f"https://ui.adsabs.harvard.edu/abs/{bibcode}",
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    token = load_ads_token()
    orcid = os.environ.get("AUTHOR_ORCID", "").strip()
    if orcid:
        print(f"Using ORCID: {orcid}")

    print("Querying NASA ADS…")
    raw_papers = search_ads(token, orcid)
    print(f"  Total raw results: {len(raw_papers)}")

    # Disambiguate + exclude manually blacklisted bibcodes
    kept = [
        p for p in raw_papers
        if is_target_author(p, orcid) and p.get("bibcode") not in EXCLUDE_BIBCODES
    ]
    discarded = len(raw_papers) - len(kept)
    print(f"  Kept after disambiguation: {len(kept)} (discarded {discarded})")

    # Normalise
    papers = [normalise(p) for p in kept]

    # Sort: newest first, then most-cited
    papers.sort(key=lambda p: (-p["year"], -p["citation_count"]))

    # Collect unique journals (for the frontend dropdown)
    journals = sorted({p["journal"] for p in papers if p["journal"]})

    output = {
        "updated":      datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total":        len(papers),
        "journals":     journals,
        "publications": papers,
    }

    out_path = os.path.join(os.path.dirname(__file__), "..", "_data", "publications.json")
    out_path = os.path.normpath(out_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)

    print(f"Written: {out_path}")
    print(f"Summary: {len(papers)} publications across {len(journals)} journals")


if __name__ == "__main__":
    main()
