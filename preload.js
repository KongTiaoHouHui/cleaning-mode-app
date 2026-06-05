const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startCleaning: (duration) => ipcRenderer.send('start-cleaning', duration),
  exitCleaning: () => ipcRenderer.send('exit-cleaning'),
  onSetDuration: (callback) => ipcRenderer.on('set-duration', (_event, value) => callback(value)),
  
  // Updater APIs
  onUpdaterStatus: (callback) => ipcRenderer.on('updater-status', (_event, value) => callback(value)),
  onUpdaterProgress: (callback) => ipcRenderer.on('updater-progress', (_event, value) => callback(value)),
  startDownloadUpdate: () => ipcRenderer.send('start-download-update'),
  quitAndInstallUpdate: () => ipcRenderer.send('quit-and-install-update'),
  openGithubReleases: () => ipcRenderer.send('open-github-releases')
});
