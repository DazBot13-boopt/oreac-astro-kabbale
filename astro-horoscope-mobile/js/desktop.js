/** Astrologie — UI téléphone responsive, modules Delphi. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const viewport = $("#viewport");
  const hint = $("#hint");

  const state = {
    view: "accueil",
    portrait: null,
    horoscope: null,
    theme: {
      nom: "HOUNSA",
      prenom: "Lydie",
      day: 24, month: 11, year: 2005,
      hour: 8, minute: 58,
      city: "Cotonou",
      latDeg: 6, latMin: 21, latNS: "N",
      lonDeg: 2, lonMin: 25, lonEW: "E",
      tz: 1
    },
    lastChart: null,
    sectionId: 0
  };

  function setHint(t) {
    if (hint) hint.textContent = t || "";
  }

  function setActive(view) {
    document.querySelectorAll(".menu .btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.view === view);
    });
  }

  function showPanel() {
    viewport.className = "viewport paper";
    requestAnimationFrame(() => {
      viewport.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function hidePanel() {
    viewport.className = "viewport blank";
    viewport.innerHTML = "";
  }

  function wireHovers() {
    document.querySelectorAll(".btn img[data-over]").forEach((img) => {
      const btn = img.closest(".btn");
      const off = img.dataset.off;
      const over = img.dataset.over;
      btn.addEventListener("pointerdown", () => { img.src = over; });
      btn.addEventListener("pointerup", () => { img.src = off; });
      btn.addEventListener("pointerleave", () => { img.src = off; });
    });
  }

  async function loadPortrait() {
    if (state.portrait) return state.portrait;
    for (const url of ["./data/sections.json", "data/sections.json"]) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) continue;
        state.portrait = await res.json();
        return state.portrait;
      } catch (_) {}
    }
    return null;
  }

  async function loadHoroscope() {
    if (state.horoscope) return state.horoscope;
    for (const url of ["./data/classique-horoscope.json", "data/classique-horoscope.json"]) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) continue;
        state.horoscope = await res.json();
        return state.horoscope;
      } catch (_) {}
    }
    return null;
  }

  function birthFromTheme() {
    const t = state.theme;
    const lat = (t.latDeg + t.latMin / 60) * (t.latNS === "S" ? -1 : 1);
    const lon = (t.lonDeg + t.lonMin / 60) * (t.lonEW === "O" || t.lonEW === "W" ? -1 : 1);
    return {
      year: +t.year, month: +t.month, day: +t.day,
      hour: +t.hour, minute: +t.minute, second: 0,
      lat, lon, tz: +t.tz,
      name: `${t.prenom} ${t.nom}`.trim()
    };
  }

  function showAccueil() {
    hidePanel();
    setHint("Choisis un module ci-dessous");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showTheme() {
    showPanel();
    const t = state.theme;
    viewport.innerHTML = `
      <h2 class="panel-title">Thème natal</h2>
      <form class="win-form" id="themeForm">
        <label>Nom <input name="nom" value="${esc(t.nom)}" autocomplete="family-name"></label>
        <label>Prénom <input name="prenom" value="${esc(t.prenom)}" autocomplete="given-name"></label>
        <label>Date (j / m / a)
          <div class="row">
            <input name="day" type="number" inputmode="numeric" min="1" max="31" value="${t.day}">
            <input name="month" type="number" inputmode="numeric" min="1" max="12" value="${t.month}">
            <input name="year" type="number" inputmode="numeric" min="1800" max="2100" value="${t.year}">
          </div>
        </label>
        <label>Heure légale (h / mn)
          <div class="row-2">
            <input name="hour" type="number" inputmode="numeric" min="0" max="23" value="${t.hour}">
            <input name="minute" type="number" inputmode="numeric" min="0" max="59" value="${t.minute}">
          </div>
        </label>
        <label>Fuseau (UT+) <input name="tz" type="number" step="0.5" value="${t.tz}"></label>
        <label>Lieu <input name="city" value="${esc(t.city)}"></label>
        <label>Latitude (° ′ N/S)
          <div class="row">
            <input name="latDeg" type="number" value="${t.latDeg}">
            <input name="latMin" type="number" value="${t.latMin}">
            <select name="latNS"><option ${t.latNS==="N"?"selected":""}>N</option><option ${t.latNS==="S"?"selected":""}>S</option></select>
          </div>
        </label>
        <label>Longitude (° ′ E/O)
          <div class="row">
            <input name="lonDeg" type="number" value="${t.lonDeg}">
            <input name="lonMin" type="number" value="${t.lonMin}">
            <select name="lonEW"><option ${t.lonEW==="E"?"selected":""}>E</option><option ${t.lonEW==="O"?"selected":""}>O</option></select>
          </div>
        </label>
        <div class="win-actions">
          <button type="submit" class="primary">Calculer</button>
          <button type="button" id="btnLydie">Exemple Lydie</button>
        </div>
      </form>
      <pre class="calc-out" id="calcOut"></pre>
    `;
    $("#themeForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      for (const k of fd.keys()) {
        const v = fd.get(k);
        if (["day","month","year","hour","minute","tz","latDeg","latMin","lonDeg","lonMin"].includes(k)) {
          state.theme[k] = Number(v);
        } else {
          state.theme[k] = String(v);
        }
      }
      runCalc();
    });
    $("#btnLydie")?.addEventListener("click", () => {
      Object.assign(state.theme, {
        nom: "HOUNSA", prenom: "Lydie",
        day: 24, month: 11, year: 2005, hour: 8, minute: 58,
        city: "Cotonou", latDeg: 6, latMin: 21, latNS: "N",
        lonDeg: 2, lonMin: 25, lonEW: "E", tz: 1
      });
      showTheme();
      runCalc();
    });
    setHint("Thème natal");
  }

  function runCalc() {
    const birth = birthFromTheme();
    const chart = window.DelphiCalc.computeNatalExact(birth);
    state.lastChart = chart;
    const out = $("#calcOut");
    if (out) {
      let txt = window.DelphiCalc.formatCalculDuCiel(chart);
      if (chart.golden) txt = "[Référence Delphi exacte]\n\n" + txt;
      out.textContent = txt;
    }
    setHint(chart.golden ? "Ciel Lydie = Delphi exact" : `Calcul — ${birth.name}`);
  }

  async function showPortrait() {
    showPanel();
    const data = await loadPortrait();
    if (!data) {
      viewport.innerHTML = `<h2 class="panel-title">Portrait</h2><p>Fichier sections.json introuvable.</p>`;
      return;
    }
    const nav = data.sections.map((s) =>
      `<button type="button" data-id="${s.id}" class="${s.id === state.sectionId ? "active" : ""}">${esc(s.label)}</button>`
    ).join("");
    const sec = data.sections.find((s) => s.id === state.sectionId) || data.sections[0];
    viewport.innerHTML = `
      <h2 class="panel-title">${esc(data.title || "Portrait astral")}</h2>
      <div class="section-nav">${nav}</div>
      <div class="legacy-html">${sec.html || ""}</div>
    `;
    viewport.querySelectorAll(".section-nav button").forEach((b) => {
      b.addEventListener("click", () => {
        state.sectionId = Number(b.dataset.id);
        showPortrait();
      });
    });
    setHint("Portrait astral");
  }

  async function showCalculs() {
    showPanel();
    const birth = birthFromTheme();
    const chart = window.DelphiCalc.computeNatalExact(birth);
    state.lastChart = chart;
    const aspects = window.DelphiCalc.listAspects(chart);
    let asp = "LISTE DES ASPECTS\n\n";
    let cur = "";
    for (const a of aspects) {
      if (a.type !== cur) {
        cur = a.type;
        asp += `\n${cur}\n`;
      }
      asp += `  ${a.a} - ${a.b}  Orbe: ${a.orb.toFixed(2)}°\n`;
    }
    viewport.innerHTML = `
      <h2 class="panel-title">Calculs</h2>
      <pre class="calc-out">${esc(window.DelphiCalc.formatCalculDuCiel(chart))}\n${esc(asp)}</pre>
    `;
    setHint("Calculs Placide / aspects");
  }

  function showCartes() {
    showPanel();
    const birth = birthFromTheme();
    const chart = window.DelphiCalc.computeNatalExact(birth);
    state.lastChart = chart;
    viewport.innerHTML = `
      <h2 class="panel-title">Carte du Ciel</h2>
      <canvas id="skyCanvas" width="560" height="560"></canvas>
      <p style="text-align:center;font:12px system-ui;margin-top:8px">
        ASC ${esc(window.DelphiCalc.fmtInSign(chart.asc))}<br>
        MC ${esc(window.DelphiCalc.fmtInSign(chart.mc))}
      </p>
    `;
    drawChart($("#skyCanvas"), chart);
    setHint("Carte du ciel");
  }

  function drawChart(canvas, chart) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fffef8";
    ctx.fillRect(0, 0, W, H);
    const rot = (180 - chart.asc) * Math.PI / 180;
    function polar(lon, r) {
      const a = rot + lon * Math.PI / 180;
      return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    }
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const [x1, y1] = polar(i * 30, R);
      const [x2, y2] = polar(i * 30, R * 0.72);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.strokeStyle = "#800000";
    for (let h = 1; h <= 12; h++) {
      const [x1, y1] = polar(chart.cusps[h], R * 0.72);
      const [x2, y2] = polar(chart.cusps[h], R * 0.2);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const [tx, ty] = polar(chart.cusps[h] + 8, R * 0.55);
      ctx.fillStyle = "#800000";
      ctx.font = "11px Tahoma";
      ctx.fillText(String(h), tx - 4, ty + 4);
    }
    const glyphs = {
      SOLEIL: "☉", LUNE: "☽", MERCURE: "☿", VENUS: "♀", MARS: "♂",
      JUPITER: "♃", SATURNE: "♄", URANUS: "♅", NEPTUNE: "♆", PLUTON: "♇"
    };
    ctx.fillStyle = "#000";
    ctx.font = "16px serif";
    for (const [name, g] of Object.entries(glyphs)) {
      const [x, y] = polar(chart.bodies[name], R * 0.88);
      ctx.fillText(g, x - 6, y + 5);
    }
  }

  async function showPrevisions() {
    showPanel();
    try {
      const res = await fetch("./data/previsions-sample.html", { cache: "no-store" });
      if (res.ok) {
        const html = await res.text();
        viewport.innerHTML = `<h2 class="panel-title">Prévisions</h2><div class="legacy-html">${html}</div>`;
        setHint("Prévisions / transits");
        return;
      }
    } catch (_) {}
    viewport.innerHTML = `
      <h2 class="panel-title">Prévisions</h2>
      <p>Transits Delphi : ciel actuel vs thème natal.</p>
      <div class="win-actions"><button type="button" id="goTheme">Ouvrir Thème</button></div>
    `;
    $("#goTheme")?.addEventListener("click", () => openView("theme"));
    setHint("Prévisions");
  }

  async function showHoroscopeLike(title) {
    showPanel();
    const data = await loadHoroscope();
    if (!data || !data.signs) {
      viewport.innerHTML = `<h2 class="panel-title">${esc(title)}</h2><p>Données horoscope absentes.</p>`;
      return;
    }
    const signs = Object.keys(data.signs);
    viewport.innerHTML = `
      <h2 class="panel-title">${esc(title)}</h2>
      <form class="win-form">
        <label>Signe <select id="hSign">${signs.map((s) => `<option>${esc(s)}</option>`).join("")}</select></label>
        <label>Texte <select id="hFile"></select></label>
      </form>
      <div class="legacy-html" id="hBody" style="margin-top:12px"></div>
    `;
    const sel = $("#hSign");
    const file = $("#hFile");
    const body = $("#hBody");
    function fillFiles() {
      const pack = data.signs[sel.value] || {};
      const files = Object.keys(pack);
      file.innerHTML = files.map((f) => `<option value="${esc(f)}">${esc(f)}</option>`).join("");
      body.innerHTML = pack[file.value] || "";
    }
    sel.addEventListener("change", fillFiles);
    file.addEventListener("change", () => {
      body.innerHTML = (data.signs[sel.value] || {})[file.value] || "";
    });
    if (signs[0]) { sel.value = signs[0]; fillFiles(); }
    setHint(title);
  }

  function showCours() {
    showPanel();
    viewport.innerHTML = `
      <h2 class="panel-title">Cours d'astrologie</h2>
      <div id="coursBody">Chargement…</div>
    `;
    fetch("./data/classique-textes.json").then((r) => r.json()).then((data) => {
      const keys = Object.keys(data).slice(0, 30);
      $("#coursBody").innerHTML = `
        <div class="section-nav">${keys.map((k) => `<button type="button" data-k="${esc(k)}">${esc(k)}</button>`).join("")}</div>
        <pre class="calc-out" id="cTxt"></pre>`;
      const show = (k) => { $("#cTxt").textContent = data[k] || ""; };
      $("#coursBody").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => show(b.dataset.k)));
      if (keys[0]) show(keys[0]);
    }).catch(() => {
      $("#coursBody").textContent = "Textes de cours non trouvés.";
    });
    setHint("Cours");
  }

  function showReglages() {
    showPanel();
    viewport.innerHTML = `
      <h2 class="panel-title">Réglages</h2>
      <p>Domification : <b>PLACIDE</b></p>
      <p>Orbes : ORBE.DAT (conjonction 10°, carré/trigone 8°, sextile 6°…)</p>
    `;
    setHint("Réglages");
  }

  function showAide() {
    showPanel();
    viewport.innerHTML = `
      <h2 class="panel-title">Aide</h2>
      <p>Version téléphone du logiciel Astrologie (Villemin).</p>
      <p>Modules : Thème, Portrait, Calculs, Cartes, Prévisions, Horoscope, Cours…</p>
      <p>Exemple Lydie (24/11/2005 Cotonou) = ciel Delphi exact.</p>
    `;
    setHint("Aide");
  }

  function showSommaire() {
    showPanel();
    const items = [
      ["theme", "Thème natal"], ["portrait", "Portrait"], ["calculs", "Calculs"],
      ["cartes", "Carte du ciel"], ["previsions", "Prévisions"], ["cours", "Cours"],
      ["couples", "Couples"], ["graphiques", "Horoscope"], ["reglages", "Réglages"], ["aide", "Aide"]
    ];
    viewport.innerHTML = `
      <h2 class="panel-title">Sommaire</h2>
      <div class="section-nav" style="flex-wrap:wrap">${items.map(([v, l]) =>
        `<button type="button" data-v="${v}">${l}</button>`).join("")}</div>
    `;
    viewport.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => openView(b.dataset.v)));
    setHint("Sommaire");
  }

  function showCouples() {
    showPanel();
    viewport.innerHTML = `
      <h2 class="panel-title">Astro couples</h2>
      <p>Synastrie : saisis d’abord le thème principal (Thème).</p>
      <div class="win-actions"><button type="button" id="goTheme">Ouvrir Thème</button></div>
    `;
    $("#goTheme")?.addEventListener("click", () => openView("theme"));
    setHint("Astro couples");
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openView(view) {
    state.view = view;
    setActive(view);
    switch (view) {
      case "accueil": showAccueil(); break;
      case "theme": showTheme(); break;
      case "portrait": showPortrait(); break;
      case "calculs": showCalculs(); break;
      case "cartes": showCartes(); break;
      case "previsions": showPrevisions(); break;
      case "cours": showCours(); break;
      case "couples": showCouples(); break;
      case "graphiques": showHoroscopeLike("Horoscope"); break;
      case "reglages": showReglages(); break;
      case "aide": showAide(); break;
      case "sommaire": showSommaire(); break;
      case "imprimer":
      case "enregistrer":
        window.print();
        setHint("Impression / PDF");
        break;
      default:
        showAccueil();
    }
  }

  function init() {
    wireHovers();
    document.querySelectorAll("[data-view]").forEach((b) => {
      b.addEventListener("click", () => openView(b.dataset.view));
    });
    const hash = (location.hash || "").replace("#", "");
    openView(hash || "accueil");
  }

  init();
})();
