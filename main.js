const { app, BrowserWindow, ipcMain, globalShortcut, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let settingsWindow;
let cleaningWindow;

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 420,
    height: 480,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    resizable: false,
    title: "电脑清洁模式"
  });

  settingsWindow.loadFile('index.html');
}

function createCleaningWindow(duration) {
  if (cleaningWindow) return;

  cleaningWindow = new BrowserWindow({
    fullscreen: true,
    alwaysOnTop: true,
    kiosk: true, // Kiosk mode helps prevent exiting via some system shortcuts
    transparent: false,
    backgroundColor: '#000000',
    frame: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  cleaningWindow.loadFile('cleaning.html');

  // Let the cleaning window know the user-defined duration
  cleaningWindow.webContents.once('did-finish-load', () => {
    cleaningWindow.webContents.send('set-duration', duration);
  });

  cleaningWindow.on('closed', () => {
    cleaningWindow = null;
    // Show settings window again when exiting cleaning mode
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.show();
    }
  });

  // Hide the settings window while in cleaning mode
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.hide();
  }
}

app.whenReady().then(() => {
  createSettingsWindow();

  // --- Auto Updater Logic ---
  autoUpdater.autoDownload = false; // Disable auto download

  // Only check for updates after a short delay so the window is fully loaded
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(err => console.log('Update check failed', err));
  }, 1500);

  autoUpdater.on('update-available', (info) => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('updater-status', {
        status: 'available',
        version: info.version,
        platform: process.platform
      });
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('updater-progress', progressObj.percent);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('updater-status', {
        status: 'downloaded',
        platform: process.platform
      });
    }
  });

  ipcMain.on('start-download-update', () => {
    if (process.platform === 'win32') {
      autoUpdater.downloadUpdate();
    }
  });

  ipcMain.on('quit-and-install-update', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('open-github-releases', () => {
    shell.openExternal('https://github.com/KongTiaoHouHui/cleaning-mode-app/releases/latest');
  });
  // --------------------------

  ipcMain.on('start-cleaning', (event, duration) => {
    createCleaningWindow(duration);
  });

  ipcMain.on('exit-cleaning', () => {
    if (cleaningWindow) {
      cleaningWindow.close();
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createSettingsWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
