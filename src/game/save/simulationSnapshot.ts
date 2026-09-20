import type { Game } from "../../game";
import { captureFingerprint, type GameFingerprint } from "./fingerprint";
import { createSaveV2 } from "./writeV2";
import { parseSaveV2Json } from "./validate";
import type { SaveV2 } from "./schema";

/**
 * Immutable save payload used as the root of a deterministic agent branch.
 *
 * This intentionally does not load, execute, or mutate the supplied game. A
 * future isolated simulator will load `save` in its own realm for every branch.
 */
export interface SimulationSnapshot {
  readonly save: SaveV2;
  readonly serialized: string;
  readonly fingerprint: GameFingerprint;
}

export type SimulationSnapshotResult =
  | { ok: true; value: SimulationSnapshot }
  | { ok: false; error: string };

/** Capture a schema-validated, JSON-safe branch root without changing the live game. */
export function createSimulationSnapshot(game: Game): SimulationSnapshotResult {
  const before = captureFingerprint(game);
  const saved = createSaveV2(game);
  if (saved.ok === false) return { ok: false, error: `Save failed: ${String(saved.error)}` };

  const serialized = JSON.stringify(saved.value);
  const parsed = parseSaveV2Json(serialized);
  if (parsed.ok === false) return { ok: false, error: `Save validation failed: ${String(parsed.error)}` };

  const after = captureFingerprint(game);
  if (!sameFingerprint(before, after)) {
    return { ok: false, error: "Creating a simulation snapshot mutated the live game" };
  }
  if (parsed.value.worldSpec.rngState !== before.rngState) {
    return { ok: false, error: "Simulation snapshot RNG does not match the live game" };
  }

  return { ok: true, value: { save: parsed.value, serialized, fingerprint: before } };
}

/**
 * Guard used before and after branch evaluation. A branch runner must leave the
 * visible game exactly as it was when this snapshot was captured.
 */
export function isLiveGameUnchanged(game: Game, snapshot: SimulationSnapshot): boolean {
  return sameFingerprint(captureFingerprint(game), snapshot.fingerprint);
}

export function sameFingerprint(a: GameFingerprint, b: GameFingerprint): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
