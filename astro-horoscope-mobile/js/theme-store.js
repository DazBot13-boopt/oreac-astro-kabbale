(function (global) {
  const KEY = "astro_horoscope_theme";
  const SIGNES = [
    "Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge",
    "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"
  ];
  const FOLDERS = [
    "01_Belier", "02_Taureau", "03_Gemeaux", "04_Cancer", "05_Lion", "06_Vierge",
    "07_Balance", "08_Scorpion", "09_Sagittaire", "10_Capricorne", "11_Verseau", "12_Poissons"
  ];
  const PLANETES = {
    a: "Soleil", b: "Lune", c: "Mercure", d: "Vénus", e: "Mars",
    f: "Jupiter", g: "Saturne", h: "Uranus", i: "Neptune", j: "Pluton", Asc: "Ascendant"
  };

  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
    return d;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function requireTheme() {
    const d = load();
    if (!d || !d.theme) {
      alert("Calculez d’abord le thème dans Astrologie.");
      location.href = "astrologie.html";
      return null;
    }
    return d;
  }

  global.AstroTheme = { KEY, SIGNES, FOLDERS, PLANETES, save, load, requireTheme };
})(window);
