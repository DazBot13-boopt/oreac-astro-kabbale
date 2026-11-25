/** Clone Wine : Choix 640×480 → ASTROLOGIE 800×600 → modules. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const fitChoix = $("#fitChoix");
  const fitAstro = $("#fitAstro");
  const stageChoix = $("#stageChoix");
  const stageAstro = $("#stageAstro");
  const moduleEl = $("#module");
  const modBody = $("#modBody");
  const modTitle = $("#modTitle");

  const KEY = "ah-profiles-v1";
  const state = {
    screen: "choix", // choix | astro | module
    profiles: [],
    current: 0,
    theme: {
      nom: "TOGBEDJI", prenom: "Daziano",
      day: 13, month: 6, year: 2007, hour: 8, minute: 58,
      city: "Cotonou", country: "BEN", countryName: "Bénin",
      latDeg: 6, latMin: 21, latNS: "N",
      lonDeg: 2, lonMin: 25, lonEW: "E", tz: 1
    },
    portrait: null,
    horoscope: null,
    sectionId: 0
  };

  function fitStage() {
    const pad = 8;
    const apply = (fit, stage, bw, bh) => {
      if (!fit || fit.classList.contains("hidden")) return;
      const ww = fit.clientWidth - pad;
      const wh = fit.clientHeight - pad;
      const scale = Math.min(ww / bw, wh / bh);
      stage.style.transform = `scale(${scale})`;
    };
    apply(fitChoix, stageChoix, 640, 480);
    apply(fitAstro, stageAstro, 800, 600);
  }

  function showChoix() {
    state.screen = "choix";
    moduleEl.classList.add("hidden");
    fitAstro.classList.add("hidden");
    fitChoix.classList.remove("hidden");
    fitStage();
  }

  function showAstroScreen() {
    state.screen = "astro";
    moduleEl.classList.add("hidden");
    fitChoix.classList.add("hidden");
    fitAstro.classList.remove("hidden");
    fitStage();
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
    state.screen = "module";
    fitChoix.classList.add("hidden");
    fitAstro.classList.add("hidden");
    moduleEl.classList.remove("hidden");
    modTitle.textContent = title;
  }

  function closeModule() {
    showAstroScreen();
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

  function applyLieuToTheme(lieu) {
    if (!lieu) return;
    const coords = window.AtlasLieu.toThemeCoords(lieu.lat, lieu.lon);
    Object.assign(state.theme, {
      city: lieu.name,
      country: lieu.country,
      countryName: lieu.countryName || "",
      ...coords
    });
  }

  async function showAtlasLieu(onPick) {
    openModule("Choix d'un lieu");
    modBody.innerHTML = `<div class="atlas-dlg"><h2>Choix d'un lieu</h2><p style="text-align:center">Chargement de l’atlas…</p></div>`;
    let pays;
    try {
      pays = await window.AtlasLieu.loadPays();
    } catch (e) {
      modBody.innerHTML = `<div class="atlas-dlg"><p>Atlas introuvable (${esc(e.message)}).</p>
        <div class="atlas-actions"><button type="button" id="atlasCancel">Annuler</button></div></div>`;
      $("#atlasCancel")?.addEventListener("click", () => showTheme());
      return;
    }
    const prefer = (state.theme.country || "BEN").toUpperCase();
    const opts = pays.map((p) =>
      `<option value="${esc(p.code)}" ${p.code === prefer ? "selected" : ""}>${esc(p.name)} (${p.n})</option>`
    ).join("");
    modBody.innerHTML = `
      <div class="atlas-dlg">
        <h2>Choix d'un lieu</h2>
        <p style="text-align:center;font:12px system-ui;margin:0 0 10px;color:#5a3018">
          Atlas mondial Delphi (Astrofic32) — ${pays.length} pays / territoires
        </p>
        <div class="atlas-grid">
          <div class="atlas-col">
            <label>Pays</label>
            <input type="search" id="paysFilter" placeholder="Filtrer un pays…" autocomplete="off">
            <select id="paysList" size="10">${opts}</select>
          </div>
          <div class="atlas-col">
            <label>Ville / localité</label>
            <input type="search" id="villeFilter" placeholder="Filtrer une ville…" autocomplete="off">
            <select id="villeList" size="10"></select>
          </div>
        </div>
        <p class="atlas-meta" id="atlasMeta">Sélectionnez un pays puis une ville.</p>
        <div class="atlas-actions">
          <button type="button" class="primary" id="atlasOk">OK</button>
          <button type="button" id="atlasCancel">Annuler</button>
        </div>
      </div>`;

    const paysList = $("#paysList");
    const villeList = $("#villeList");
    const atlasMeta = $("#atlasMeta");
    let cities = [];
    let selected = null;

    function renderVilles(q) {
      const list = window.AtlasLieu.filterCities(cities, q || "");
      villeList.innerHTML = list.map((c, i) =>
        `<option value="${i}" data-name="${esc(c.n)}">${esc(c.n)}</option>`
      ).join("");
      villeList._list = list;
      selected = null;
      atlasMeta.textContent = list.length
        ? `${list.length} localité(s) — choisissez puis OK`
        : "Aucune localité";
    }

    async function loadSelectedPays() {
      const code = paysList.value;
      const info = pays.find((p) => p.code === code);
      atlasMeta.textContent = `Chargement ${info ? info.name : code}…`;
      cities = await window.AtlasLieu.loadCountry(code);
      renderVilles($("#villeFilter").value);
      // pré-sélection si le thème a déjà cette ville
      const want = window.AtlasLieu.fold(state.theme.city);
      if (want) {
        const list = villeList._list || [];
        const idx = list.findIndex((c) => window.AtlasLieu.fold(c.n) === want);
        if (idx >= 0) {
          villeList.selectedIndex = idx;
          selected = list[idx];
          updateMeta();
        }
      }
    }

    function updateMeta() {
      const info = pays.find((p) => p.code === paysList.value);
      if (!selected) {
        atlasMeta.textContent = info ? `${info.name} — ${cities.length} localités` : "";
        return;
      }
      const signLat = selected.lat >= 0 ? "N" : "S";
      const signLon = selected.lon >= 0 ? "E" : "O";
      atlasMeta.innerHTML =
        `<strong>${esc(selected.n)}</strong> (${esc(info ? info.name : paysList.value)}) · ` +
        `${Math.abs(selected.lat).toFixed(4)}°${signLat} ${Math.abs(selected.lon).toFixed(4)}°${signLon}`;
    }

    function filterPays() {
      const f = window.AtlasLieu.fold($("#paysFilter").value);
      [...paysList.options].forEach((opt) => {
        opt.hidden = f && !window.AtlasLieu.fold(opt.textContent).includes(f);
      });
    }

    paysList.addEventListener("change", loadSelectedPays);
    $("#paysFilter").addEventListener("input", filterPays);
    $("#villeFilter").addEventListener("input", () => renderVilles($("#villeFilter").value));
    villeList.addEventListener("change", () => {
      const list = villeList._list || [];
      selected = list[villeList.selectedIndex] || null;
      updateMeta();
    });
    villeList.addEventListener("dblclick", () => $("#atlasOk").click());
    $("#atlasCancel").addEventListener("click", () => showTheme());
    $("#atlasOk").addEventListener("click", () => {
      if (!selected) {
        alert("Choisissez une ville / localité.");
        return;
      }
      const info = pays.find((p) => p.code === paysList.value);
      const lieu = {
        name: selected.n,
        lat: selected.lat,
        lon: selected.lon,
        country: paysList.value,
        countryName: info ? info.name : paysList.value
      };
      applyLieuToTheme(lieu);
      if (typeof onPick === "function") onPick(lieu);
      showTheme();
    });

    await loadSelectedPays();
  }

  function showTheme() {
    openModule("Thème natal / Accueil");
    const t = state.theme;
    const p = selectedProfile();
    if (p.nom) t.nom = p.nom;
    if (p.prenom) t.prenom = p.prenom;
    const lieuLabel = t.countryName ? `${t.city} (${t.countryName})` : t.city;
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
          <label>Lieu / localité
            <div class="lieu-row">
              <input name="city" id="cityInput" value="${esc(t.city)}" readonly>
              <button type="button" id="btnAtlas">Atlas des villes</button>
            </div>
          </label>
          <p class="atlas-meta" id="lieuInfo" style="margin:0">${esc(lieuLabel || "—")}</p>
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
    $("#btnAtlas").addEventListener("click", () => showAtlasLieu());
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
    $("#btnLydie")?.addEventListener("click", async () => {
      Object.assign(state.theme, {
        nom: "HOUNSA", prenom: "Lydie", day: 24, month: 11, year: 2005,
        hour: 8, minute: 58, city: "Cotonou", tz: 1
      });
      try {
        const hit = await window.AtlasLieu.findCity("Cotonou", "BEN");
        if (hit) applyLieuToTheme(hit);
        else Object.assign(state.theme, { latDeg: 6, latMin: 21, latNS: "N", lonDeg: 2, lonMin: 25, lonEW: "E", country: "BEN", countryName: "Bénin" });
      } catch (_) {
        Object.assign(state.theme, { latDeg: 6, latMin: 21, latNS: "N", lonDeg: 2, lonMin: 25, lonEW: "E" });
      }
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

  function showGraphiques() {
    openModule("Graphiques");
    const chart = window.DelphiCalc.computeNatalExact(birthFromTheme());
    modBody.innerHTML = `<div class="paper"><h2 class="panel-title">Graphiques / Transits</h2><canvas id="skyCanvas" width="560" height="360"></canvas><pre class="calc-out" id="gOut"></pre></div>`;
    const canvas = $("#skyCanvas");
    const ctx = canvas.getContext("2d");
    const names = ["SOLEIL","LUNE","MERCURE","VENUS","MARS","JUPITER","SATURNE"];
    const W = canvas.width, H = canvas.height, pad = 40;
    ctx.fillStyle = "#fffef8"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = "#333"; ctx.beginPath(); ctx.moveTo(pad, H-pad); ctx.lineTo(W-pad, H-pad); ctx.stroke();
    names.forEach((n, i) => {
      const lon = chart.bodies[n] || 0;
      const x = pad + (i + 0.5) * ((W - 2*pad) / names.length);
      const y = H - pad - (lon / 360) * (H - 2*pad);
      ctx.fillStyle = "#7a1f1f";
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#222"; ctx.font = "11px system-ui";
      ctx.fillText(n.slice(0,3), x-10, H-pad+14);
    });
    $("#gOut").textContent = window.DelphiCalc.formatCalculDuCiel(chart);
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

  function showAide() {
    openModule("Aide");
    modBody.innerHTML = `<div class="paper"><h2 class="panel-title">Aide</h2>
      <p>Logiciel Astrologie — clone de l’interface Wine.</p>
      <ul>
        <li><b>ACCUEIL</b> : coordonnées natales / thème</li>
        <li><b>PORTRAIT</b> : portrait astral</li>
        <li><b>CARTES</b> : carte du ciel</li>
        <li><b>CALCULS</b> : positions et aspects</li>
        <li><b>COURS</b> : textes d’apprentissage</li>
      </ul>
      <p>Domification <b>PLACIDE</b> — orbes ORBE.DAT.</p>
    </div>`;
  }

  function showReglages() {
    openModule("Réglages");
    modBody.innerHTML = `<div class="paper"><h2 class="panel-title">Réglages</h2>
      <p>Domification <b>PLACIDE</b></p>
      <p>Orbes : fichier ORBE.DAT (référence Delphi).</p>
      <p>Fuseau du thème courant : UT+${esc(state.theme.tz)}</p>
    </div>`;
  }

  function showCouples() {
    openModule("Astro couples");
    modBody.innerHTML = `<div class="paper"><h2 class="panel-title">Astro couples</h2>
      <p>Synastrie — saisis d’abord un thème (ACCUEIL).</p>
      <div class="win-actions"><button type="button" id="goT">Thème</button></div>
    </div>`;
    $("#goT")?.addEventListener("click", showTheme);
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
    $("#btnAstro").addEventListener("click", showAstroScreen);
    $("#btnHoro").addEventListener("click", showHoroscope);
    $("#btnQuit").addEventListener("click", () => {
      if (confirm("Quitter Astrologie & Horoscope ?")) {
        try { window.close(); } catch (_) {}
      }
    });

    $("#aCours").addEventListener("click", showCours);
    $("#aAide").addEventListener("click", showAide);
    $("#aAccueil").addEventListener("click", showTheme);
    $("#aPortrait").addEventListener("click", showPortrait);
    $("#aPrevisions").addEventListener("click", showPrevisions);
    $("#aCartes").addEventListener("click", showCartes);
    $("#aGraphiques").addEventListener("click", showGraphiques);
    $("#aCalculs").addEventListener("click", showCalculs);
    $("#aReglages").addEventListener("click", showReglages);
    $("#aCouples").addEventListener("click", showCouples);
    $("#aQuitter").addEventListener("click", showChoix);

    $("#btnBack").addEventListener("click", () => {
      if (state.screen === "module") closeModule();
      else showChoix();
    });
    $("#btnPrint").addEventListener("click", () => window.print());
  }

  function init() {
    loadProfiles();
    renderProfiles();
    wire();
    showChoix();
    window.addEventListener("resize", fitStage);
    const hash = (location.hash || "").replace("#", "");
    if (hash === "astro") showAstroScreen();
    if (hash === "horoscope") showHoroscope();
  }

  init();
})();
