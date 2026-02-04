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

export const saveToCookies = (game: Game) => {
  let v2;
  try {
    v2 = createSaveV2(game);
  } catch (e) {
    console.error("V2 save threw", e);
    game.pushMessage?.("Save failed.");
    return;
  }
  if (v2.ok === false) {
    console.error("V2 save failed", v2.error);
    game.pushMessage?.("Save failed.");
    return;
  }
  const json = JSON.stringify(v2.value);
  // For now, skip compression to avoid adding deps; chunk directly
  setCookieChunks(SAVE_PREFIX, json, 30);
  game.pushMessage?.("Saved to cookies (V2).");
};

export const loadFromCookies = async (game: Game): Promise<boolean> => {
  const json = getCookieChunks(SAVE_PREFIX);
  if (!json) {
    game.pushMessage?.("No cookie save found.");
    return false;
  }
  try {
    // Prefer V2.
    const parsedV2 = parseSaveV2Json(json);
    if (parsedV2.ok) {
      const lr = await loadSaveV2(game, parsedV2.value);
      if (lr.ok === false) {
        console.error("V2 cookie load failed", lr.error);
        game.pushMessage?.("Cookie load failed.");
        // Ensure we don't keep running with a partially cleared world.
        try {
          game.newGame();
        } catch {}
        return false;
      }
      game.pushMessage?.("Loaded cookie save (V2).");
      return true;
    } else {
      // Legacy fallback (pre-V2 saves).
      const state: unknown = JSON.parse(json);
      if (!isLegacyGameState(state)) {
        console.error("Legacy cookie save failed basic shape check");
        game.pushMessage?.("Cookie load failed.");
        return false;
      }
      const activeUsernames = [game.localPlayerID];
      await loadGameState(game, activeUsernames, state, false);
      game.pushMessage?.("Loaded cookie save (legacy).");
      return true;
    }
  } catch (e) {
    console.error("Cookie load failed", e);
    game.pushMessage?.("Cookie load failed.");
    // Ensure we don't keep running with a partially cleared world.
    try {
      game.newGame();
    } catch {}
    return false;
  }
};

export const clearCookieSave = () => {
  try {
    const meta = getCookie(`${SAVE_PREFIX}_meta`);
    const total = meta ? parseInt(meta, 10) : NaN;
    if (Number.isFinite(total) && total > 0) {
      for (let i = 0; i < total; i++) deleteCookie(`${SAVE_PREFIX}_${i}`);
    } else {
      // Try a conservative cleanup of first few chunks if meta is corrupt
      for (let i = 0; i < 32; i++) deleteCookie(`${SAVE_PREFIX}_${i}`);
    }
  } catch {}
  deleteCookie(`${SAVE_PREFIX}_meta`);
};
