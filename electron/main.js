const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 544,
    height: 544,
    useContentSize: true,
    resizable: true,
    backgroundColor: "#000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "app", "play.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});
