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
      // sandbox: false so the preload script can use Node's fs/path for
      // synchronous file-backed saves. The renderer itself still has no Node
      // access (nodeIntegration: false + contextIsolation: true).
      sandbox: false,
      devTools: !app.isPackaged,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "app", "play.html"));
}

app.whenReady().then(() => {
  // Expose userData path to the preload via environment variable.
  // The preload uses this to resolve the saves directory without needing IPC.
  process.env.ELECTRON_USERDATA = app.getPath("userData");
  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});
