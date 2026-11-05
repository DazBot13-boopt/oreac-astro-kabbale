/** Bibliothèque d'interprétations — embarquée dans l'app (hors ligne) */
(function (root) {
  const SEPH_LIST = ["KETHER","HOCHMAH","BINAH","HESED","GEBURAH","TIPHERETH","NETZAH","HOD","YESOD","MALKUTH"];
  const PLAN_LIST = ["a","b","c","d","e","f","g","h","i","j","Asc"];

  function emptyLib() {
    const sephira = {};
    SEPH_LIST.forEach((n) => { sephira[n] = { sens: "", debloq: "" }; });
    const planete = {};
    PLAN_LIST.forEach((id) => { planete[id] = ""; });
    return {
      version: 1,
      updatedAt: null,
      evo: "",
      inv: "",
      bloqueIntro: "",
      fluxOk: "",
      sephira,
      planete,
      planeteSeph: {},
      sentier: {},
      planeteSigne: {},
      sabian: {}
    };
  }

  function normalize(data) {
    const base = emptyLib();
    if (!data || typeof data !== "object") return base;
    return {
      version: data.version || 1,
      updatedAt: data.updatedAt || null,
      evo: data.evo || "",
      inv: data.inv || "",
      bloqueIntro: data.bloqueIntro || "",
      fluxOk: data.fluxOk || "",
      sephira: Object.assign(base.sephira, data.sephira || {}),
      planete: Object.assign(base.planete, data.planete || {}),
      planeteSeph: data.planeteSeph || {},
      sentier: data.sentier || {},
      planeteSigne: data.planeteSigne || {},
      sabian: data.sabian || {}
    };
  }

  function tpl(str, vars) {
    if (!str) return "";
    return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ""));
  }

  function hasText(s) {
    return !!(s && String(s).trim());
  }

  /** Toujours depuis les données embarquées (GRIFFON_INTERP) */
  function loadLibrary() {
    const embedded = root.GRIFFON_INTERP;
    if (embedded) {
      return Promise.resolve({ lib: normalize(embedded), source: "embarque" });
    }
    return Promise.resolve({ lib: emptyLib(), source: "vide" });
  }

  root.InterpStore = {
    SEPH_LIST,
    PLAN_LIST,
    emptyLib,
    normalize,
    tpl,
    hasText,
    loadLibrary
  };
})(typeof window !== "undefined" ? window : globalThis);
