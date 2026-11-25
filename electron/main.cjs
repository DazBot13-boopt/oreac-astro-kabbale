const { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } = require("electron");
const { writeFile } = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { launchLegacy, legacyStatus } = require("./legacy.cjs");

const appRoot = path.resolve(__dirname, "..");
const origin = "app://oreac";
const allowedPages = new Set([
  "index.html",
  "admin.html",
  "biorythme.html",
  "favicon.png",
  "classique/index.html",
  "classique/horoscope.html",
  "classique/portrait.html",
  "classique/textes.html"
]);
const allowedAssetDirs = new Set(["js", "vendor", "fonts", "data", "classique"]);

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: { standard: true, secure: true, supportFetchAPI: true }
  }
]);

function isAppUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "app:" && url.host === "oreac";
  } catch {
    return false;
  }
}

function openExternal(value) {
  try {
    const url = new URL(value);
    if (["https:", "mailto:"].includes(url.protocol)) {
      void shell.openExternal(value);
    }
  } catch {
    // Ignore malformed links from the page.
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "OREAC Astro Kabbale",
    backgroundColor: "#f3efe6",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url) && new URL(url).pathname === "/biorythme.html") {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 1000,
          height: 850,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, "preload.cjs")
          }
        }
      };
    }
    openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (!isAppUrl(url)) {
      event.preventDefault();
      openExternal(url);
    }
  });

  void window.loadURL(`${origin}/index.html`);
}

function isTrustedSender(sender) {
  return isAppUrl(sender.getURL());
}

ipcMain.handle("oreac:save-pdf", async (event, { data, name }) => {
  if (!isTrustedSender(event.sender) || typeof data !== "string") {
    throw new Error("Requête PDF refusée");
  }
  const pdf = Buffer.from(data, "base64");
  if (pdf.length < 8 || pdf.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error("Le PDF généré est invalide");
  }
  const safeName = typeof name === "string"
    ? name.replace(/[<>:"/\\|?*]/g, "_").slice(0, 160)
    : "OREAC_Astro_Kabbale.pdf";
  const parent = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(parent, {
    defaultPath: safeName.endsWith(".pdf") ? safeName : safeName + ".pdf",
    filters: [{ name: "PDF", extensions: ["pdf"] }]
  });
  if (canceled || !filePath) return { canceled: true };
  await writeFile(filePath, pdf);
  await shell.openPath(filePath);
  return { canceled: false };
});

ipcMain.handle("oreac:print-page", (event) => {
  if (!isTrustedSender(event.sender)) throw new Error("Impression refusée");
  return new Promise((resolve, reject) => {
    event.sender.print({ silent: false, printBackground: true }, (success, reason) => {
      if (success || reason === "Print job canceled") resolve();
      else reject(new Error(reason || "Impression impossible"));
    });
  });
});

app.whenReady().then(() => {
  ipcMain.handle("legacy:status", () => legacyStatus());
  ipcMain.handle("legacy:launch", () => launchLegacy());

  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    if (url.host !== "oreac") {
      return new Response("Not found", { status: 404 });
    }

    let relative;
    try {
      relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    } catch {
      return new Response("Bad path", { status: 400 });
    }
    const parts = relative.split(/[\\/]/);
    const normalized = relative.replace(/\\/g, "/");
    if (
      !relative ||
      !(
        allowedPages.has(normalized) ||
        (parts.length > 1 && allowedAssetDirs.has(parts[0]))
      )
    ) {
      return new Response("Not found", { status: 404 });
    }

    const filePath = path.resolve(appRoot, relative);
    const withinRoot = path.relative(appRoot, filePath);
    if (!withinRoot || withinRoot.startsWith("..") || path.isAbsolute(withinRoot)) {
      return new Response("Bad path", { status: 400 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
