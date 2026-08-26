import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("mcApi", {
  getParts: () => ipcRenderer.invoke("getParts"),
  recolor: (part, color) => ipcRenderer.invoke("recolor", { part, color }),
  reset: () => ipcRenderer.invoke("reset"),
  export: (dataUrl) => ipcRenderer.invoke("export", { dataUrl }),
  sidecarStatus: () => ipcRenderer.invoke("sidecarStatus"),
  startSidecar: () => ipcRenderer.invoke("startSidecar"),
});
