import { cp, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = join(root, "www");
const assets = [
  "index.html",
  "portrait.html",
  "horoscope.html",
  "favicon.png",
  "icon.png",
  "css",
  "js",
  "data"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const asset of assets) {
  await cp(join(root, asset), join(output, asset), { recursive: true });
}
console.log("www prêt (interface desktop remaster)");
