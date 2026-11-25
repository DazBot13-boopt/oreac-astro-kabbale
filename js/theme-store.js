/**
 * Dossier thème unique — une saisie alimente OREAC + classique + biorythme.
 */
(function (global) {
  const KEY = "oreac_theme";
  const BIO_KEY = "oreac_biorythme_theme";

  const SIGNES_NOM = [
    "Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge",
    "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"
  ];
  const SIGN_FOLDERS = [
    "01_Belier", "02_Taureau", "03_Gemeaux", "04_Cancer", "05_Lion", "06_Vierge",
    "07_Balance", "08_Scorpion", "09_Sagittaire", "10_Capricorne", "11_Verseau", "12_Poissons"
  ];
  const PLANETE_LABELS = {
    a: "Soleil", b: "Lune", c: "Mercure", d: "Vénus", e: "Mars",
    f: "Jupiter", g: "Saturne", h: "Uranus", i: "Neptune", j: "Pluton", Asc: "Ascendant"
  };

  function signeIndexFromLong(long) {
    const n = ((Number(long) % 360) + 360) % 360;
    return Math.floor(n / 30) % 12;
  }

  function save(payload) {
    if (!payload || typeof payload !== "object") return null;
    const theme = payload.theme || {};
    const sun = theme.a || null;
    const signeIdx = sun && typeof sun.abs === "number"
      ? signeIndexFromLong(sun.abs)
      : (typeof payload.signeIdx === "number" ? payload.signeIdx : null);
    const dossier = {
      ...payload,
      savedAt: new Date().toISOString(),
      signeIdx,
      signeNom: signeIdx == null ? null : SIGNES_NOM[signeIdx],
      signeFolder: signeIdx == null ? null : SIGN_FOLDERS[signeIdx]
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(dossier));
    } catch (e) { /* ignore quota */ }
    // Compat biorythme existant
    try {
      localStorage.setItem(BIO_KEY, JSON.stringify({
        nom: dossier.nom,
        ville: dossier.ville,
        villeLabel: dossier.villeLabel,
        lat: dossier.lat,
        lon: dossier.lon,
        tzId: dossier.tzId,
        annee: dossier.annee,
        mois: dossier.mois,
        jour: dossier.jour,
        heureStr: dossier.heureStr,
        theme: dossier.theme,
        anneeBio: dossier.anneeBio || new Date().getFullYear()
      }));
    } catch (e) { /* ignore */ }
    return dossier;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    // Repli biorythme si ancien flux
    try {
      const raw = localStorage.getItem(BIO_KEY);
      if (!raw) return null;
      const bio = JSON.parse(raw);
      return save(bio);
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  function requireOrAlert(msg) {
    const d = load();
    if (!d || !d.theme || !Object.keys(d.theme).length) {
      alert(msg || "Calculez d’abord le thème natal sur l’écran principal (une seule saisie).");
      return null;
    }
    return d;
  }

  global.OreacTheme = {
    KEY, SIGNES_NOM, SIGN_FOLDERS, PLANETE_LABELS,
    save, load, clear, requireOrAlert, signeIndexFromLong
  };
})(window);
