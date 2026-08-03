import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  onSecurityViolation: (callback: (type: string) => void) => {
    const listener = (_event: any, value: string) => callback(value);
    ipcRenderer.on('security-violation', listener);
    return () => ipcRenderer.removeListener('security-violation', listener);
  },
});
