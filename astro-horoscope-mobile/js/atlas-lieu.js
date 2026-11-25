/** Atlas Delphi Astrofic32 — pays + localités du monde (.vil). */
(function (global) {
  const cache = Object.create(null);
  let paysList = null;

  function fold(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function degMin(abs) {
    const d = Math.floor(abs);
    const m = Math.round((abs - d) * 60);
    if (m === 60) return { deg: d + 1, min: 0 };
    return { deg: d, min: m };
  }

  function toThemeCoords(lat, lon) {
    const la = degMin(Math.abs(lat));
    const lo = degMin(Math.abs(lon));
    return {
      latDeg: la.deg,
      latMin: la.min,
      latNS: lat >= 0 ? "N" : "S",
      lonDeg: lo.deg,
      lonMin: lo.min,
      lonEW: lon >= 0 ? "E" : "O"
    };
  }

  async function loadPays() {
    if (paysList) return paysList;
    const res = await fetch("./data/atlas/pays.json", { cache: "force-cache" });
    if (!res.ok) throw new Error("Atlas pays introuvable");
    const data = await res.json();
    paysList = data.countries || [];
    return paysList;
  }

  async function loadCountry(code) {
    const cc = String(code || "").toUpperCase();
    if (!cc) return [];
    if (cache[cc]) return cache[cc];
    const res = await fetch(`./data/atlas/${cc}.json`, { cache: "force-cache" });
    if (!res.ok) return [];
    const cities = await res.json();
    cache[cc] = Array.isArray(cities) ? cities : [];
    return cache[cc];
  }

  function filterCities(cities, q) {
    const f = fold(q);
    if (!f) return cities.slice(0, 400);
    const starts = [], includes = [];
    for (const c of cities) {
      const nf = fold(c.n);
      if (nf.startsWith(f)) starts.push(c);
      else if (nf.includes(f)) includes.push(c);
    }
    return starts.concat(includes).slice(0, 400);
  }

  async function findCity(name, preferCode) {
    const f = fold(name);
    if (!f) return null;
    const pays = await loadPays();
    const order = [];
    if (preferCode) {
      const pref = preferCode.toUpperCase();
      order.push(...pays.filter((p) => p.code === pref));
      order.push(...pays.filter((p) => p.code !== pref));
    } else {
      // Bénin d’abord (origine app), puis le reste
      order.push(...pays.filter((p) => p.code === "BEN"));
      order.push(...pays.filter((p) => p.code !== "BEN"));
    }
    let best = null;
    for (const p of order) {
      const cities = await loadCountry(p.code);
      for (const c of cities) {
        if (fold(c.n) === f) {
          const hit = { name: c.n, lat: c.lat, lon: c.lon, country: p.code, countryName: p.name };
          if (p.code === "BEN") return hit;
          if (!best) best = hit;
        }
      }
      if (best && preferCode) break;
    }
    return best;
  }

  global.AtlasLieu = {
    loadPays,
    loadCountry,
    filterCities,
    findCity,
    toThemeCoords,
    fold
  };
})(window);
