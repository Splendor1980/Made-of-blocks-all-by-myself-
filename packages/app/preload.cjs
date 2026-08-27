const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mcApi", {
  listTemplates: () => ipcRenderer.invoke("listTemplates"),
  recolorTemplate: (templateId, colors, part, partColor) =>
    ipcRenderer.invoke("recolorTemplate", { templateId, colors, part, partColor }),
  importSkin: (dataUrl) => ipcRenderer.invoke("importSkin", { dataUrl }),
  getMetrics: () => ipcRenderer.invoke("getMetrics"),
  export: (dataUrl) => ipcRenderer.invoke("export", { dataUrl }),
  sidecarStatus: () => ipcRenderer.invoke("sidecarStatus"),
  startSidecar: () => ipcRenderer.invoke("startSidecar"),
});
