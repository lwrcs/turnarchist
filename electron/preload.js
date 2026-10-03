const { contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ELECTRON_USERDATA is set by main.js before the window is created so the
// renderer (which has no Node access) can receive the correct path.
const savesDir = path.join(process.env.ELECTRON_USERDATA, "saves");

const ensureSavesDir = () => {
  fs.mkdirSync(savesDir, { recursive: true });
  const info = fs.lstatSync(savesDir);
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error("Invalid saves directory");
  }
};

const savePath = (name) => {
  // The renderer needs only "autosave" today; allow simple future slot names.
  if (typeof name !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(name)) {
    throw new TypeError("Invalid save name");
  }
  ensureSavesDir();
  const file = path.join(savesDir, `${name}.json`);
  try {
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error("Save is a symlink");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return file;
};

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
    const file = savePath(name);
    try {
      return fs.readFileSync(file, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  },

  /**
   * Write a save file.
   * @param {string} name
   * @param {string} json
   */
  write(name, json) {
    const file = savePath(name);
    if (typeof json !== "string") throw new TypeError("Save must be a string");
    const temporary = path.join(savesDir, `.${name}.${crypto.randomBytes(8).toString("hex")}.tmp`);
    let descriptor;
    try {
      descriptor = fs.openSync(temporary, "wx", 0o600);
      fs.writeFileSync(descriptor, json, "utf8");
      fs.fsyncSync(descriptor);
      fs.closeSync(descriptor);
      descriptor = undefined;
      fs.renameSync(temporary, file);
    } finally {
      if (descriptor !== undefined) fs.closeSync(descriptor);
      try { fs.unlinkSync(temporary); } catch (error) {
        if (error.code !== "ENOENT") console.error("[preload] Temporary save cleanup failed:", error);
      }
    }
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
    const file = savePath(name);
    try {
      fs.unlinkSync(file);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  },
});
