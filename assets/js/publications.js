/* publications.js — client-side filter, sort, and render engine
 * Reads window.PUBLICATIONS_DATA injected by Jekyll from _data/publications.json
 */
(function () {
  "use strict";

  /* ── Constants ───────────────────────────────────────────────────────────── */
  const PAGE_SIZE    = 20;
  const DEBOUNCE_MS  = 200;
  // Matches Sánchez-Ramírez / Sanchez-Ramirez case-insensitively
  const AUTHOR_RE    = /s[aá]nchez[\s-]*ram[ií]rez/i;
  const MAX_AUTHORS  = 8;  // authors shown before "et al."

  /* ── State ───────────────────────────────────────────────────────────────── */
  let allPapers      = [];
  let filteredPapers = [];
  let currentPage    = 1;

  const filters = {
    search:      "",
    yearFrom:    0,
    yearTo:      9999,
    journal:     "",
    minCit:      0,
    refereedOnly: false,
    sortBy:      "year",   // "year" | "citations" | "title"
  };

  /* ── DOM refs (resolved once on init) ───────────────────────────────────── */
  const el = {};

  function resolveRefs() {
    const ids = [
      "pub-list", "pub-summary", "pub-pagination",
      "pub-search", "pub-year-from", "pub-year-to",
      "pub-journal", "pub-min-citations", "pub-sort",
      "pub-refereed-only", "pub-reset",
      "pub-updated", "pub-total",
      "stat-total", "stat-refereed", "stat-citations", "stat-hindex",
    ];
    ids.forEach(id => { el[id] = document.getElementById(id); });
  }

  /* ── Initialisation ──────────────────────────────────────────────────────── */
  function init() {
    resolveRefs();

    const data = window.PUBLICATIONS_DATA;
    if (!data || !Array.isArray(data.publications) || data.publications.length === 0) {
      if (el["pub-list"]) {
        el["pub-list"].innerHTML = stateBox(
          "Publications not yet loaded",
          'The data will appear after the first <a href="https://github.com/rsramirez/rsramirez.github.io/actions" target="_blank" rel="noopener">GitHub Actions run</a>. Make sure the <code>ADS_DEV_KEY</code> secret is configured.'
        );
      }
      return;
    }

    allPapers = data.publications;

    // ── Populate metadata displays ─────────────────────────────────────────
    if (el["pub-updated"] && data.updated) {
      el["pub-updated"].textContent = new Date(data.updated).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
    }
    if (el["pub-total"]) el["pub-total"].textContent = allPapers.length;

    // ── Compute and display stats ──────────────────────────────────────────
    renderStats(allPapers);

    // ── Populate journal dropdown ──────────────────────────────────────────
    if (el["pub-journal"] && Array.isArray(data.journals)) {
      data.journals.forEach(j => {
        const opt = document.createElement("option");
        opt.value       = j;
        opt.textContent = j;
        el["pub-journal"].appendChild(opt);
      });
    }

    // ── Set year-range defaults from actual data ───────────────────────────
    const years  = allPapers.map(p => p.year).filter(Boolean);
    const minY   = Math.min(...years);
    const maxY   = Math.max(...years);
    filters.yearFrom = minY;
    filters.yearTo   = maxY;
    if (el["pub-year-from"]) { el["pub-year-from"].value = minY; el["pub-year-from"].min = minY; el["pub-year-from"].max = maxY; }
    if (el["pub-year-to"])   { el["pub-year-to"].value   = maxY; el["pub-year-to"].min   = minY; el["pub-year-to"].max   = maxY; }

    // ── Wire controls ──────────────────────────────────────────────────────
    el["pub-search"]        && el["pub-search"].addEventListener("input",  debounce(onSearchInput,  DEBOUNCE_MS));
    el["pub-year-from"]     && el["pub-year-from"].addEventListener("input", onFilterChange);
    el["pub-year-to"]       && el["pub-year-to"].addEventListener("input",   onFilterChange);
    el["pub-journal"]       && el["pub-journal"].addEventListener("change",  onFilterChange);
    el["pub-min-citations"] && el["pub-min-citations"].addEventListener("input", debounce(onFilterChange, DEBOUNCE_MS));
    el["pub-refereed-only"] && el["pub-refereed-only"].addEventListener("change", onFilterChange);
    el["pub-sort"]          && el["pub-sort"].addEventListener("change",    onSortChange);
    el["pub-reset"]         && el["pub-reset"].addEventListener("click",    onReset);

    applyAndRender();
  }

  /* ── Stats ───────────────────────────────────────────────────────────────── */
  function renderStats(papers) {
    const totalCit  = papers.reduce((s, p) => s + (p.citation_count || 0), 0);
    const refereed  = papers.filter(p => p.refereed).length;
    const hIndex    = computeHIndex(papers);

    setText("stat-total",    papers.length);
    setText("stat-refereed", refereed);
    setText("stat-citations", totalCit.toLocaleString());
    setText("stat-hindex",   hIndex);
  }

  function computeHIndex(papers) {
    const counts = papers.map(p => p.citation_count || 0).sort((a, b) => b - a);
    let h = 0;
    for (let i = 0; i < counts.length; i++) {
      if (counts[i] >= i + 1) h = i + 1; else break;
    }
    return h;
  }

  function setText(id, value) {
    const node = el[id] || document.getElementById(id);
    if (node) node.textContent = value;
  }

  /* ── Event handlers ──────────────────────────────────────────────────────── */
  function onSearchInput() {
    filters.search = (el["pub-search"].value || "").trim().toLowerCase();
    currentPage = 1;
    applyAndRender();
  }

  function onFilterChange() {
    filters.yearFrom     = parseInt(el["pub-year-from"]?.value)     || 0;
    filters.yearTo       = parseInt(el["pub-year-to"]?.value)       || 9999;
    filters.journal      = el["pub-journal"]?.value                 || "";
    filters.minCit       = parseInt(el["pub-min-citations"]?.value) || 0;
    filters.refereedOnly = el["pub-refereed-only"]?.checked         || false;
    currentPage = 1;
    applyAndRender();
  }

  function onSortChange() {
    filters.sortBy = el["pub-sort"]?.value || "year";
    currentPage = 1;
    applyAndRender();
  }

  function onReset() {
    if (el["pub-search"])        el["pub-search"].value = "";
    if (el["pub-min-citations"]) el["pub-min-citations"].value = 0;
    if (el["pub-refereed-only"]) el["pub-refereed-only"].checked = false;
    if (el["pub-journal"])       el["pub-journal"].value = "";
    if (el["pub-sort"])          el["pub-sort"].value = "year";

    const years = allPapers.map(p => p.year).filter(Boolean);
    const minY  = Math.min(...years);
    const maxY  = Math.max(...years);
    if (el["pub-year-from"]) el["pub-year-from"].value = minY;
    if (el["pub-year-to"])   el["pub-year-to"].value   = maxY;

    Object.assign(filters, {
      search: "", yearFrom: minY, yearTo: maxY,
      journal: "", minCit: 0, refereedOnly: false, sortBy: "year",
    });
    currentPage = 1;
    applyAndRender();
  }

  /* ── Filter + sort ───────────────────────────────────────────────────────── */
  function applyFilters() {
    const { search, yearFrom, yearTo, journal, minCit, refereedOnly } = filters;

    filteredPapers = allPapers.filter(p => {
      if (p.year < yearFrom || p.year > yearTo)     return false;
      if (journal && p.journal !== journal)          return false;
      if ((p.citation_count || 0) < minCit)          return false;
      if (refereedOnly && !p.refereed)               return false;
      if (search) {
        const haystack = [
          p.title, ...(p.authors || []), p.journal, p.abstract || "",
        ].join(" ").toLowerCase();
        // Support multi-word search: all words must match
        return search.split(/\s+/).every(w => haystack.includes(w));
      }
      return true;
    });

    // Sort
    if (filters.sortBy === "citations") {
      filteredPapers.sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0) || b.year - a.year);
    } else if (filters.sortBy === "title") {
      filteredPapers.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default: year desc, then citations desc
      filteredPapers.sort((a, b) => b.year - a.year || (b.citation_count || 0) - (a.citation_count || 0));
    }
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */
  function applyAndRender() {
    applyFilters();
    renderSummary();
    renderList();
    renderPagination();
  }

  function renderSummary() {
    if (!el["pub-summary"]) return;
    const n    = filteredPapers.length;
    const from = n ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
    const to   = Math.min(currentPage * PAGE_SIZE, n);
    el["pub-summary"].textContent =
      n === 0 ? "No publications match the current filters." :
      n === 1 ? "Showing 1 publication." :
      `Showing ${from}–${to} of ${n} publications.`;
  }

  function renderList() {
    if (!el["pub-list"]) return;
    if (filteredPapers.length === 0) {
      el["pub-list"].innerHTML = stateBox("No results", "Try adjusting or resetting the filters.");
      return;
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    const page  = filteredPapers.slice(start, start + PAGE_SIZE);
    el["pub-list"].innerHTML = page.map((p, i) => cardHTML(p, start + i + 1)).join("");

    // Abstract toggle listeners
    el["pub-list"].querySelectorAll(".btn-abstract").forEach(btn => {
      btn.addEventListener("click", () => {
        const card  = btn.closest(".pub-card");
        const box   = card.querySelector(".pub-abstract-box");
        const open  = box.classList.toggle("is-open");
        btn.classList.toggle("is-open", open);
        btn.querySelector(".abs-label").textContent = open ? "Hide abstract" : "Abstract";
      });
    });
  }

  function renderPagination() {
    if (!el["pub-pagination"]) return;
    const total = Math.ceil(filteredPapers.length / PAGE_SIZE);
    if (total <= 1) { el["pub-pagination"].innerHTML = ""; return; }

    const parts = [];
    const btn   = (label, page, cls = "") => {
      const disabled = cls.includes("disabled") ? " disabled" : "";
      const active   = cls.includes("is-active") ? " is-active" : "";
      return `<button class="page-btn${active}"${disabled} data-page="${page}">${label}</button>`;
    };

    parts.push(btn("&#8249;", currentPage - 1, currentPage === 1 ? "disabled" : ""));

    pageRange(currentPage, total).forEach(p => {
      if (p === "…") {
        parts.push('<span class="page-ellipsis">…</span>');
      } else {
        parts.push(btn(p, p, p === currentPage ? "is-active" : ""));
      }
    });

    parts.push(btn("&#8250;", currentPage + 1, currentPage === total ? "disabled" : ""));
    el["pub-pagination"].innerHTML = parts.join("");

    el["pub-pagination"].querySelectorAll(".page-btn[data-page]").forEach(b => {
      b.addEventListener("click", () => {
        const p = parseInt(b.dataset.page);
        if (p >= 1 && p <= total && p !== currentPage) {
          currentPage = p;
          applyAndRender();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  }

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
  function pageRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4)   return [1, 2, 3, 4, 5, "…", total];
    if (cur >= total - 3) return [1, "…", total-4, total-3, total-2, total-1, total];
    return [1, "…", cur-1, cur, cur+1, "…", total];
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  }

  function esc(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatAuthors(authors) {
    if (!authors || !authors.length) return "";
    const list = (authors.length > MAX_AUTHORS ? authors.slice(0, MAX_AUTHORS) : authors).map(a =>
      AUTHOR_RE.test(a)
        ? `<span class="author-me">${esc(a)}</span>`
        : esc(a)
    );
    if (authors.length > MAX_AUTHORS) list.push("<em>et al.</em>");
    return list.join(", ");
  }

  function cardHTML(p, idx) {
    // Title with link (prefer DOI, fallback to ADS)
    const href       = p.doi ? `https://doi.org/${esc(p.doi)}` : esc(p.ads_url);
    const titleLink  = `<a href="${href}" target="_blank" rel="noopener">${esc(p.title)}</a>`;

    // Badges
    const refBadge   = p.refereed
      ? `<span class="badge badge-refereed">&#10003; Refereed</span>`
      : `<span class="badge badge-preprint">Preprint</span>`;
    const citBadge   = p.citation_count > 0
      ? `<span class="badge badge-citations">&#9733; ${p.citation_count}</span>`
      : "";

    // Meta line: Journal · Volume · Page · Year
    const metaItems  = [];
    if (p.journal) metaItems.push(`<span class="pub-journal">${esc(p.journal)}</span>`);
    if (p.volume)  metaItems.push(`${esc(p.volume)}`);
    if (p.page)    metaItems.push(`p.&nbsp;${esc(p.page)}`);
    if (p.year)    metaItems.push(`<span class="pub-year">${p.year}</span>`);
    const metaLine   = metaItems.join(' <span aria-hidden="true">·</span> ');

    // Action links
    const links      = [`<a class="pub-extlink" href="${esc(p.ads_url)}" target="_blank" rel="noopener">ADS ↗</a>`];
    if (p.doi)      links.push(`<a class="pub-extlink" href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">DOI ↗</a>`);
    if (p.arxiv_id) links.push(`<a class="pub-extlink" href="https://arxiv.org/abs/${esc(p.arxiv_id)}" target="_blank" rel="noopener">arXiv ↗</a>`);

    const absBtn     = p.abstract
      ? `<button class="btn-abstract" aria-expanded="false" title="Toggle abstract">
           <span class="arrow" aria-hidden="true">&#9658;</span>
           <span class="abs-label">Abstract</span>
         </button>`
      : "";
    const absBox     = p.abstract
      ? `<div class="pub-abstract-box" role="region">${esc(p.abstract)}</div>`
      : "";

    return `<article class="pub-card">
  <div class="pub-card-top">
    <span class="pub-index">${idx}.</span>
    <div class="pub-badges">${refBadge}${citBadge}</div>
  </div>
  <div class="pub-title">${titleLink}</div>
  <div class="pub-authors">${formatAuthors(p.authors)}</div>
  <div class="pub-meta">${metaLine}</div>
  <div class="pub-actions">
    ${absBtn}
    ${links.join("")}
  </div>
  ${absBox}
</article>`;
  }

  function stateBox(title, msg) {
    return `<div class="state-box"><div class="state-title">${title}</div><p>${msg}</p></div>`;
  }

  /* ── Boot ─────────────────────────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
