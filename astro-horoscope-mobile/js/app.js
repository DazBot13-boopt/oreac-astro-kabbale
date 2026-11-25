/** Lecteur Portrait — même UI / navigation que le viewer desktop remaster. */
const DEFAULT_SECTIONS_URLS = [
  "./data/sections.json",
  "data/sections.json"
];

function $(sel, root = document) {
  return root.querySelector(sel);
}

function setStatus(msg) {
  const el = $("#status");
  if (el) el.textContent = msg || "";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function loadSections() {
  const custom = new URLSearchParams(location.search).get("src");
  const urls = custom ? [custom, ...DEFAULT_SECTIONS_URLS] : DEFAULT_SECTIONS_URLS;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && Array.isArray(data.sections)) return { data, url };
    } catch (_) {}
  }
  return null;
}

function renderNav(sections) {
  const sel = $("#jump");
  const list = $("#navList");
  if (!sel || !list) return;
  sel.innerHTML = '<option value="">Aller à une rubrique…</option>';
  list.innerHTML = "";
  sections.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = String(s.id);
    opt.textContent = s.label;
    sel.appendChild(opt);

    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = s.label;
    btn.dataset.id = String(s.id);
    btn.addEventListener("click", () => goSection(s.id));
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function renderBody(data) {
  const head = $("#docTitle");
  const meta = $("#docMeta");
  const body = $("#docBody");
  head.textContent = data.title || "Portrait astral";
  meta.textContent = `${data.sections.length} rubriques`;
  body.innerHTML = "";
  data.sections.forEach((s) => {
    const card = document.createElement("section");
    card.className = "section-card";
    card.id = `sec-${s.id}`;
    const h = document.createElement("h2");
    h.textContent = s.label;
    card.appendChild(h);
    const content = document.createElement("div");
    if (s.html && s.html.length < 200000) {
      content.innerHTML = s.html
        .replace(/background="[^"]*"/gi, "")
        .replace(/<a name="[^"]*"[^>]*>\s*<\/a>/gi, "");
    } else {
      content.innerHTML = `<pre style="white-space:pre-wrap;font:inherit">${escapeHtml(
        s.text || ""
      )}</pre>`;
    }
    card.appendChild(content);
    body.appendChild(card);
  });
}

let currentId = 0;
let sectionsRef = [];

function goSection(id) {
  currentId = Number(id);
  const el = document.getElementById(`sec-${id}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelectorAll(".nav-list button").forEach((b) => {
    b.classList.toggle("active", b.dataset.id === String(id));
  });
  const sel = $("#jump");
  if (sel) sel.value = String(id);
}

function wireNav() {
  $("#jump")?.addEventListener("change", (e) => {
    if (e.target.value !== "") goSection(e.target.value);
  });
  $("#btnPrev")?.addEventListener("click", () => {
    const ids = sectionsRef.map((s) => s.id);
    const i = ids.indexOf(currentId);
    if (i > 0) goSection(ids[i - 1]);
  });
  $("#btnNext")?.addEventListener("click", () => {
    const ids = sectionsRef.map((s) => s.id);
    const i = ids.indexOf(currentId);
    if (i >= 0 && i < ids.length - 1) goSection(ids[i + 1]);
  });
  $("#btnPrint")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.print();
  });
}

async function main() {
  setStatus("Chargement du portrait…");
  const loaded = await loadSections();
  if (!loaded) {
    setStatus("Portrait introuvable");
    $("#docBody").innerHTML =
      '<div class="empty">Aucun portrait exporté. Sur Windows, calculez le thème puis réexportez sections.json.</div>';
    return;
  }
  sectionsRef = loaded.data.sections;
  renderNav(sectionsRef);
  renderBody(loaded.data);
  wireNav();
  if (sectionsRef.length) goSection(sectionsRef[0].id);
  setStatus("Portrait astral");
}

main();
