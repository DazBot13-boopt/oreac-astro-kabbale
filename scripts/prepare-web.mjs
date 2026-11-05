import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = join(root, "www");
const assets = [
  "index.html",
  "admin.html",
  "biorythme.html",
  "js",
  "vendor",
  "fonts"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const asset of assets) {
  await cp(join(root, asset), join(output, asset), { recursive: true });
}
await mkdir(join(output, "data"), { recursive: true });
await cp(
  join(root, "data", "interpretations.json"),
  join(output, "data", "interpretations.json")
);

// Android's WebView keeps the biorythm page in the same application window.
const indexPath = join(output, "index.html");
const index = await readFile(indexPath, "utf8");
const original = 'window.open("biorythme.html?nom="+nom,"_blank");';
if (!index.includes(original)) {
  throw new Error("Lien vers le biorythme introuvable dans index.html");
}
await writeFile(
  indexPath,
  index.replace(
    original,
    'window.location.href="biorythme.html?nom="+encodeURIComponent(nom);'
  )
);
