const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let win;

function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      webSecurity: false,
      contextIsolation: true,
      preload: path.join(__dirname, "./preload.js"),
    },
  });
  win.setMenu(null);
  win.webContents.setUserAgent(
    "Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.5) AppleWebKit/537.36 (KHTML, like Gecko) 69.0.3497.106/5.5 TV Safari/537.36"
  );
  win.loadFile(path.join(__dirname, "../app/dist/index.html"));
  win.on("closed", () => {
    win = null;
  });
}

ipcMain.on("exitApp", () => app.quit());
app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (app.isReady() && !win) {
    createWindow();
  }
});
