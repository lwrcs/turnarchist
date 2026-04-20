const { contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");

// ELECTRON_USERDATA is set by main.js before the window is created so the
// renderer (which has no Node access) can receive the correct path.
const savesDir = path.join(process.env.ELECTRON_USERDATA, "saves");

try {
  if (!fs.existsSync(savesDir)) fs.mkdirSync(savesDir, { recursive: true });
} catch (e) {
  console.error("[preload] Could not create saves directory:", e);
}

const savePath = (name) => path.join(savesDir, `${name}.json`);

// Expose a synchronous file-backed save API to the renderer.
// The renderer cannot access Node directly (nodeIntegration: false,
// contextIsolation: true), so everything goes through this bridge.
contextBridge.exposeInMainWorld("electronSave", {
  /**
   * Read a save file. Returns the JSON string, or null if not found.
   * @param {string} name
   * @returns {string | null}
   */
  read(name) {
    try {
      return fs.readFileSync(savePath(name), "utf8");
    } catch {
      return null;
    }
  },

  /**
   * Write a save file.
   * @param {string} name
   * @param {string} json
   */
  write(name, json) {
    fs.writeFileSync(savePath(name), json, "utf8");
  },

  /**
   * Check whether a save file exists.
   * @param {string} name
   * @returns {boolean}
   */
  exists(name) {
    return fs.existsSync(savePath(name));
  },

  /**
   * Delete a save file. Silently ignores missing files.
   * @param {string} name
   */
  remove(name) {
    try {
      fs.unlinkSync(savePath(name));
    } catch {}
  },
});
