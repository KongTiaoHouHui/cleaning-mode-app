const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');

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
