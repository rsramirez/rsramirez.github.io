/* home.js — populates live bibliometric values from publications.json */
(function () {
  "use strict";

  const DATA_URL  = "/assets/data/publications.json";
  const GS_HINDEX = 47;  // Google Scholar h-index (static — update manually)
  const Q1_BS = new Set(["A&A","MNRAS","ApJ","ApJL","ApJS","AJ","PASP","Natur","NatAs",
                          "NatCo","Sci","SciA","PhRvL","PhRvD","PhRvX","JCAP","ARA&A","A&ARv","PNAS"]);

  function computeHIndex(papers) {
    const c = papers.map(p => p.citation_count || 0).sort((a, b) => b - a);
    let h = 0;
    for (let i = 0; i < c.length; i++) { if (c[i] >= i + 1) h = i + 1; }
    return h;
  }

  function fmt(n) { return n.toLocaleString(); }
  function fmtK(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k+" : fmt(n);
  }

  function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function init() {
    fetch(DATA_URL)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(({ publications: pubs = [] }) => {
        const totalCit  = pubs.reduce((s, p) => s + (p.citation_count || 0), 0);
        const refereed  = pubs.filter(p => p.refereed).length;
        const q1        = pubs.filter(p => p.q1 || Q1_BS.has(p.bibstem)).length;
        const circulars = pubs.filter(p => p.kind === "circular").length;
        const procs     = pubs.filter(p => p.kind === "proceedings").length;
        const hADS      = computeHIndex(pubs);

        const nature  = pubs.filter(p => p.bibstem === "Natur").length;
        const science = pubs.filter(p => p.bibstem === "Sci").length;
        const natas   = pubs.filter(p => p.bibstem === "NatAs").length;
        const natco   = pubs.filter(p => p.bibstem === "NatCo").length;

        const setAll = (ids, val) => ids.forEach(id => set(id, val));

        setAll(["cv-total",       "cv-total-b"],         fmt(pubs.length));
        setAll(["cv-citations",   "cv-citations-b"],     fmtK(totalCit));
        setAll(["cv-hindex-ads",  "cv-hindex-ads-b"],    hADS);
        setAll(["cv-hindex-gs",   "cv-hindex-gs-b"],     GS_HINDEX);
        set("cv-refereed",   refereed);
        setAll(["cv-q1",          "cv-q1-b"],            q1);
        setAll(["cv-circulars",   "cv-circulars-b",   "cv-circulars-b-es"],  circulars);
        setAll(["cv-proceedings", "cv-proceedings-b", "cv-proceedings-b-es"],procs);
        setAll(["cv-nature",  "cv-nature-b",  "cv-nature-b-es"],  nature);
        setAll(["cv-science", "cv-science-b", "cv-science-b-es"], science);
        setAll(["cv-natas",   "cv-natas-b",   "cv-natas-b-es"],   natas);
        setAll(["cv-natco",   "cv-natco-b",   "cv-natco-b-es"],   natco);
      })
      .catch(() => {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
