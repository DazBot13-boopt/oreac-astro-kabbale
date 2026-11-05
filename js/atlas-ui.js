/* Recherche villes — atlas StarFisher (ATLAS_WORLD) */
(function (global) {
  let villeChoisie = null;
  let timer = null;

  function fold(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function paysNom(cc) {
    const A = global.ATLAS_WORLD;
    if (!A || !A.cc) return cc || "";
    return A.cc[cc] || cc || "";
  }

  function tzInfo(ti) {
    const A = global.ATLAS_WORLD;
    if (!A || ti < 0 || ti >= A.tz.length) return { id: "UTC", offset: 0 };
    return { id: A.tz[ti], offset: A.off[ti] };
  }

  function placeFromRow(row) {
    const tz = tzInfo(row[4]);
    return {
      name: row[0],
      lat: row[1],
      lon: row[2],
      country: row[3],
      countryName: paysNom(row[3]),
      tzIndex: row[4],
      tzId: tz.id,
      offset: tz.offset,
      pop: row[5] || 0,
      label: row[0] + " (" + paysNom(row[3]) + ")"
    };
  }

  function chercherVilles(q, limit) {
    const A = global.ATLAS_WORLD;
    if (!A || !A.places) return [];
    limit = limit || 25;
    const f = fold(q.trim());
    if (f.length < 2) return [];
    const startsBJ = [], starts = [], includesBJ = [], includes = [];
    for (let i = 0; i < A.places.length; i++) {
      const row = A.places[i];
      const nf = fold(row[0]);
      const bj = row[3] === "BJ";
      if (nf.startsWith(f)) (bj ? startsBJ : starts).push(row);
      else if (nf.includes(f)) (bj ? includesBJ : includes).push(row);
    }
    // Origine app = Bénin : villes BJ d’abord, puis le reste du monde
    const merged = startsBJ.concat(starts, includesBJ, includes).slice(0, limit);
    return merged.map(placeFromRow);
  }

  function trouverExact(nom) {
    const A = global.ATLAS_WORLD;
    if (!A) return null;
    const f = fold(nom);
    let best = null;
    for (let i = 0; i < A.places.length; i++) {
      if (fold(A.places[i][0]) === f) {
        const p = placeFromRow(A.places[i]);
        if (!best || (p.country === "BJ" && best.country !== "BJ") || p.pop > best.pop) best = p;
      }
    }
    return best;
  }

  function setVille(p) {
    villeChoisie = p;
    const inp = document.getElementById("villeSearch");
    const info = document.getElementById("villeInfo");
    const box = document.getElementById("villeSuggest");
    if (inp) inp.value = p ? p.name : "";
    if (box) { box.hidden = true; box.innerHTML = ""; }
    if (info) {
      if (!p) { info.textContent = "Choisissez une ville dans la liste."; return; }
      const signLat = p.lat >= 0 ? "N" : "S";
      const signLon = p.lon >= 0 ? "E" : "W";
      const off = p.offset;
      const offTxt = (off >= 0 ? "+" : "") + off;
      info.innerHTML =
        "<strong>" + p.label + "</strong> · " +
        Math.abs(p.lat).toFixed(2) + "°" + signLat + " " + Math.abs(p.lon).toFixed(2) + "°" + signLon +
        " · fuseau " + p.tzId + " (UTC" + offTxt + " standard)";
    }
  }

  function getVille() { return villeChoisie; }

  function afficherSuggestions(list) {
    const box = document.getElementById("villeSuggest");
    if (!box) return;
    if (!list.length) {
      box.hidden = true;
      box.innerHTML = "<div class='ville-empty'>Aucune ville trouvée</div>";
      box.hidden = false;
      return;
    }
    box.innerHTML = list.map((p, i) =>
      "<button type='button' class='ville-item' data-i='" + i + "'>" +
        "<span class='ville-name'>" + p.name + "</span>" +
        "<span class='ville-meta'>" + p.countryName + " · " + p.lat.toFixed(2) + ", " + p.lon.toFixed(2) + "</span>" +
      "</button>"
    ).join("");
    box._list = list;
    box.hidden = false;
    box.querySelectorAll(".ville-item").forEach(btn => {
      btn.addEventListener("mousedown", function (e) {
        e.preventDefault();
        setVille(list[+btn.getAttribute("data-i")]);
      });
    });
  }

  function initVilleUI(defaultName) {
    const inp = document.getElementById("villeSearch");
    const box = document.getElementById("villeSuggest");
    if (!inp) return;

    const def = trouverExact(defaultName || "Lokossa") || chercherVilles(defaultName || "Lokossa", 1)[0];
    if (def) setVille(def);

    inp.addEventListener("input", function () {
      clearTimeout(timer);
      const q = inp.value;
      timer = setTimeout(function () {
        if (q.trim().length < 2) {
          if (box) { box.hidden = true; box.innerHTML = ""; }
          return;
        }
        afficherSuggestions(chercherVilles(q, 25));
      }, 120);
    });

    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const list = (box && box._list) || chercherVilles(inp.value, 5);
        if (list.length) setVille(list[0]);
      } else if (e.key === "Escape" && box) {
        box.hidden = true;
      }
    });

    inp.addEventListener("blur", function () {
      setTimeout(function () { if (box) box.hidden = true; }, 180);
      // si texte tapé sans clic, tenter match exact
      if (!villeChoisie || fold(villeChoisie.name) !== fold(inp.value)) {
        const ex = trouverExact(inp.value);
        if (ex) setVille(ex);
      }
    });

    inp.addEventListener("focus", function () {
      if (inp.value.trim().length >= 2) afficherSuggestions(chercherVilles(inp.value, 25));
    });
  }

  global.AtlasUI = {
    initVilleUI, getVille, setVille, chercherVilles, trouverExact, paysNom
  };
})(window);
