const { app, BrowserWindow, ipcMain } = require("electron"); 

function createWindow() {
  let mainWindow = new BrowserWindow({
    icon: "./src/assets/logo2.ico",
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: true,       
      contextIsolation: false,    
      webviewTag: true,
      webSecurity: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.on("ready-to-show", mainWindow.show);
  mainWindow.maximize();
  mainWindow.loadFile("./src/components/login.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC handler - now ipcMain is properly imported
ipcMain.on('navigate-to', (event, path) => {
    const webContents = event.sender;
    webContents.loadFile(path);
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});