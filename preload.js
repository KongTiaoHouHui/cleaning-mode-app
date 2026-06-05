const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startCleaning: (duration) => ipcRenderer.send('start-cleaning', duration),
  exitCleaning: () => ipcRenderer.send('exit-cleaning'),
  onSetDuration: (callback) => ipcRenderer.on('set-duration', (_event, value) => callback(value))
});
