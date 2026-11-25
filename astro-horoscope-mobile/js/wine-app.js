/** Clone de Astrologie & Horoscope.exe (écran Wine Choix + modules). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const stage = $("#stage");
  const fit = $("#fit");
  const moduleEl = $("#module");
  const modBody = $("#modBody");
  const modTitle = $("#modTitle");

  const KEY = "ah-profiles-v1";
  const state = {
    profiles: [],
    current: 0,
    theme: {
      nom: "TOGBEDJI", prenom: "Daziano",
      day: 13, month: 6, year: 2007, hour: 8, minute: 58,
      city: "Cotonou", latDeg: 6, latMin: 21, latNS: "N",
      lonDeg: 2, lonMin: 25, lonEW: "E", tz: 1
    },
    portrait: null,
    horoscope: null,
    sectionId: 0
  };

  function fitStage() {
    const pad = 8;
    const ww = fit.clientWidth - pad;
    const wh = fit.clientHeight - pad;
    const scale = Math.min(ww / 640, wh / 480);
    stage.style.transform = `scale(${scale})`;
  }

  function loadProfiles() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state.profiles = JSON.parse(raw);
    } catch (_) {}
    if (!Array.isArray(state.profiles) || !state.profiles.length) {
      state.profiles = [{ nom: "TOGBEDJI", prenom: "Daziano" }];
    }
  }

  function saveProfiles() {
    localStorage.setItem(KEY, JSON.stringify(state.profiles));
  }

  function label(p) {
    return `${(p.nom || "").toUpperCase()} ${p.prenom || ""}`.trim();
  }

  function renderProfiles() {
    const list = $("#profileList");
    list.innerHTML = "";
    state.profiles.forEach((p, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = label(p);
      if (i === state.current) opt.selected = true;
      list.appendChild(opt);
    });
  }

  function selectedProfile() {
    return state.profiles[state.current] || { nom: "", prenom: "" };
  }

  function openModule(title) {
    fit.classList.add("hidden");
    fit.style.display = "none";
    moduleEl.classList.remove("hidden");
    modTitle.textContent = title;
  }

  function closeModule() {
    moduleEl.classList.add("hidden");
    fit.style.display = "grid";
    fitStage();
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

  function showAstroHub() {
    openModule("Astrologie");
    modBody.innerHTML = `
      <div class="mod-tiles">
        <button type="button" data-m="theme"><img src="res/theme_off.png" alt=""><span>Thème natal</span></button>
        <button type="button" data-m="portrait"><img src="res/portrait_off.png" alt=""><span>Portrait</span></button>
        <button type="button" data-m="calculs"><img src="res/calculs_off.png" alt=""><span>Calculs</span></button>
        <button type="button" data-m="cartes"><img src="res/cartes_off.png" alt=""><span>Carte du ciel</span></button>
        <button type="button" data-m="previsions"><img src="res/previsions_off.png" alt=""><span>Prévisions</span></button>
        <button type="button" data-m="cours"><img src="res/cours_off.png" alt=""><span>Cours</span></button>
        <button type="button" data-m="couples"><img src="res/astro_couples_off.png" alt=""><span>Couples</span></button>
        <button type="button" data-m="reglages"><img src="res/reglages_off.png" alt=""><span>Réglages</span></button>
      </div>
      <p style="text-align:center;color:#ddd;font:13px system-ui">Modules du logiciel Astrologie (comme sous Wine).</p>
    `;
    modBody.querySelectorAll("[data-m]").forEach((b) => {
      b.addEventListener("click", () => openAstroView(b.dataset.m));
    });
  }

  function openAstroView(view) {
    if (view === "theme") return showTheme();
    if (view === "portrait") return showPortrait();
    if (view === "calculs") return showCalculs();
    if (view === "cartes") return showCartes();
    if (view === "previsions") return showPrevisions();
    if (view === "cours") return showCours();
    if (view === "couples") {
      openModule("Astro couples");
      modBody.innerHTML = `<div class="paper"><h2 class="panel-title">Astro couples</h2><p>Synastrie — saisis d’abord un thème.</p><div class="win-actions"><button type="button" id="goT">Thème</button></div></div>`;
      $("#goT")?.addEventListener("click", showTheme);
      return;
    }
    if (view === "reglages") {
      openModule("Réglages");
      modBody.innerHTML = `<div class="paper"><h2 class="panel-title">Réglages</h2><p>Domification <b>PLACIDE</b> — orbes ORBE.DAT.</p></div>`;
    }
  }

  function showTheme() {
    openModule("Thème natal");
    const t = state.theme;
    const p = selectedProfile();
    if (p.nom) t.nom = p.nom;
    if (p.prenom) t.prenom = p.prenom;
    modBody.innerHTML = `
      <div class="paper">
        <h2 class="panel-title">Coordonnées natales</h2>
        <form class="win-form" id="themeForm">
          <label>Nom <input name="nom" value="${esc(t.nom)}"></label>
          <label>Prénom <input name="prenom" value="${esc(t.prenom)}"></label>
          <label>Date (j / m / a)<div class="row">
            <input name="day" type="number" value="${t.day}"><input name="month" type="number" value="${t.month}"><input name="year" type="number" value="${t.year}">
          </div></label>
          <label>Heure (h / mn)<div class="row-2">
            <input name="hour" type="number" value="${t.hour}"><input name="minute" type="number" value="${t.minute}">
          </div></label>
          <label>Fuseau UT+ <input name="tz" type="number" step="0.5" value="${t.tz}"></label>
          <label>Lieu <input name="city" value="${esc(t.city)}"></label>
          <label>Latitude<div class="row">
            <input name="latDeg" type="number" value="${t.latDeg}"><input name="latMin" type="number" value="${t.latMin}">
            <select name="latNS"><option ${t.latNS==="N"?"selected":""}>N</option><option ${t.latNS==="S"?"selected":""}>S</option></select>
          </div></label>
          <label>Longitude<div class="row">
            <input name="lonDeg" type="number" value="${t.lonDeg}"><input name="lonMin" type="number" value="${t.lonMin}">
            <select name="lonEW"><option ${t.lonEW==="E"?"selected":""}>E</option><option ${t.lonEW==="O"?"selected":""}>O</option></select>
          </div></label>
          <div class="win-actions">
            <button type="submit" class="primary">Calculer le ciel</button>
            <button type="button" id="btnLydie">Exemple Lydie</button>
          </div>
        </form>
        <pre class="calc-out" id="calcOut"></pre>
      </div>`;
    $("#themeForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      for (const k of fd.keys()) {
        const v = fd.get(k);
        state.theme[k] = ["day","month","year","hour","minute","tz","latDeg","latMin","lonDeg","lonMin"].includes(k) ? Number(v) : String(v);
      }
      const chart = window.DelphiCalc.computeNatalExact(birthFromTheme());
      let txt = window.DelphiCalc.formatCalculDuCiel(chart);
      if (chart.golden) txt = "[Référence Delphi exacte]\n\n" + txt;
      $("#calcOut").textContent = txt;
    });
    $("#btnLydie")?.addEventListener("click", () => {
      Object.assign(state.theme, {
        nom: "HOUNSA", prenom: "Lydie", day: 24, month: 11, year: 2005,
        hour: 8, minute: 58, city: "Cotonou", latDeg: 6, latMin: 21, latNS: "N",
        lonDeg: 2, lonMin: 25, lonEW: "E", tz: 1
      });
      showTheme();
      setTimeout(() => $("#themeForm")?.requestSubmit(), 0);
    });
  }

  async function showPortrait() {
    openModule("Portrait astral");
    const data = await loadPortrait();
    if (!data) {
      modBody.innerHTML = `<div class="paper"><p>Portrait introuvable.</p></div>`;
      return;
    }
    const nav = data.sections.map((s) =>
      `<button type="button" data-id="${s.id}" class="${s.id===state.sectionId?"active":""}">${esc(s.label)}</button>`
    ).join("");
    const sec = data.sections.find((s) => s.id === state.sectionId) || data.sections[0];
    modBody.innerHTML = `<div class="paper"><h2 class="panel-title">${esc(data.title||"Portrait")}</h2><div class="section-nav">${nav}</div><div class="legacy-html">${sec.html||""}</div></div>`;
    modBody.querySelectorAll(".section-nav button").forEach((b) => {
      b.addEventListener("click", () => { state.sectionId = Number(b.dataset.id); showPortrait(); });
    });
  }

  function showCalculs() {
    openModule("Calculs");
    const chart = window.DelphiCalc.computeNatalExact(birthFromTheme());
    const aspects = window.DelphiCalc.listAspects(chart);
    let asp = "LISTE DES ASPECTS\n";
    let cur = "";
    for (const a of aspects) {
      if (a.type !== cur) { cur = a.type; asp += `\n${cur}\n`; }
      asp += `  ${a.a} - ${a.b}  Orbe: ${a.orb.toFixed(2)}°\n`;
    }
    modBody.innerHTML = `<div class="paper"><h2 class="panel-title">Calculs</h2><pre class="calc-out">${esc(window.DelphiCalc.formatCalculDuCiel(chart))}\n${esc(asp)}</pre></div>`;
  }

  function showCartes() {
    openModule("Carte du Ciel");
    const chart = window.DelphiCalc.computeNatalExact(birthFromTheme());
    modBody.innerHTML = `<div class="paper"><h2 class="panel-title">Carte du Ciel</h2><canvas id="skyCanvas" width="560" height="560"></canvas></div>`;
    const canvas = $("#skyCanvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, R = Math.min(W,H)*0.42;
    const rot = (180 - chart.asc) * Math.PI / 180;
    const polar = (lon, r) => {
      const a = rot + lon * Math.PI / 180;
      return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    };
    ctx.fillStyle = "#fffef8"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = "#333";
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,R*0.72,0,Math.PI*2); ctx.stroke();
    for (let i=0;i<12;i++){ const [x1,y1]=polar(i*30,R); const [x2,y2]=polar(i*30,R*0.72); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
    ctx.strokeStyle="#800000";
    for (let h=1;h<=12;h++){ const [x1,y1]=polar(chart.cusps[h],R*0.72); const [x2,y2]=polar(chart.cusps[h],R*0.2); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
    const glyphs={SOLEIL:"☉",LUNE:"☽",MERCURE:"☿",VENUS:"♀",MARS:"♂",JUPITER:"♃",SATURNE:"♄",URANUS:"♅",NEPTUNE:"♆",PLUTON:"♇"};
    ctx.fillStyle="#000"; ctx.font="16px serif";
    for (const [n,g] of Object.entries(glyphs)){ const [x,y]=polar(chart.bodies[n],R*0.88); ctx.fillText(g,x-6,y+5); }
  }

  async function showPrevisions() {
    openModule("Prévisions");
    try {
      const res = await fetch("./data/previsions-sample.html", { cache: "no-store" });
      if (res.ok) {
        modBody.innerHTML = `<div class="paper"><h2 class="panel-title">Prévisions</h2><div class="legacy-html">${await res.text()}</div></div>`;
        return;
      }
    } catch (_) {}
    modBody.innerHTML = `<div class="paper"><p>Prévisions / transits.</p></div>`;
  }

  function showCours() {
    openModule("Cours");
    modBody.innerHTML = `<div class="paper"><h2 class="panel-title">Cours</h2><div id="c">Chargement…</div></div>`;
    fetch("./data/classique-textes.json").then((r)=>r.json()).then((data)=>{
      const keys=Object.keys(data).slice(0,25);
      $("#c").innerHTML=`<div class="section-nav">${keys.map(k=>`<button type="button" data-k="${esc(k)}">${esc(k)}</button>`).join("")}</div><pre class="calc-out" id="ct"></pre>`;
      const show=k=>{$("#ct").textContent=data[k]||"";};
      $("#c").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>show(b.dataset.k)));
      if(keys[0]) show(keys[0]);
    }).catch(()=>{$("#c").textContent="Textes absents.";});
  }

  async function showHoroscope() {
    openModule("Horoscope");
    const data = await loadHoroscope();
    if (!data?.signs) {
      modBody.innerHTML = `<div class="paper"><p>Horoscope introuvable.</p></div>`;
      return;
    }
    const signs = Object.keys(data.signs);
    modBody.innerHTML = `
      <div class="paper">
        <h2 class="panel-title">Horoscope</h2>
        <form class="win-form">
          <label>Signe <select id="hSign">${signs.map(s=>`<option>${esc(s)}</option>`).join("")}</select></label>
          <label>Texte <select id="hFile"></select></label>
        </form>
        <div class="legacy-html" id="hBody" style="margin-top:12px"></div>
      </div>`;
    const sel=$("#hSign"), file=$("#hFile"), body=$("#hBody");
    const fill=()=>{
      const pack=data.signs[sel.value]||{};
      const files=Object.keys(pack);
      file.innerHTML=files.map(f=>`<option value="${esc(f)}">${esc(f)}</option>`).join("");
      body.innerHTML=pack[file.value]||"";
    };
    sel.addEventListener("change", fill);
    file.addEventListener("change", ()=>{ body.innerHTML=(data.signs[sel.value]||{})[file.value]||""; });
    if (signs[0]) { sel.value=signs[0]; fill(); }
  }

  function wire() {
    $("#profileList").addEventListener("change", (e) => {
      state.current = Number(e.target.value) || 0;
    });
    $("#btnAdd").addEventListener("click", () => {
      const nom = prompt("Nom du profil ?", "NOUVEAU");
      if (nom == null) return;
      const prenom = prompt("Prénom ?", "Profil") || "";
      state.profiles.push({ nom: nom.trim() || "NOUVEAU", prenom: prenom.trim() });
      state.current = state.profiles.length - 1;
      saveProfiles(); renderProfiles();
      showTheme();
    });
    $("#btnEdit").addEventListener("click", () => showTheme());
    $("#btnDel").addEventListener("click", () => {
      if (state.profiles.length <= 1) return alert("Il faut au moins un profil.");
      if (!confirm("Supprimer ce profil ?")) return;
      state.profiles.splice(state.current, 1);
      state.current = 0;
      saveProfiles(); renderProfiles();
    });
    $("#btnAstro").addEventListener("click", showAstroHub);
    $("#btnHoro").addEventListener("click", showHoroscope);
    $("#btnQuit").addEventListener("click", () => {
      if (confirm("Quitter Astrologie & Horoscope ?")) {
        try { window.close(); } catch (_) {}
      }
    });
    $("#btnBack").addEventListener("click", closeModule);
    $("#btnPrint").addEventListener("click", () => window.print());
  }

  function init() {
    loadProfiles();
    renderProfiles();
    wire();
    fitStage();
    window.addEventListener("resize", fitStage);
    // hash deep-links
    const hash = (location.hash || "").replace("#", "");
    if (hash === "astro") showAstroHub();
    if (hash === "horoscope") showHoroscope();
  }

  init();
})();
