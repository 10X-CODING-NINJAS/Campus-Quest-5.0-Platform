"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => electron.ipcRenderer.send("window-minimize"),
  maximize: () => electron.ipcRenderer.send("window-maximize"),
  close: () => electron.ipcRenderer.send("window-close"),
  onSecurityViolation: (callback) => {
    const handler = (_event, value) => callback(value);
    electron.ipcRenderer.on("security-violation", handler);
    return () => electron.ipcRenderer.removeListener("security-violation", handler);
  }
});
