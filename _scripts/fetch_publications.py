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

def _run_query(token: str, query: str) -> list[dict]:
    """Execute a single ADS query with automatic pagination; return all docs."""
    headers = {"Authorization": f"Bearer {token}"}
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
        body = resp.json()["response"]
        docs = body["docs"]
        all_docs.extend(docs)
        print(f"    {len(all_docs)} / {body['numFound']}…", end="\r")
        if len(all_docs) >= body["numFound"]:
            break
        params["start"] += len(docs)
    print()
    return all_docs


def search_ads(token: str, orcid: str) -> list[dict]:
    """
    Run one or more ADS queries and return a deduplicated list of docs.

    Why multiple queries?
    ---------------------
    GCN circulars, ATels, and some other record types store author names
    in "Firstname Lastname" order rather than the standard ADS "Lastname, F"
    format.  A search for author:"Sánchez-Ramírez, R" misses those entries.
    Additionally, ADS only associates an ORCID with records that have been
    explicitly claimed — so a pure orcid:{id} query misses GCNs, ATels, and
    many arXiv preprints even when ORCID is available.

    We therefore always issue three name-based queries:
      1.  author:"Sánchez-Ramírez, R"        – standard papers / proceedings
      2.  author:"Sanchez-Ramirez, R"        – same without accent (redundant
                                               on accent-insensitive ADS, but
                                               harmless and future-safe)
      3.  author:"Sanchez-Ramirez"            – surname only: catches GCNs and
                                               ATels that use first-name-first
                                               ordering or only an initial.

    When ORCID is available we also run a fourth orcid:{id} query to pick up
    any papers that might not match by name alone.

    All results are merged and deduplicated by bibcode before disambiguation.
    """
    year_now = datetime.now().year
    seen:     set[str]   = set()
    all_docs: list[dict] = []

    if orcid:
        # ORCID query: authoritative for any paper ADS has claimed
        query = f"orcid:{orcid}"
        print(f"  Query [ORCID]: {query}")
        docs = _run_query(token, query)
        new  = [d for d in docs if d.get("bibcode") not in seen]
        seen.update(d["bibcode"] for d in new)
        all_docs.extend(new)
        print(f"    → {len(new)} new records (total so far: {len(all_docs)})")

    # Name-based: three queries to maximise recall (always run, regardless of ORCID,
    # because GCNs/ATels/preprints are often not ORCID-linked in ADS)
    queries = [
        (f'author:"{AUTHOR_NAME}" year:{RESEARCH_START_YEAR}-{year_now}',
         "standard name with accent"),
        (f'author:"Sanchez-Ramirez, R" year:{RESEARCH_START_YEAR}-{year_now}',
         "standard name without accent"),
        (f'author:"Sanchez-Ramirez" year:{RESEARCH_START_YEAR}-{year_now}',
         "surname only (GCN/ATel/circular style)"),
    ]

    for q, label in queries:
        print(f"  Query [{label}]: {q}")
        docs = _run_query(token, q)
        new  = [d for d in docs if d.get("bibcode") not in seen]
        seen.update(d["bibcode"] for d in new)
        all_docs.extend(new)
        print(f"    → {len(new)} new records (total so far: {len(all_docs)})")

    return all_docs


# ── Author disambiguation ─────────────────────────────────────────────────────

def is_target_author(paper: dict, orcid: str) -> bool:
    """Return True if this paper is authored by Rubén Sánchez-Ramírez.

    Handles both standard ADS format ("Sánchez-Ramírez, R.") and the
    first-name-first format used in GCN circulars / ATels
    ("R. Sánchez-Ramírez", "Ruben Sanchez-Ramirez", etc.).

    When ORCID is known:
      - Accept immediately if the ORCID appears at the matching author position.
      - Reject if a *different* ORCID appears there (foreign author).
      - Otherwise fall through to name-based disambiguation (covers records
        that were never ORCID-claimed in ADS, e.g. most GCNs and ATels).
    """
    authors     = paper.get("author")     or []
    orcids_pub  = paper.get("orcid_pub")  or []
    orcids_user = paper.get("orcid_user") or []

    for i, author in enumerate(authors):
        name_lc = author.lower()
        # Must contain the surname fragment (accent-agnostic)
        if "nchez-ram" not in name_lc:
            continue

        orcid_at = (
            (orcids_pub[i]  if i < len(orcids_pub)  else None)
            or
            (orcids_user[i] if i < len(orcids_user) else None)
        )

        # ORCID at this position matches ours → authoritative accept
        if orcid and orcid_at == orcid:
            return True

        # ADS has a *foreign* ORCID at this position → reject
        if orcid_at and orcid_at not in ("-", ""):
            return False

        # Reject if any excluded first name appears anywhere in the author string.
        # Works for both "Roberto Sánchez-Ramírez" and "Sánchez-Ramírez, Roberto".
        for excl in EXCLUDED_FIRST_NAMES:
            if excl in name_lc:
                return False

        # Accept: surname matches, no disqualifying ORCID, no excluded first name
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

    base = os.path.dirname(__file__)

    # Primary output: static file served directly by GitHub Pages.
    # The JS fetches it via fetch() — no Liquid/Jekyll processing needed.
    out_static = os.path.normpath(os.path.join(base, "..", "assets", "data", "publications.json"))
    os.makedirs(os.path.dirname(out_static), exist_ok=True)
    with open(out_static, "w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)
    print(f"Written: {out_static}")

    # Secondary output: keep _data/ copy for any future Jekyll/Liquid use.
    out_data = os.path.normpath(os.path.join(base, "..", "_data", "publications.json"))
    os.makedirs(os.path.dirname(out_data), exist_ok=True)
    with open(out_data, "w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)
    print(f"Written: {out_data}")

    print(f"Summary: {len(papers)} publications across {len(journals)} journals")


if __name__ == "__main__":
    main()
