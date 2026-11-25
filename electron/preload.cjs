const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("oreacDesktop", {
  savePdf: (data, name) => ipcRenderer.invoke("oreac:save-pdf", { data, name }),
  printPage: () => ipcRenderer.invoke("oreac:print-page"),
  legacyStatus: () => ipcRenderer.invoke("legacy:status"),
  launchLegacy: () => ipcRenderer.invoke("legacy:launch")
});
