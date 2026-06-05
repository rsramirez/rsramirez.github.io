/* i18n.js — language toggle (EN / ES) for static UI text.
 * ADS data (titles, abstracts, authors, journal names) is never translated.
 */
(function () {
  "use strict";

  const STRINGS = {
    en: {
      // Navigation & footer
      "nav-home":          "Home",
      "nav-pubs":          "Publications",
      "footer-data":       "Data from",
      "footer-built":      "Built with",
      // Page header
      "page-title":        "Publications",
      "meta-total-label":  "total",
      "meta-updated":      "Last updated",
      "view-on-ads":       "View on ADS ↗",
      // Stat labels
      "stat-publications": "Publications",
      "stat-refereed":     "Refereed",
      "stat-q1":           "Q1",
      "stat-preprints":    "Preprints",
      "stat-proceedings":  "Proceedings",
      "stat-circulars":    "Circulars",
      "stat-citations":    "Total citations",
      "stat-hindex":       "h-index",
      "stat-filter-hint":  "1 click: exclude · 2 clicks: show only · 3 clicks: reset",
      // Controls
      "search-label":      "Search",
      "search-ph":         "Title, author, keyword…",
      "year-from-label":   "From year",
      "year-to-label":     "To year",
      "journal-label":     "Journal",
      "all-journals":      "All journals",
      "min-cit-label":     "Min. citations",
      "sort-label":        "Sort by",
      "sort-year":         "Year (newest first)",
      "sort-citations":    "Most cited",
      "sort-title":        "Title (A–Z)",
      "reset-btn":         "Reset filters",
      // Dynamic (used by publications.js)
      "summary-none":      "No publications match the current filters.",
      "summary-one":       "Showing 1 publication.",
      "summary-many":      "Showing {from}–{to} of {n} publications.",
      "no-results-title":  "No results",
      "no-results-msg":    "Try adjusting or resetting the filters.",
      "loading":           "Loading…",
      "not-loaded-title":  "Publications not yet loaded",
      "not-loaded-msg":    'The data will appear after the first <a href="https://github.com/rsramirez/rsramirez.github.io/actions" target="_blank" rel="noopener">GitHub Actions run</a>. Make sure the <code>ADS_DEV_KEY</code> secret is configured.',
      "abstract-show":     "Abstract",
      "abstract-hide":     "Hide abstract",
      "badge-refereed":    "✓ Refereed",
      "badge-preprint":    "Preprint",
      "badge-proceedings": "Proceedings",
      "badge-circular":    "Circular",
      "badge-other":       "Other",
      // CV / home section
      "cv-section-title":   "Academic Profile",
      "cv-career-title":    "Career & Internationalization",
      "cv-impact-title":    "Bibliometric Impact",
      "cv-research-title":  "Research Lines",
      "cv-metric-total":    "Publications",
      "cv-metric-cites":    "Citations",
      "cv-metric-hindex":   "h-index (ADS / GS)",
      "cv-metric-q1":       "Q1 Articles",
      "cv-metric-circulars":"GCN Circulars",
      "cv-pillar1-title":   "GRB Afterglow Physics",
      "cv-pillar2-title":   "High-Redshift Spectroscopy",
      "cv-pillar3-title":   "Multi-Messenger Astronomy",
      "cv-source":          "Live data ·",
      "cv-refereed-label":  "refereed",
      "cv-of-which":        "of which",
      "cv-in-q1":           "in Q1 journals",
    },
    es: {
      // Navigation & footer
      "nav-home":          "Inicio",
      "nav-pubs":          "Publicaciones",
      "footer-data":       "Datos de",
      "footer-built":      "Construido con",
      // Page header
      "page-title":        "Publicaciones",
      "meta-total-label":  "en total",
      "meta-updated":      "Última actualización",
      "view-on-ads":       "Ver en ADS ↗",
      // Stat labels
      "stat-publications": "Publicaciones",
      "stat-refereed":     "Revisadas",
      "stat-q1":           "Q1",
      "stat-preprints":    "Preprints",
      "stat-proceedings":  "Actas",
      "stat-circulars":    "Circulares",
      "stat-citations":    "Citas totales",
      "stat-hindex":       "Índice h",
      "stat-filter-hint":  "1 clic: excluir · 2 clics: mostrar solo · 3 clics: reiniciar",
      // Controls
      "search-label":      "Buscar",
      "search-ph":         "Título, autor, palabra clave…",
      "year-from-label":   "Desde año",
      "year-to-label":     "Hasta año",
      "journal-label":     "Revista",
      "all-journals":      "Todas las revistas",
      "min-cit-label":     "Cit. mínimas",
      "sort-label":        "Ordenar por",
      "sort-year":         "Año (más reciente primero)",
      "sort-citations":    "Más citado",
      "sort-title":        "Título (A–Z)",
      "reset-btn":         "Borrar filtros",
      // Dynamic (used by publications.js)
      "summary-none":      "Ninguna publicación coincide con los filtros.",
      "summary-one":       "Mostrando 1 publicación.",
      "summary-many":      "Mostrando {from}–{to} de {n} publicaciones.",
      "no-results-title":  "Sin resultados",
      "no-results-msg":    "Prueba a ajustar o reiniciar los filtros.",
      "loading":           "Cargando…",
      "not-loaded-title":  "Publicaciones no disponibles todavía",
      "not-loaded-msg":    'Los datos aparecerán tras la primera ejecución de <a href="https://github.com/rsramirez/rsramirez.github.io/actions" target="_blank" rel="noopener">GitHub Actions</a>. Asegúrate de que el secreto <code>ADS_DEV_KEY</code> está configurado.',
      "abstract-show":     "Resumen",
      "abstract-hide":     "Ocultar resumen",
      "badge-refereed":    "✓ Revisada",
      "badge-preprint":    "Preprint",
      "badge-proceedings": "Actas",
      "badge-circular":    "Circular",
      "badge-other":       "Otro",
      // CV / home section
      "cv-section-title":   "Perfil Académico",
      "cv-career-title":    "Trayectoria e Internacionalización",
      "cv-impact-title":    "Impacto Bibliométrico",
      "cv-research-title":  "Líneas de Investigación",
      "cv-metric-total":    "Publicaciones",
      "cv-metric-cites":    "Citas",
      "cv-metric-hindex":   "Índice h (ADS / GS)",
      "cv-metric-q1":       "Artículos Q1",
      "cv-metric-circulars":"Circulares GCN",
      "cv-pillar1-title":   "Física de Destellos de Rayos Gamma",
      "cv-pillar2-title":   "Espectroscopía a Alto Redshift",
      "cv-pillar3-title":   "Astronomía Multimensajero",
      "cv-source":          "Datos en tiempo real ·",
      "cv-refereed-label":  "revisadas",
      "cv-of-which":        "de las cuales",
      "cv-in-q1":           "en revistas Q1",
    },
  };

  let lang = localStorage.getItem("lang") || "en";

  function t(key) {
    return (STRINGS[lang] ?? STRINGS.en)[key] ?? (STRINGS.en[key] ?? key);
  }

  function applyTranslations() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-html]").forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });
    const btn = document.getElementById("lang-toggle");
    if (btn) btn.textContent = lang === "en" ? "ES" : "EN";
  }

  function toggleLang() {
    lang = lang === "en" ? "es" : "en";
    localStorage.setItem("lang", lang);
    applyTranslations();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  // Expose to publications.js and other scripts
  window.i18n = { t, lang: () => lang };

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("lang-toggle");
    if (btn) btn.addEventListener("click", toggleLang);
    applyTranslations();
  });
})();
