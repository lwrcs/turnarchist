import { Game } from "../game";
import { createGameState, loadGameState } from "./gameState";
import {
  getCookieChunks,
  setCookieChunks,
  deleteCookie,
  getCookie,
} from "../utility/cookies";

const SAVE_PREFIX = "wr_save";

export const saveToCookies = (game: Game) => {
  const state = createGameState(game);
  const json = JSON.stringify(state);
  // For now, skip compression to avoid adding deps; chunk directly
  setCookieChunks(SAVE_PREFIX, json, 30);
  game.pushMessage?.("Saved to cookies.");
};

export const loadFromCookies = async (game: Game): Promise<boolean> => {
  const json = getCookieChunks(SAVE_PREFIX);
  if (!json) {
    game.pushMessage?.("No cookie save found.");
    return false;
  }
  try {
    const state = JSON.parse(json);
    // Ensure local player is considered active so loadGameState selects and sets current room
    const activeUsernames = [game.localPlayerID];
    await loadGameState(game, activeUsernames, state, false);
    game.pushMessage?.("Loaded from cookies.");
    return true;
  } catch (e) {
    console.error("Cookie load failed", e);
    game.pushMessage?.("Cookie load failed.");
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
