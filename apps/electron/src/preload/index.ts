import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  onSecurityViolation: (callback: (type: string) => void) => {
    const handler = (_event: any, value: string) => callback(value);
    ipcRenderer.on('security-violation', handler);
    return () => ipcRenderer.removeListener('security-violation', handler);
  },
});
