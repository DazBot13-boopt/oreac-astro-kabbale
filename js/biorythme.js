/* Biorythme kabbalistique — 19 aspects séphirotiques (offsets Excel) */
(function (global) {
  const OFFSETS = (global.BIORYTHME_DATA && global.BIORYTHME_DATA.offsets) ||
    [0, 30, 45, 60, 90, 105, 120, 135, 150, 180, 210, 225, 240, 255, 270, 300, 315, 330, 360];
  const SEPH = (global.BIORYTHME_DATA && global.BIORYTHME_DATA.sephiroth) ||
    ["KETHER","HOCHMAH","BINAH","HESED","GEBURAH","TIPHERETH","NETZAH","HOD","YESOD","MALKUTH","YESOD","HOD","NETZAH","TIPHERETH","GEBURAH","HESED","BINAH","HOCHMAH","KETHER"];
  const ANGE2 = (global.BIORYTHME_DATA && global.BIORYTHME_DATA.ange2) || [];
  const ANGE1 = (global.BIORYTHME_DATA && global.BIORYTHME_DATA.ange1) || [];

  const PLANETES = [
    { id: "a", nom: "Soleil" },
    { id: "b", nom: "Lune" },
    { id: "c", nom: "Mercure" },
    { id: "d", nom: "Vénus" },
    { id: "e", nom: "Mars" },
    { id: "f", nom: "Jupiter" },
    { id: "g", nom: "Saturne" },
    { id: "h", nom: "Uranus" },
    { id: "i", nom: "Neptune" },
    { id: "j", nom: "Pluton" },
    { id: "Asc", nom: "Ascendant" }
  ];

  function norm(long) { return ((long % 360) + 360) % 360; }

  function degToZod(long) {
    long = norm(long);
    const SIGNES = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
    const NOMS = ["Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge", "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"];
    const idx = Math.floor(long / 30);
    const d = long % 30;
    const deg = Math.floor(d);
    const min = Math.floor((d - deg) * 60);
    return { long, signe: SIGNES[idx], signeNom: NOMS[idx], deg, min, idx };
  }

  function sunLong(y, m, d, hh, mm) {
    let A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    let yy = y, mmth = m;
    if (mmth <= 2) { yy -= 1; mmth += 12; }
    let JD = Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mmth + 1)) + d + B - 1524.5 + (hh + mm / 60) / 24;
    let T = (JD - 2451545.0) / 36525;
    let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    let Mr = M * Math.PI / 180;
    let C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) + 0.000289 * Math.sin(3 * Mr);
    let trueL = L0 + C;
    let omega = 125.04 - 1934.136 * T;
    let lambda = trueL - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
    return norm(lambda);
  }

  /** Jour où le Soleil atteint (approx.) le degré absolu cible dans l'année. */
  function dateSoleilAuDegre(annee, cible) {
    cible = norm(cible);
    let prev = sunLong(annee, 1, 1, 12, 0);
    for (let m = 1; m <= 12; m++) {
      let dim = new Date(annee, m, 0).getDate();
      for (let d = 1; d <= dim; d++) {
        if (m === 1 && d === 1) continue;
        let L = sunLong(annee, m, d, 12, 0);
        let crossed = false;
        if (prev <= L) {
          crossed = prev <= cible && cible <= L;
        } else {
          // wrap 360→0
          crossed = prev <= cible || cible <= L;
        }
        if (crossed) {
          return { y: annee, m, d, long: L, label: pad(d) + "/" + pad(m) + "/" + annee };
        }
        prev = L;
      }
    }
    // fallback: jour le plus proche
    let best = null, bestDiff = 999;
    for (let m = 1; m <= 12; m++) {
      let dim = new Date(annee, m, 0).getDate();
      for (let d = 1; d <= dim; d++) {
        let L = sunLong(annee, m, d, 12, 0);
        let dd = Math.abs(L - cible); if (dd > 180) dd = 360 - dd;
        if (dd < bestDiff) { bestDiff = dd; best = { y: annee, m, d, long: L, label: pad(d) + "/" + pad(m) + "/" + annee }; }
      }
    }
    return best;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  /** Ange Solaire 2 : ange1 = régence 5°, ange2 = émotionnel / biorythme (degré exact). */
  function angePourDegre(degAbs) {
    let i = Math.floor(norm(degAbs)) % 360;
    let d0 = Math.floor(i / 5) * 5;
    let d1 = d0 + 4;
    return {
      ange5: (ANGE1[i] || "").trim() || "—",
      angeBiorythme: (ANGE2[i] || "").trim() || "—",
      intervalle5: d0 + "°–" + d1 + "°"
    };
  }

  /** Cycle type ANGE SOLAIRE 1 : 18 niveaux + retour Kether (19). */
  function cyclePlanete(longAbs, annee) {
    let base = Math.floor(norm(longAbs));
    let rows = [];
    OFFSETS.forEach((off, idx) => {
      let cible = norm(base + off);
      if (off === 360) cible = base;
      let z = degToZod(cible);
      let ang = angePourDegre(cible);
      let dt = dateSoleilAuDegre(annee, cible);
      rows.push({
        n: idx + 1,
        offset: off,
        sephira: SEPH[idx],
        cible,
        degLabel: z.deg + "° " + z.signeNom,
        signe: z.signe,
        signeNom: z.signeNom,
        deg: z.deg,
        angeBiorythme: ang.angeBiorythme,
        ange5: ang.ange5,
        intervalle5: ang.intervalle5,
        // alias rétrocompat
        ange: ang.angeBiorythme,
        ange1: ang.ange5,
        date: dt ? dt.label : "—",
        dateObj: dt
      });
    });
    return rows;
  }

  function biorythmeComplet(theme, annee) {
    let out = [];
    PLANETES.forEach(p => {
      let pos = theme && theme[p.id];
      if (!pos || pos.abs == null) return;
      let natalAbs = Math.floor(norm(pos.abs));
      let natalAng = angePourDegre(natalAbs);
      let z = degToZod(pos.abs);
      out.push({
        id: p.id,
        nom: p.nom,
        natal: z,
        natalTxt: pos.deg + "° " + pos.signeNom + " " + String(pos.min).padStart(2, "0") + "′",
        abs: pos.abs,
        natalDegAbs: natalAbs,
        /** Ange dont l’intervalle de 5° couvre le degré natal */
        ange5Natal: natalAng.ange5,
        intervalle5Natal: natalAng.intervalle5,
        /** Ange émotionnel du degré natal (réf. biorythme) */
        angeBioNatal: natalAng.angeBiorythme,
        rows: cyclePlanete(pos.abs, annee)
      });
    });
    return out;
  }

  const STORAGE_KEY = "oreac_biorythme_theme";

  function sauverTheme(payload) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
  }

  function chargerTheme() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  global.BiorythmeKabbale = {
    OFFSETS, SEPH, PLANETES,
    angePourDegre, cyclePlanete, biorythmeComplet, degToZod, sunLong, dateSoleilAuDegre,
    sauverTheme, chargerTheme, STORAGE_KEY
  };
})(window);
