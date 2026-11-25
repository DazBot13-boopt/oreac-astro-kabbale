/** Lecteur Horoscope — mêmes textes Res_Txt que le desktop (pack JSON embarqué). */
const SIGNS = [
  { id: "01_Belier", label: "Bélier" },
  { id: "02_Taureau", label: "Taureau" },
  { id: "03_Gemeaux", label: "Gémeaux" },
  { id: "04_Cancer", label: "Cancer" },
  { id: "05_Lion", label: "Lion" },
  { id: "06_Vierge", label: "Vierge" },
  { id: "07_Balance", label: "Balance" },
  { id: "08_Scorpion", label: "Scorpion" },
  { id: "09_Sagittaire", label: "Sagittaire" },
  { id: "10_Capricorne", label: "Capricorne" },
  { id: "11_Verseau", label: "Verseau" },
  { id: "12_Poissons", label: "Poissons" }
];

const FILE_ORDER = ["HoroscopeJour", "TendanceMois", "Signe", "dernier"];
const FILE_LABEL = {
  HoroscopeJour: "HoroscopeJour.htm",
  TendanceMois: "TendanceMois.htm",
  Signe: "Signe.htm",
  dernier: "dernier.htm"
};

function $(s) {
  return document.querySelector(s);
}

function escapeHtml(t) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

let pack = null;

async function loadPack() {
  const res = await fetch("data/classique-horoscope.json", { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

function wire() {
  const signSel = $("#sign");
  SIGNS.forEach((s) => {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = s.label;
    signSel.appendChild(o);
  });
  signSel.addEventListener("change", () => loadSign(signSel.value));
  $("#file").addEventListener("change", () => showFile());
  const btnPrint = $("#btnPrint");
  if (btnPrint) {
    btnPrint.addEventListener("click", (e) => {
      e.preventDefault();
      window.print();
    });
  }
  loadSign(SIGNS[0].id);
}

function loadSign(signId) {
  const label = SIGNS.find((s) => s.id === signId)?.label || signId;
  $("#docTitle").textContent = label;
  $("#file").innerHTML = "";
  $("#docBody").innerHTML = '<div class="empty">Chargement…</div>';
  const entry = pack && pack.signs && pack.signs[signId];
  if (!entry || !entry.texts) {
    $("#docBody").innerHTML = '<div class="empty">Aucun texte pour ce signe.</div>';
    return;
  }
  const keys = FILE_ORDER.filter((k) => entry.texts[k]);
  keys.forEach((k) => {
    const o = document.createElement("option");
    o.value = k;
    o.textContent = FILE_LABEL[k] || k;
    $("#file").appendChild(o);
  });
  if (keys.length) {
    $("#file").value = keys[0];
    showFile();
  }
}

function showFile() {
  const signId = $("#sign").value;
  const key = $("#file").value;
  const text = pack.signs[signId].texts[key] || "";
  $("#docMeta").textContent = (FILE_LABEL[key] || key) + " · " + signId + "/Res_Txt";
  $("#docBody").innerHTML =
    '<pre style="white-space:pre-wrap;font:inherit;margin:0">' + escapeHtml(text) + "</pre>";
}

loadPack()
  .then((data) => {
    pack = data;
    wire();
  })
  .catch((err) => {
    $("#docBody").innerHTML =
      '<div class="empty">Impossible de charger le corpus Horoscope.<br>' +
      escapeHtml(String(err)) +
      "</div>";
  });
