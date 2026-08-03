import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    onSecurityViolation: (callback) => {
        const listener = (_event, value) => callback(value);
        ipcRenderer.on('security-violation', listener);
        return () => ipcRenderer.removeListener('security-violation', listener);
    },
});
//# sourceMappingURL=index.js.map