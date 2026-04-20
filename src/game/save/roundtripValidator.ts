/**
 * Roundtrip validation engine for save/load.
 *
 * Compares two GameFingerprints and produces human-readable diffs
 * describing exactly what diverged.
 */

import type {
  GameFingerprint,
  RoomFP,
  EntityFP,
  ItemFP,
  PlayerFP,
  TileFP,
} from "./fingerprint";
import { captureFingerprint } from "./fingerprint";
import { createSaveV2 } from "./writeV2";
import { parseSaveV2Json } from "./validate";
import { loadSaveV2 } from "./loadV2";
import type { Game } from "../../game";

// ---------------------------------------------------------------------------
// Diff types
// ---------------------------------------------------------------------------

export interface FingerprintDiff {
  category: "global" | "player" | "room" | "entity" | "item" | "tile";
  path: string; // e.g. "Room (5,3 main)" or "Player p1"
  message: string;
}

export interface RoundtripReport {
  passed: boolean;
  diffs: FingerprintDiff[];
  timingMs: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Diff engine
// ---------------------------------------------------------------------------

export function diffFingerprints(
  before: GameFingerprint,
  after: GameFingerprint,
): FingerprintDiff[] {
  const diffs: FingerprintDiff[] = [];

  // Global state
  if (before.rngState !== after.rngState) {
    diffs.push({
      category: "global",
      path: "RNG",
      message: `rngState ${before.rngState} vs ${after.rngState}`,
    });
  }
  if (before.depth !== after.depth) {
    diffs.push({
      category: "global",
      path: "depth",
      message: `depth ${before.depth} vs ${after.depth}`,
    });
  }

  // Players
  diffPlayers(before.playerFingerprints, after.playerFingerprints, diffs);

  // Rooms
  diffRooms(before.roomFingerprints, after.roomFingerprints, diffs);

  return diffs;
}

// ---------------------------------------------------------------------------
// Player diffs
// ---------------------------------------------------------------------------

function diffPlayers(
  before: PlayerFP[],
  after: PlayerFP[],
  diffs: FingerprintDiff[],
): void {
  const beforeMap = new Map(before.map((p) => [p.id, p]));
  const afterMap = new Map(after.map((p) => [p.id, p]));

  for (const [id, bp] of beforeMap) {
    const ap = afterMap.get(id);
    if (!ap) {
      diffs.push({
        category: "player",
        path: `Player ${id}`,
        message: "missing after load",
      });
      continue;
    }
    diffPlayerFields(bp, ap, diffs);
  }

  for (const id of afterMap.keys()) {
    if (!beforeMap.has(id)) {
      diffs.push({
        category: "player",
        path: `Player ${id}`,
        message: "unexpected player after load (not in before)",
      });
    }
  }
}

function diffPlayerFields(
  b: PlayerFP,
  a: PlayerFP,
  diffs: FingerprintDiff[],
): void {
  const path = `Player ${b.id}`;
  const fields: (keyof PlayerFP)[] = [
    "x",
    "y",
    "health",
    "maxHealth",
    "mana",
    "maxMana",
    "dead",
    "sightRadius",
    "turnCount",
    "coins",
    "depth",
    "equippedWeapon",
  ];

  for (const f of fields) {
    if (b[f] !== a[f]) {
      diffs.push({
        category: "player",
        path,
        message: `${f}: ${b[f]} vs ${a[f]}`,
      });
    }
  }

  if (b.roomPathId !== a.roomPathId) {
    diffs.push({
      category: "player",
      path,
      message: `room: ${b.roomPathId} vs ${a.roomPathId}`,
    });
  }

  // Per-slot inventory diff
  const beforeSlots = new Map(b.inventorySlots.map((s) => [s.split(":")[0], s]));
  const afterSlots = new Map(a.inventorySlots.map((s) => [s.split(":")[0], s]));

  for (const [slot, bs] of beforeSlots) {
    const as = afterSlots.get(slot);
    if (!as) {
      diffs.push({ category: "player", path, message: `inventory slot ${slot} missing after load: ${bs}` });
    } else if (bs !== as) {
      diffs.push({ category: "player", path, message: `inventory slot ${slot}: ${bs} vs ${as}` });
    }
  }
  for (const [slot, as] of afterSlots) {
    if (!beforeSlots.has(slot)) {
      diffs.push({ category: "player", path, message: `inventory slot ${slot} appeared after load: ${as}` });
    }
  }
}

// ---------------------------------------------------------------------------
// Room diffs
// ---------------------------------------------------------------------------

function roomKey(r: RoomFP): string {
  return `${r.pathId}:${r.roomX},${r.roomY}`;
}

function roomLabel(r: RoomFP): string {
  return `Room (${r.roomX},${r.roomY} ${r.pathId})`;
}

function diffRooms(
  before: RoomFP[],
  after: RoomFP[],
  diffs: FingerprintDiff[],
): void {
  const beforeMap = new Map(before.map((r) => [roomKey(r), r]));
  const afterMap = new Map(after.map((r) => [roomKey(r), r]));

  if (before.length !== after.length) {
    diffs.push({
      category: "room",
      path: "rooms",
      message: `room count ${before.length} vs ${after.length}`,
    });
  }

  for (const [key, br] of beforeMap) {
    const ar = afterMap.get(key);
    if (!ar) {
      diffs.push({
        category: "room",
        path: roomLabel(br),
        message: "missing after load",
      });
      continue;
    }
    diffRoomFields(br, ar, diffs);
  }

  for (const [key] of afterMap) {
    if (!beforeMap.has(key)) {
      const ar = afterMap.get(key)!;
      diffs.push({
        category: "room",
        path: roomLabel(ar),
        message: "unexpected room after load (not in before)",
      });
    }
  }
}

function diffRoomFields(
  b: RoomFP,
  a: RoomFP,
  diffs: FingerprintDiff[],
): void {
  const path = roomLabel(b);

  if (b.width !== a.width || b.height !== a.height) {
    diffs.push({
      category: "room",
      path,
      message: `dimensions ${b.width}x${b.height} vs ${a.width}x${a.height}`,
    });
  }

  if (b.entered !== a.entered) {
    diffs.push({
      category: "room",
      path,
      message: `entered: ${b.entered} vs ${a.entered}`,
    });
  }

  if (b.tileGrid !== a.tileGrid) {
    // Find which specific tiles changed
    const beforeSet = new Set(b.tileEntries);
    const afterSet = new Set(a.tileEntries);
    const removed = b.tileEntries.filter((e) => !afterSet.has(e)).slice(0, 5);
    const added = a.tileEntries.filter((e) => !beforeSet.has(e)).slice(0, 5);
    const detail = [
      removed.length ? `removed: ${removed.join(", ")}` : "",
      added.length ? `added: ${added.join(", ")}` : "",
    ].filter(Boolean).join("; ");
    diffs.push({
      category: "room",
      path,
      message: `tileGrid mismatch (${b.tileGrid} vs ${a.tileGrid}): ${detail || "unknown diff"}`,
    });
  }

  // Stateful tiles
  diffStatefulTiles(b.statefulTiles, a.statefulTiles, path, diffs);

  // Entities
  diffEntities(b.entities, a.entities, path, diffs);

  // Items
  diffItems(b.items, a.items, path, diffs);
}

// ---------------------------------------------------------------------------
// Stateful tile diffs
// ---------------------------------------------------------------------------

function tileKey(t: TileFP): string {
  return `${t.kind}@${t.x},${t.y}`;
}

function diffStatefulTiles(
  before: TileFP[],
  after: TileFP[],
  roomPath: string,
  diffs: FingerprintDiff[],
): void {
  const beforeMap = new Map(before.map((t) => [tileKey(t), t]));
  const afterMap = new Map(after.map((t) => [tileKey(t), t]));

  for (const [key, bt] of beforeMap) {
    const at = afterMap.get(key);
    if (!at) {
      diffs.push({
        category: "tile",
        path: roomPath,
        message: `missing tile ${key} after load`,
      });
      continue;
    }
    if (bt.stateHash !== at.stateHash) {
      diffs.push({
        category: "tile",
        path: roomPath,
        message: `tile ${key} state mismatch: before="${bt.stateStr}" after="${at.stateStr}"`,
      });
    }
  }

  for (const key of afterMap.keys()) {
    if (!beforeMap.has(key)) {
      diffs.push({
        category: "tile",
        path: roomPath,
        message: `unexpected tile ${key} after load`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Entity diffs
// ---------------------------------------------------------------------------

function entityKey(e: EntityFP): string {
  return `${e.kind}@${e.x},${e.y}`;
}

function diffEntities(
  before: EntityFP[],
  after: EntityFP[],
  roomPath: string,
  diffs: FingerprintDiff[],
): void {
  if (before.length !== after.length) {
    diffs.push({
      category: "entity",
      path: roomPath,
      message: `entity count ${before.length} vs ${after.length}`,
    });
  }

  // Match by key, report missing/extra/changed
  const beforeMap = new Map<string, EntityFP[]>();
  for (const e of before) {
    const k = entityKey(e);
    if (!beforeMap.has(k)) beforeMap.set(k, []);
    beforeMap.get(k)!.push(e);
  }
  const afterMap = new Map<string, EntityFP[]>();
  for (const e of after) {
    const k = entityKey(e);
    if (!afterMap.has(k)) afterMap.set(k, []);
    afterMap.get(k)!.push(e);
  }

  for (const [key, bList] of beforeMap) {
    const aList = afterMap.get(key);
    if (!aList) {
      for (const be of bList) {
        diffs.push({
          category: "entity",
          path: roomPath,
          message: `missing ${be.kind} at (${be.x},${be.y})`,
        });
      }
      continue;
    }
    const minLen = Math.min(bList.length, aList.length);
    for (let i = 0; i < minLen; i++) {
      diffEntityFields(bList[i], aList[i], roomPath, diffs);
    }
    for (let i = minLen; i < bList.length; i++) {
      diffs.push({
        category: "entity",
        path: roomPath,
        message: `missing extra ${bList[i].kind} at (${bList[i].x},${bList[i].y})`,
      });
    }
    for (let i = minLen; i < aList.length; i++) {
      diffs.push({
        category: "entity",
        path: roomPath,
        message: `unexpected extra ${aList[i].kind} at (${aList[i].x},${aList[i].y})`,
      });
    }
  }

  for (const [key, aList] of afterMap) {
    if (!beforeMap.has(key)) {
      for (const ae of aList) {
        diffs.push({
          category: "entity",
          path: roomPath,
          message: `unexpected ${ae.kind} at (${ae.x},${ae.y})`,
        });
      }
    }
  }
}

function diffEntityFields(
  b: EntityFP,
  a: EntityFP,
  roomPath: string,
  diffs: FingerprintDiff[],
): void {
  const label = `${b.kind} at (${b.x},${b.y})`;
  const fields: (keyof EntityFP)[] = [
    "health",
    "maxHealth",
    "dead",
    "seenPlayer",
  ];
  for (const f of fields) {
    if (b[f] !== a[f]) {
      diffs.push({
        category: "entity",
        path: roomPath,
        message: `${label}: ${f} ${b[f]} vs ${a[f]}`,
      });
    }
  }
  if (b.stateHash !== a.stateHash) {
    diffs.push({
      category: "entity",
      path: roomPath,
      message: `${label}: state hash mismatch (${b.stateHash} vs ${a.stateHash})`,
    });
  }
}

// ---------------------------------------------------------------------------
// Item diffs
// ---------------------------------------------------------------------------

function itemKey(it: ItemFP): string {
  return `${it.kind}@${it.x},${it.y}`;
}

function diffItems(
  before: ItemFP[],
  after: ItemFP[],
  roomPath: string,
  diffs: FingerprintDiff[],
): void {
  if (before.length !== after.length) {
    diffs.push({
      category: "item",
      path: roomPath,
      message: `item count ${before.length} vs ${after.length}`,
    });
  }

  const beforeMap = new Map<string, ItemFP[]>();
  for (const it of before) {
    const k = itemKey(it);
    if (!beforeMap.has(k)) beforeMap.set(k, []);
    beforeMap.get(k)!.push(it);
  }
  const afterMap = new Map<string, ItemFP[]>();
  for (const it of after) {
    const k = itemKey(it);
    if (!afterMap.has(k)) afterMap.set(k, []);
    afterMap.get(k)!.push(it);
  }

  for (const [key, bList] of beforeMap) {
    const aList = afterMap.get(key);
    if (!aList) {
      for (const bi of bList) {
        diffs.push({
          category: "item",
          path: roomPath,
          message: `missing ${bi.kind} at (${bi.x},${bi.y})`,
        });
      }
      continue;
    }
    const minLen = Math.min(bList.length, aList.length);
    for (let i = 0; i < minLen; i++) {
      diffItemFields(bList[i], aList[i], roomPath, diffs);
    }
    for (let i = minLen; i < bList.length; i++) {
      diffs.push({
        category: "item",
        path: roomPath,
        message: `missing extra ${bList[i].kind} at (${bList[i].x},${bList[i].y})`,
      });
    }
    for (let i = minLen; i < aList.length; i++) {
      diffs.push({
        category: "item",
        path: roomPath,
        message: `unexpected extra ${aList[i].kind} at (${aList[i].x},${aList[i].y})`,
      });
    }
  }

  for (const [key, aList] of afterMap) {
    if (!beforeMap.has(key)) {
      for (const ai of aList) {
        diffs.push({
          category: "item",
          path: roomPath,
          message: `unexpected ${ai.kind} at (${ai.x},${ai.y})`,
        });
      }
    }
  }
}

function diffItemFields(
  b: ItemFP,
  a: ItemFP,
  roomPath: string,
  diffs: FingerprintDiff[],
): void {
  const label = `${b.kind} at (${b.x},${b.y})`;
  if (b.stackCount !== a.stackCount) {
    diffs.push({
      category: "item",
      path: roomPath,
      message: `${label}: stackCount ${b.stackCount} vs ${a.stackCount}`,
    });
  }
  if (b.pickedUp !== a.pickedUp) {
    diffs.push({
      category: "item",
      path: roomPath,
      message: `${label}: pickedUp ${b.pickedUp} vs ${a.pickedUp}`,
    });
  }
  if (b.stateHash !== a.stateHash) {
    diffs.push({
      category: "item",
      path: roomPath,
      message: `${label}: state hash mismatch (${b.stateHash} vs ${a.stateHash})`,
    });
  }
}

// ---------------------------------------------------------------------------
// Roundtrip orchestrator
// ---------------------------------------------------------------------------

export async function validateRoundtrip(
  game: Game,
): Promise<RoundtripReport> {
  const start = performance.now();

  try {
    // 1. Capture "before" fingerprint
    const before = captureFingerprint(game);

    // 2. Save
    const saveR = createSaveV2(game);
    if (saveR.ok === false) {
      return {
        passed: false,
        diffs: [],
        timingMs: performance.now() - start,
        error: `Save failed: ${saveR.error}`,
      };
    }

    // 3. Serialize → parse (validates schema)
    const raw = JSON.stringify(saveR.value);
    const parsed = parseSaveV2Json(raw);
    if (parsed.ok === false) {
      return {
        passed: false,
        diffs: [],
        timingMs: performance.now() - start,
        error: `Parse/validate failed: ${typeof parsed.error === "object" ? JSON.stringify(parsed.error) : parsed.error}`,
      };
    }

    // 4. Load back into the same game instance.
    // loadSaveV2 clears and rebuilds game.rooms/players/etc internally,
    // so this is safe to call on the original game.
    const loadR = await loadSaveV2(game, parsed.value);
    if (loadR.ok === false) {
      const errDetail =
        typeof loadR.error === "object"
          ? JSON.stringify(loadR.error)
          : String(loadR.error);

      // Diagnostic: dump all generated rooms so we can see what was produced
      if (Array.isArray(game.rooms) && game.rooms.length > 0) {
        console.warn(
          "[devRoundtrip] Generated rooms after failed load:",
          game.rooms.map((r) => `${r.pathId}:(${r.roomX},${r.roomY}) depth=${r.depth}`),
        );
      } else {
        console.warn("[devRoundtrip] game.rooms is empty after failed load");
      }
      // Diagnostic: dump save delta room coords
      const savedRoomCoords = parsed.value.delta.rooms.map(
        (rd) => `${rd.pathId}:(${rd.roomX},${rd.roomY}) gid=${rd.roomGid}`,
      );
      console.warn("[devRoundtrip] Save delta rooms:", savedRoomCoords);

      return {
        passed: false,
        diffs: [],
        timingMs: performance.now() - start,
        error: `Load failed: ${errDetail}`,
      };
    }

    // 5. Capture "after" fingerprint
    const after = captureFingerprint(game);

    // 6. Diff
    const diffs = diffFingerprints(before, after);

    return {
      passed: diffs.length === 0,
      diffs,
      timingMs: performance.now() - start,
    };
  } catch (e: any) {
    return {
      passed: false,
      diffs: [],
      timingMs: performance.now() - start,
      error: `Exception: ${e.message ?? e}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Pretty-print helpers
// ---------------------------------------------------------------------------

export function formatReport(report: RoundtripReport): string {
  const lines: string[] = [];
  lines.push(`=== Roundtrip Validation Report ===`);
  lines.push(`Passed: ${report.passed}`);
  lines.push(`Time: ${report.timingMs.toFixed(1)}ms`);

  if (report.error) {
    lines.push(`Error: ${report.error}`);
  }

  if (report.diffs.length > 0) {
    lines.push(`\nDivergences (${report.diffs.length}):`);
    for (const d of report.diffs) {
      lines.push(`  [${d.category}] ${d.path}: ${d.message}`);
    }
  } else if (!report.error) {
    lines.push(`\nNo divergences — roundtrip is clean!`);
  }

  return lines.join("\n");
}
