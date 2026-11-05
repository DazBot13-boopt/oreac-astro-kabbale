const { app, BrowserWindow, net, protocol, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const appRoot = path.resolve(__dirname, "..");
const origin = "app://oreac";
const allowedPages = new Set(["index.html", "admin.html", "biorythme.html"]);
const allowedAssetDirs = new Set(["js", "vendor", "fonts", "data"]);

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
      sandbox: true
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
            sandbox: true
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

app.whenReady().then(() => {
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
    if (
      !relative ||
      !(
        (parts.length === 1 && allowedPages.has(parts[0])) ||
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
