---
layout: publications
title: Publications
---

<section class="page-wrapper">

  <div class="page-header">
    <h1 data-i18n="page-title">Publications</h1>
    <p class="page-meta">
      <span id="pub-total">—</span> <span data-i18n="meta-total-label">total</span>
      &nbsp;&middot;&nbsp;
      <span data-i18n="meta-updated">Last updated</span> <span id="pub-updated">—</span>
      &nbsp;&middot;&nbsp;
      <a href="https://ui.adsabs.harvard.edu/search/q=author%3A%22S%C3%A1nchez-Ram%C3%ADrez%2CR%22&sort=date+desc" target="_blank" rel="noopener" data-i18n="view-on-ads">View on ADS ↗</a>
    </p>
  </div>

  <!-- Stats strip — non-clickable cards + clickable category filters -->
  <!-- 1 click = exclude · 2 clicks = show only · 3 clicks = reset -->
  <div class="pub-stats">
    <div class="stat-card">
      <span class="stat-value" id="stat-total">—</span>
      <span class="stat-label" data-i18n="stat-publications">Publications</span>
    </div>
    <button class="stat-card stat-filter" data-cat="refereed" data-state="0"
            data-i18n-title="stat-filter-hint"
            title="1 click: exclude · 2 clicks: show only · 3 clicks: reset">
      <span class="stat-value" id="stat-refereed">—</span>
      <span class="stat-label" data-i18n="stat-refereed">Refereed</span>
    </button>
    <button class="stat-card stat-filter" data-cat="q1" data-state="0"
            data-i18n-title="stat-filter-hint"
            title="1 click: exclude · 2 clicks: show only · 3 clicks: reset">
      <span class="stat-value" id="stat-q1">—</span>
      <span class="stat-label" data-i18n="stat-q1">Q1</span>
    </button>
    <button class="stat-card stat-filter" data-cat="preprint" data-state="0"
            data-i18n-title="stat-filter-hint"
            title="1 click: exclude · 2 clicks: show only · 3 clicks: reset">
      <span class="stat-value" id="stat-preprint">—</span>
      <span class="stat-label" data-i18n="stat-preprints">Preprints</span>
    </button>
    <button class="stat-card stat-filter" data-cat="proceedings" data-state="0"
            data-i18n-title="stat-filter-hint"
            title="1 click: exclude · 2 clicks: show only · 3 clicks: reset">
      <span class="stat-value" id="stat-proceedings">—</span>
      <span class="stat-label" data-i18n="stat-proceedings">Proceedings</span>
    </button>
    <button class="stat-card stat-filter" data-cat="circular" data-state="0"
            data-i18n-title="stat-filter-hint"
            title="1 click: exclude · 2 clicks: show only · 3 clicks: reset">
      <span class="stat-value" id="stat-circular">—</span>
      <span class="stat-label" data-i18n="stat-circulars">Circulars</span>
    </button>
    <div class="stat-card">
      <span class="stat-value" id="stat-citations">—</span>
      <span class="stat-label" data-i18n="stat-citations">Total citations</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="stat-hindex">—</span>
      <span class="stat-label" data-i18n="stat-hindex">h-index</span>
    </div>
  </div>

  <!-- Filter controls -->
  <div class="pub-controls" role="search" aria-label="Filter publications">
    <div class="pub-controls-row">

      <div class="control-group grow">
        <label for="pub-search" data-i18n="search-label">Search</label>
        <input type="text" id="pub-search"
               data-i18n-placeholder="search-ph"
               placeholder="Title, author, keyword…" autocomplete="off">
      </div>

      <div class="control-group narrow">
        <label for="pub-year-from" data-i18n="year-from-label">From year</label>
        <input type="number" id="pub-year-from" value="2010" min="2010">
      </div>

      <div class="control-group narrow">
        <label for="pub-year-to" data-i18n="year-to-label">To year</label>
        <input type="number" id="pub-year-to">
      </div>

      <div class="control-group">
        <label for="pub-journal" data-i18n="journal-label">Journal</label>
        <select id="pub-journal">
          <option value="" data-i18n="all-journals">All journals</option>
        </select>
      </div>

      <div class="control-group narrow">
        <label for="pub-min-citations" data-i18n="min-cit-label">Min. citations</label>
        <input type="number" id="pub-min-citations" value="0" min="0">
      </div>

      <div class="control-group">
        <label for="pub-sort" data-i18n="sort-label">Sort by</label>
        <select id="pub-sort">
          <option value="year"      data-i18n="sort-year">Year (newest first)</option>
          <option value="citations" data-i18n="sort-citations">Most cited</option>
          <option value="title"     data-i18n="sort-title">Title (A–Z)</option>
        </select>
      </div>

    </div>

    <div class="controls-footer">
      <span class="pub-summary" id="pub-summary" aria-live="polite"></span>
      <button class="btn-reset" id="pub-reset" type="button" data-i18n="reset-btn">Reset filters</button>
    </div>

  </div>

  <!-- Publication cards -->
  <div id="pub-list" class="pub-list" aria-label="Publication list">
    <div class="state-box">
      <div class="state-title" data-i18n="loading">Loading…</div>
    </div>
  </div>

  <!-- Pagination -->
  <nav id="pub-pagination" class="pub-pagination" aria-label="Page navigation"></nav>

</section>
