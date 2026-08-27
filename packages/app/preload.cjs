const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mcApi", {
  listTemplates: () => ipcRenderer.invoke("listTemplates"),
  recolorTemplate: (templateId, colors, part, partColor) =>
    ipcRenderer.invoke("recolorTemplate", { templateId, colors, part, partColor }),
  importSkin: (dataUrl) => ipcRenderer.invoke("importSkin", { dataUrl }),
  getMetrics: () => ipcRenderer.invoke("getMetrics"),
  export: (dataUrl) => ipcRenderer.invoke("export", { dataUrl }),
  partRegions: (part) => ipcRenderer.invoke("partRegions", { part }),
  paintSkin: (dataUrl, part, x, y, color, size) =>
    ipcRenderer.invoke("paintSkin", { dataUrl, part, x, y, color, size }),
  sidecarStatus: () => ipcRenderer.invoke("sidecarStatus"),
  startSidecar: () => ipcRenderer.invoke("startSidecar"),
  getGateStatus: () => ipcRenderer.invoke("getGateStatus"),
  generateWorld: (opts) => ipcRenderer.invoke("generateWorld", opts),
  openPath: (path) => ipcRenderer.invoke("openPath", { path }),
});
