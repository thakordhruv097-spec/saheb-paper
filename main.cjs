const { app, BrowserWindow } = require('electron');
const path = require('path');

const REMOTE_URL = 'https://thakordhruv097-spec.github.io/saheb-paper/';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: true,
    title: "Saheb Paper Pvt. Ltd. (Beta 1.8)",
    icon: path.join(__dirname, 'build/icon.png'),
  });

  // Try loading live remote cloud build first so any deployed updates appear instantly like mobile
  win.loadURL(REMOTE_URL).catch(() => {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  });

  // Graceful fallback to bundled local build if network is unavailable or disconnected
  win.webContents.on('did-fail-load', (event, errorCode) => {
    if (errorCode !== -3) { // ignore user-aborted navigations
      win.loadFile(path.join(__dirname, 'dist/index.html'));
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
