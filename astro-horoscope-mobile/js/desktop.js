/** Shell Delphi Tfastrologiciel — mêmes boutons / navigation que l'exe 2003. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const viewport = $("#viewport");
  const hint = $("#hint");
  const stage = $("#stage");

  const state = {
    view: "accueil",
    portrait: null,
    horoscope: null,
    theme: {
      nom: "Lydie",
      prenom: "HOUNSA",
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

  function fitStage() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const sw = 1201;
    const sh = 1002;
    const scale = Math.min(ww / sw, wh / sh, 1.15);
    stage.style.transform = `scale(${scale})`;
  }

  function setHint(t) {
    if (hint) hint.textContent = t || "";
  }

  function setActive(view) {
    document.querySelectorAll(".btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.view === view);
    });
  }

  function wireHovers() {
    document.querySelectorAll(".btn img").forEach((img) => {
      const btn = img.closest(".btn");
      const off = img.dataset.off;
      const over = img.dataset.over;
      if (!over) return;
      btn.addEventListener("mouseenter", () => { img.src = over; });
      btn.addEventListener("mouseleave", () => { img.src = off; });
      btn.addEventListener("touchstart", () => { img.src = over; }, { passive: true });
      btn.addEventListener("touchend", () => { img.src = off; }, { passive: true });
    });
  }

  async function loadPortrait() {
    if (state.portrait) return state.portrait;
    const urls = ["./data/sections.json", "data/sections.json"];
    for (const url of urls) {
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
    const urls = ["./data/classique-horoscope.json", "data/classique-horoscope.json"];
    for (const url of urls) {
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
    viewport.className = "blank";
    viewport.innerHTML = "";
    setHint("Accueil — choisissez Thème, Portrait, Cartes, Prévisions…");
  }

  function showTheme() {
    viewport.className = "paper";
    const t = state.theme;
    viewport.innerHTML = `
      <h2 class="panel-title">Thème natal</h2>
      <form class="win-form" id="themeForm">
        <label>Nom <input name="nom" value="${esc(t.nom)}"></label>
        <label>Prénom <input name="prenom" value="${esc(t.prenom)}"></label>
        <label>Date
          <span style="display:flex;gap:4px">
            <input name="day" type="number" min="1" max="31" value="${t.day}" style="width:3.5em">
            <input name="month" type="number" min="1" max="12" value="${t.month}" style="width:3.5em">
            <input name="year" type="number" min="1800" max="2100" value="${t.year}" style="width:5em">
          </span>
        </label>
        <label>Heure légale
          <span style="display:flex;gap:4px">
            <input name="hour" type="number" min="0" max="23" value="${t.hour}" style="width:3.5em"> h
            <input name="minute" type="number" min="0" max="59" value="${t.minute}" style="width:3.5em"> mn
          </span>
        </label>
        <label>Fuseau (UT+) <input name="tz" type="number" step="0.5" value="${t.tz}" style="width:4em"></label>
        <label>Lieu <input name="city" value="${esc(t.city)}"></label>
        <label>Latitude
          <span style="display:flex;gap:4px;align-items:center">
            <input name="latDeg" type="number" value="${t.latDeg}" style="width:3.5em">°
            <input name="latMin" type="number" value="${t.latMin}" style="width:3.5em">′
            <select name="latNS"><option ${t.latNS==="N"?"selected":""}>N</option><option ${t.latNS==="S"?"selected":""}>S</option></select>
          </span>
        </label>
        <label>Longitude
          <span style="display:flex;gap:4px;align-items:center">
            <input name="lonDeg" type="number" value="${t.lonDeg}" style="width:3.5em">°
            <input name="lonMin" type="number" value="${t.lonMin}" style="width:3.5em">′
            <select name="lonEW"><option ${t.lonEW==="E"?"selected":""}>E</option><option ${t.lonEW==="O"?"selected":""}>O</option></select>
          </span>
        </label>
        <div class="win-actions">
          <button type="submit" class="primary">Calculer le ciel</button>
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
    setHint("Thème — saisie natal (même logique que Btn_Nouveau_Theme)");
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
    setHint(`Calcul du ciel — ${birth.name || "thème"} ${chart.golden ? "(golden Delphi)" : ""}`);
  }

  async function showPortrait() {
    viewport.className = "paper";
    const data = await loadPortrait();
    if (!data) {
      viewport.innerHTML = `<p class="empty">Portrait introuvable (data/sections.json)</p>`;
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
    setHint("Portrait astral — textes Delphi (temp.htm / sections)");
  }

  async function showCalculs() {
    viewport.className = "paper";
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
      asp += `          ${a.a.padEnd(14)} - ${a.b.padEnd(14)} Orbe: ${a.orb.toFixed(2)}°\n`;
    }
    viewport.innerHTML = `
      <h2 class="panel-title">Calculs</h2>
      <pre class="calc-out">${esc(window.DelphiCalc.formatCalculDuCiel(chart))}\n${esc(asp)}</pre>
    `;
    setHint("Calculs — longitudes, Placide, aspects (ORBE)");
  }

  function showCartes() {
    viewport.className = "paper";
    const birth = birthFromTheme();
    const chart = window.DelphiCalc.computeNatalExact(birth);
    state.lastChart = chart;
    viewport.innerHTML = `
      <h2 class="panel-title">Carte du Ciel</h2>
      <canvas id="skyCanvas" width="560" height="560" style="display:block;margin:0 auto;background:#fff;border:1px solid #888"></canvas>
      <p style="text-align:center;font-size:12px;margin-top:6px">ASC ${esc(window.DelphiCalc.fmtInSign(chart.asc))} — MC ${esc(window.DelphiCalc.fmtInSign(chart.mc))}</p>
    `;
    drawChart($("#skyCanvas"), chart);
    setHint("Carte du Ciel — roue Placide");
  }

  function drawChart(canvas, chart) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fffef8";
    ctx.fillRect(0, 0, W, H);
    // rotate so ASC is at left (classic)
    const rot = (180 - chart.asc) * Math.PI / 180;
    function polar(lon, r) {
      const a = rot + lon * Math.PI / 180;
      return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    }
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2); ctx.stroke();
    // signs
    for (let i = 0; i < 12; i++) {
      const [x1, y1] = polar(i * 30, R);
      const [x2, y2] = polar(i * 30, R * 0.72);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    // cusps
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
    // planets
    const glyphs = {
      SOLEIL: "☉", LUNE: "☽", MERCURE: "☿", VENUS: "♀", MARS: "♂",
      JUPITER: "♃", SATURNE: "♄", URANUS: "♅", NEPTUNE: "♆", PLUTON: "♇"
    };
    ctx.fillStyle = "#000";
    ctx.font = "16px serif";
    for (const [name, g] of Object.entries(glyphs)) {
      const lon = chart.bodies[name];
      const [x, y] = polar(lon, R * 0.88);
      ctx.fillText(g, x - 6, y + 5);
    }
  }

  async function showPrevisions() {
    viewport.className = "paper";
    // Use Daziano temp.htm if available via fetch from bundled path — else message
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
      <p>Les prévisions (transits) reprennent le moteur Delphi : comparaison du ciel actuel au thème natal.</p>
      <p>Ouvrez un thème puis Portrait pour l’analyse complète. Un export temp.htm peut être chargé ici.</p>
      <div class="win-actions"><button type="button" id="goTheme">Nouveau thème</button></div>
    `;
    $("#goTheme")?.addEventListener("click", () => openView("theme"));
    setHint("Prévisions astrales");
  }

  async function showHoroscopeLike(title, key) {
    viewport.className = "paper";
    const data = await loadHoroscope();
    if (!data || !data.signs) {
      viewport.innerHTML = `<h2 class="panel-title">${esc(title)}</h2><p>Données horoscope absentes.</p>`;
      return;
    }
    const signs = Object.keys(data.signs);
    const first = signs[0];
    viewport.innerHTML = `
      <h2 class="panel-title">${esc(title)}</h2>
      <label style="display:block;margin-bottom:8px">Signe
        <select id="hSign">${signs.map((s) => `<option>${esc(s)}</option>`).join("")}</select>
      </label>
      <label style="display:block;margin-bottom:8px">Fichier
        <select id="hFile"></select>
      </label>
      <div class="legacy-html" id="hBody"></div>
    `;
    const sel = $("#hSign");
    const file = $("#hFile");
    const body = $("#hBody");
    function fillFiles() {
      const pack = data.signs[sel.value] || {};
      const files = Object.keys(pack);
      file.innerHTML = files.map((f) => `<option value="${esc(f)}">${esc(f)}</option>`).join("");
      showFile();
    }
    function showFile() {
      const pack = data.signs[sel.value] || {};
      const html = pack[file.value] || "";
      body.innerHTML = html;
    }
    sel.addEventListener("change", fillFiles);
    file.addEventListener("change", showFile);
    if (first) { sel.value = first; fillFiles(); }
    setHint(title);
  }

  function showCours() {
    viewport.className = "paper";
    viewport.innerHTML = `
      <h2 class="panel-title">Cours d'astrologie</h2>
      <div class="legacy-html" id="coursBody">Chargement…</div>
    `;
    fetch("./data/classique-textes.json").then((r) => r.json()).then((data) => {
      const keys = Object.keys(data).slice(0, 20);
      let html = `<div class="section-nav">${keys.map((k) => `<button type="button" data-k="${esc(k)}">${esc(k)}</button>`).join("")}</div><div id="cTxt"></div>`;
      $("#coursBody").innerHTML = html;
      const show = (k) => { $("#cTxt").innerHTML = `<pre style="white-space:pre-wrap;font:inherit">${esc(data[k] || "")}</pre>`; };
      $("#coursBody").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => show(b.dataset.k)));
      if (keys[0]) show(keys[0]);
    }).catch(() => {
      $("#coursBody").textContent = "Textes de cours non trouvés.";
    });
    setHint("Cours d'astrologie");
  }

  function showReglages() {
    viewport.className = "paper";
    viewport.innerHTML = `
      <h2 class="panel-title">Réglages</h2>
      <p>Domification : <b>PLACIDE</b> (comme l’exe Delphi).</p>
      <p>Orbes : fichier ORBE.DAT (conjonction 10°, carré/trigone 8°, sextile 6°…).</p>
      <p>Couleurs / impression : Imprimer via le bouton dédié.</p>
    `;
    setHint("Réglages — PLACIDE / ORBE");
  }

  function showAide() {
    viewport.className = "paper";
    viewport.innerHTML = `
      <h2 class="panel-title">Aide</h2>
      <p><b>Astrologie</b> — clone de l’interface Windows (Bernard Villemin / Uranie).</p>
      <p>Navigation identique : Accueil, Thème, Portrait, Prévisions, Calculs, Cartes, Cours, Couples, Graphiques, Réglages, Sommaire.</p>
      <p>Le calcul natal pour l’exemple Lydie HOUNSA (24/11/2005 Cotonou) reproduit le ciel Delphi au degré près (référence golden).</p>
    `;
    setHint("Aide");
  }

  function showSommaire() {
    viewport.className = "paper";
    const items = [
      ["theme", "Thème natal"],
      ["portrait", "Portrait astral"],
      ["calculs", "Calculs"],
      ["cartes", "Carte du ciel"],
      ["previsions", "Prévisions"],
      ["cours", "Cours"],
      ["couples", "Astro couples"],
      ["graphiques", "Graphiques / Horoscope"],
      ["reglages", "Réglages"],
      ["aide", "Aide"]
    ];
    viewport.innerHTML = `
      <h2 class="panel-title">Sommaire</h2>
      <div class="section-nav">${items.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join("")}</div>
    `;
    viewport.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => openView(b.dataset.v)));
    setHint("Sommaire");
  }

  function showCouples() {
    viewport.className = "paper";
    viewport.style.backgroundImage = "url(res/fond_couple.jpg)";
    viewport.innerHTML = `
      <h2 class="panel-title">Astro couples</h2>
      <p>Synastrie / comparaison de deux thèmes (module couples de l’exe).</p>
      <p>Saisissez d’abord le thème principal (Thème), puis un second thème (à venir : fiches .nat).</p>
    `;
    setHint("Astro couples");
  }

  function showGraphiques() {
    showHoroscopeLike("Graphiques / Horoscope", "graphiques");
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
    viewport.style.backgroundImage = "";
    switch (view) {
      case "accueil": showAccueil(); break;
      case "theme": showTheme(); break;
      case "portrait": showPortrait(); break;
      case "calculs": showCalculs(); break;
      case "cartes": showCartes(); break;
      case "previsions": showPrevisions(); break;
      case "cours": showCours(); break;
      case "couples": showCouples(); break;
      case "graphiques": showGraphiques(); break;
      case "reglages": showReglages(); break;
      case "aide": showAide(); break;
      case "sommaire": showSommaire(); break;
      case "imprimer": window.print(); setHint("Impression…"); break;
      case "enregistrer":
        setHint("Enregistrer — utilisez Imprimer → PDF du système");
        window.print();
        break;
      case "envoyer":
        setHint("Envoyer — partagez le PDF généré");
        break;
      case "fermer":
        showAccueil();
        break;
      case "quitter":
        setHint("Quitter");
        if (window.confirm("Quitter Astrologie ?")) {
          try { window.close(); } catch (_) {}
          showAccueil();
        }
        break;
      default:
        showAccueil();
    }
  }

  function init() {
    fitStage();
    window.addEventListener("resize", fitStage);
    wireHovers();
    document.querySelectorAll(".btn").forEach((b) => {
      b.addEventListener("click", () => openView(b.dataset.view));
    });
    const hash = (location.hash || "").replace("#","");
    openView(hash || "accueil");
  }

  init();
})();
