const fs = require("node:fs");
const path = require("node:path");
const { app, shell } = require("electron");

const EXE_NAME = "Astrologie & Horoscope.exe";

function candidatePaths() {
  const roots = [];
  if (app.isPackaged) {
    roots.push(path.join(process.resourcesPath, "legacy"));
    roots.push(path.join(path.dirname(process.execPath), "legacy"));
  } else {
    roots.push(path.join(app.getAppPath(), "legacy"));
    roots.push(path.resolve(__dirname, "..", "legacy"));
  }
  if (process.env.OREAC_LEGACY_DIR) {
    roots.unshift(process.env.OREAC_LEGACY_DIR);
  }
  return roots.map((dir) => path.join(dir, EXE_NAME));
}

function findLegacyExe() {
  for (const candidate of candidatePaths()) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // continue
    }
  }
  return null;
}

async function launchLegacy() {
  const exe = findLegacyExe();
  if (!exe) {
    return {
      ok: false,
      error:
        "Exécutable introuvable. Placez « Astrologie & Horoscope.exe » dans le dossier legacy/ (ou OREAC_LEGACY_DIR)."
    };
  }
  const err = await shell.openPath(exe);
  if (err) {
    return { ok: false, error: err, path: exe };
  }
  return { ok: true, path: exe };
}

function legacyStatus() {
  const exe = findLegacyExe();
  return { found: Boolean(exe), path: exe };
}

module.exports = { findLegacyExe, launchLegacy, legacyStatus };
