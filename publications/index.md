---
layout: publications
title: Publications
---

<section class="page-wrapper">

  <div class="page-header">
    <h1>Publications</h1>
    <p class="page-meta">
      <span id="pub-total">—</span> total &nbsp;&middot;&nbsp;
      Last updated <span id="pub-updated">—</span>
      &nbsp;&middot;&nbsp;
      <a href="https://ui.adsabs.harvard.edu/search/q=author%3A%22S%C3%A1nchez-Ram%C3%ADrez%2CR%22&sort=date+desc" target="_blank" rel="noopener">View on ADS ↗</a>
    </p>
  </div>

  <!-- Stats strip (filled by JS) -->
  <div class="pub-stats">
    <div class="stat-card">
      <span class="stat-value" id="stat-total">—</span>
      <span class="stat-label">Publications</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="stat-refereed">—</span>
      <span class="stat-label">Refereed</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="stat-citations">—</span>
      <span class="stat-label">Total citations</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" id="stat-hindex">—</span>
      <span class="stat-label">h-index</span>
    </div>
  </div>

  <!-- Filter controls -->
  <div class="pub-controls" role="search" aria-label="Filter publications">
    <div class="pub-controls-row">

      <div class="control-group grow">
        <label for="pub-search">Search</label>
        <input type="text" id="pub-search" placeholder="Title, author, keyword…" autocomplete="off">
      </div>

      <div class="control-group narrow">
        <label for="pub-year-from">From year</label>
        <input type="number" id="pub-year-from" value="2010" min="2010">
      </div>

      <div class="control-group narrow">
        <label for="pub-year-to">To year</label>
        <input type="number" id="pub-year-to">
      </div>

      <div class="control-group">
        <label for="pub-journal">Journal</label>
        <select id="pub-journal">
          <option value="">All journals</option>
        </select>
      </div>

      <div class="control-group narrow">
        <label for="pub-min-citations">Min. citations</label>
        <input type="number" id="pub-min-citations" value="0" min="0">
      </div>

      <div class="control-group">
        <label for="pub-sort">Sort by</label>
        <select id="pub-sort">
          <option value="year">Year (newest first)</option>
          <option value="citations">Most cited</option>
          <option value="title">Title (A–Z)</option>
        </select>
      </div>

      <label class="checkbox-wrap">
        <input type="checkbox" id="pub-refereed-only">
        Refereed only
      </label>

    </div>

    <div class="controls-footer">
      <span class="pub-summary" id="pub-summary" aria-live="polite"></span>
      <button class="btn-reset" id="pub-reset" type="button">Reset filters</button>
    </div>

  </div>

  <!-- Publication cards -->
  <div id="pub-list" class="pub-list" aria-label="Publication list">
    <div class="state-box">
      <div class="state-title">Loading…</div>
    </div>
  </div>

  <!-- Pagination -->
  <nav id="pub-pagination" class="pub-pagination" aria-label="Page navigation"></nav>

</section>
