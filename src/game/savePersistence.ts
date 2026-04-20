import { Game } from "../game";
import { createGameState, loadGameState, GameState } from "./gameState";
import { createSaveV2, loadSaveV2, parseSaveV2Json } from "./save";
import {
  getCookieChunks,
  setCookieChunks,
  deleteCookie,
  getCookie,
} from "../utility/cookies";

const SAVE_PREFIX = "wr_save";
const ELECTRON_SAVE_NAME = "autosave";

// ---------------------------------------------------------------------------
// Electron file-backed save bridge
// ---------------------------------------------------------------------------

interface ElectronSave {
  read(name: string): string | null;
  write(name: string, json: string): void;
  exists(name: string): boolean;
  remove(name: string): void;
}

/**
 * Returns the Electron save bridge if running inside the desktop build,
 * or null in a normal browser context.
 */
const getElectronSave = (): ElectronSave | null => {
  try {
    const es = (window as any).electronSave;
    return es && typeof es.read === "function" ? (es as ElectronSave) : null;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Legacy save shape guard
// ---------------------------------------------------------------------------

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const isLegacyGameState = (v: unknown): v is GameState => {
  if (!isRecord(v)) return false;
  if (!isNumber(v.seed)) return false;
  if (!isNumber(v.randomState)) return false;
  if (!("players" in v)) return false;
  if (!("offlinePlayers" in v)) return false;
  if (!("level" in v)) return false;
  if (!("rooms" in v)) return false;
  return true;
};

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

export const saveToCookies = (game: Game, opts?: { silent?: boolean }) => {
  let v2;
  try {
    v2 = createSaveV2(game);
  } catch (e) {
    console.error("V2 save threw", e);
    if (opts?.silent !== true) game.pushMessage?.("Save failed.");
    return;
  }
  if (v2.ok === false) {
    console.error("V2 save failed", v2.error);
    if (opts?.silent !== true) game.pushMessage?.("Save failed.");
    return;
  }
  const json = JSON.stringify(v2.value);

  const es = getElectronSave();
  if (es) {
    try {
      es.write(ELECTRON_SAVE_NAME, json);
      if (opts?.silent !== true) game.pushMessage?.("Saved.");
    } catch (e) {
      console.error("Electron save write failed", e);
      if (opts?.silent !== true) game.pushMessage?.("Save failed.");
    }
    return;
  }

  setCookieChunks(SAVE_PREFIX, json, 30);
  if (opts?.silent !== true) game.pushMessage?.("Saved.");
};

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export const loadFromCookies = async (game: Game): Promise<boolean> => {
  let json: string | null = null;

  const es = getElectronSave();
  if (es) {
    if (!es.exists(ELECTRON_SAVE_NAME)) {
      game.pushMessage?.("No save found.");
      return false;
    }
    json = es.read(ELECTRON_SAVE_NAME);
    if (!json) {
      game.pushMessage?.("No save found.");
      return false;
    }
  } else {
    json = getCookieChunks(SAVE_PREFIX);
    if (!json) {
      game.pushMessage?.("No save found.");
      return false;
    }
  }

  try {
    // Prefer V2.
    const parsedV2 = parseSaveV2Json(json);
    if (parsedV2.ok) {
      const lr = await loadSaveV2(game, parsedV2.value);
      if (lr.ok === false) {
        console.error("V2 load failed", lr.error);
        game.pushMessage?.("Load failed.");
        try { game.newGame(); } catch {}
        return false;
      }
      game.pushMessage?.("Loaded.");
      return true;
    } else {
      // Legacy fallback (pre-V2 saves).
      const state: unknown = JSON.parse(json);
      if (!isLegacyGameState(state)) {
        console.error("Legacy save failed basic shape check");
        game.pushMessage?.("Load failed.");
        return false;
      }
      const activeUsernames = [game.localPlayerID];
      await loadGameState(game, activeUsernames, state, false);
      game.pushMessage?.("Loaded (legacy save).");
      return true;
    }
  } catch (e) {
    console.error("Load failed", e);
    game.pushMessage?.("Load failed.");
    try { game.newGame(); } catch {}
    return false;
  }
};

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

export const clearCookieSave = () => {
  const es = getElectronSave();
  if (es) {
    es.remove(ELECTRON_SAVE_NAME);
    return;
  }

  try {
    const meta = getCookie(`${SAVE_PREFIX}_meta`);
    const total = meta ? parseInt(meta, 10) : NaN;
    if (Number.isFinite(total) && total > 0) {
      for (let i = 0; i < total; i++) deleteCookie(`${SAVE_PREFIX}_${i}`);
    } else {
      for (let i = 0; i < 32; i++) deleteCookie(`${SAVE_PREFIX}_${i}`);
    }
  } catch {}
  deleteCookie(`${SAVE_PREFIX}_meta`);
};

// ---------------------------------------------------------------------------
// Check
// ---------------------------------------------------------------------------

/**
 * Synchronous check: is there a loadable save present?
 * Used by UI before the menu is shown.
 */
export const hasCookieSave = (): boolean => {
  const es = getElectronSave();
  if (es) {
    try {
      if (!es.exists(ELECTRON_SAVE_NAME)) return false;
      const json = es.read(ELECTRON_SAVE_NAME);
      if (!json) return false;
      const v2 = parseSaveV2Json(json);
      if (v2.ok) return true;
      try {
        const parsed: unknown = JSON.parse(json);
        return isLegacyGameState(parsed);
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  const json = getCookieChunks(SAVE_PREFIX);
  if (!json) return false;
  const v2 = parseSaveV2Json(json);
  if (v2.ok) return true;
  try {
    const parsed: unknown = JSON.parse(json);
    return isLegacyGameState(parsed);
  } catch {
    return false;
  }
};
