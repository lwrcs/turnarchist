import type { Game } from "../../game";

/**
 * Context objects used by save/load codecs.
 * Keep these minimal and strongly typed.
 *
 * NOTE: This module is intentionally small; it will grow as we implement
 * actual V2 save/load logic (ID resolution, deferred linking, etc.).
 */

export type SaveContext = {
  game: Game;
  /** Timestamp for save metadata or time-based state capture. */
  nowMs: number;
};

export type LoadContext = {
  game: Game;
};


