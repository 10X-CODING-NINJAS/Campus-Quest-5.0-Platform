import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  onSecurityViolation: (callback: (type: string) => void) => ipcRenderer.on('security-violation', (_event, value) => callback(value)),
});
