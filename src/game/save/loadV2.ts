import { Game, LevelState } from "../../game";
import { LevelGenerator } from "../../level/levelGenerator";
import { Random } from "../../utility/random";
import { IdGenerator } from "../../globalStateManager/IdGenerator";
import { registerBuiltinTileCodecsV2 } from "./registry/tilesBuiltins";
import { registerBuiltinItemCodecsV2 } from "./registry/itemsBuiltins";
import { registerBuiltinEnemyCodecsV2 } from "./registry/enemiesBuiltins";
import { tileRegistryV2 } from "./registry/tiles";
import { itemRegistryV2 } from "./registry/items";
import { enemyRegistryV2 } from "./registry/enemies";
import type { Result } from "./errors";
import { err, ok } from "./errors";
import type { DoorTileSaveV2, RoomDeltaV2, SaveV2 } from "./schema";
import { envKindToEnvType, directionKindToDirection } from "./mappers";
import type { Room } from "../../room/room";
import type { SidePathOptions } from "../../level/sidePathManager";
import { EnvType } from "../../constants/environmentTypes";
import { Door } from "../../tile/door";
import { InsideLevelDoor } from "../../tile/insideLevelDoor";
import { Button } from "../../tile/button";
import { DownLadder } from "../../tile/downLadder";
import { UpLadder } from "../../tile/upLadder";
import { LockType } from "../../tile/lockable";
import { Floor } from "../../tile/floor";
import type { Tile } from "../../tile/tile";
import type { Entity } from "../../entity/entity";
import type { Item } from "../../item/item";
import { Player } from "../../player/player";
import { Weapon } from "../../item/weapon/weapon";
import { HitWarning } from "../../drawable/hitWarning";
import { WizardEnemy } from "../../entity/enemy/wizardEnemy";
import { Enemy } from "../../entity/enemy/enemy";
import { Chest } from "../../entity/object/chest";
import { WizardFireball } from "../../projectile/wizardFireball";
import { EnemySpawnAnimation } from "../../projectile/enemySpawnAnimation";
import { Equippable } from "../../item/equippable";
import { GameplaySettings } from "../gameplaySettings";
import { GameConstants } from "../gameConstants";

type GidCarrier = { globalId: string };

const collectSaveGids = (save: SaveV2): Set<string> => {
  const out = new Set<string>();

  for (const rd of save.delta.rooms) {
    out.add(rd.roomGid);

    for (const ts of rd.tiles) if (ts.gid) out.add(ts.gid);
    for (const es of rd.enemies) out.add(es.gid);
    for (const is of rd.items) out.add(is.gid);
    for (const ps of rd.projectiles) {
      out.add(ps.gid);
      if (ps.kind === "enemy_spawn_animation") out.add(ps.enemy.gid);
    }
  }

  const allPlayers = [
    ...Object.values(save.delta.players),
    ...Object.values(save.delta.offlinePlayers),
  ];
  for (const p of allPlayers) {
    for (const slot of p.inventory.slots) {
      if (!slot) continue;
      out.add(slot.gid);
    }
  }

  return out;
};

const reserveAndAssignGid = (
  obj: GidCarrier,
  gid: string,
  preReservedGids: ReadonlySet<string>,
  assignedByGid: Map<string, GidCarrier>,
  assignedGidByObj: Map<GidCarrier, string>,
): Result<void> => {
  // Prevent a single object from being assigned multiple save gids during a load.
  const already = assignedGidByObj.get(obj);
  if (already && already !== gid) {
    return err({
      kind: "DuplicateGid",
      message: `Object already assigned gid=${already} during load; cannot reassign to gid=${gid}`,
    });
  }

  if (obj.globalId === gid) {
    // Record mapping so later duplicate checks behave consistently even when no assignment is needed.
    assignedByGid.set(gid, obj);
    assignedGidByObj.set(obj, gid);
    return ok(undefined);
  }

  const existing = assignedByGid.get(gid);
  if (existing && existing !== obj) {
    return err({
      kind: "DuplicateGid",
      message: `GID already assigned during load: ${gid}`,
    });
  }

  // If this gid is already reserved, it's only valid to assign it if it came from the save.
  if (IdGenerator.isReserved(gid)) {
    if (!preReservedGids.has(gid)) {
      return err({
        kind: "DuplicateGid",
        message: `GID already reserved: ${gid}`,
      });
    }
    obj.globalId = gid;
    assignedByGid.set(gid, obj);
    assignedGidByObj.set(obj, gid);
    return ok(undefined);
  }

  try {
    IdGenerator.reserve(gid);
    obj.globalId = gid;
    assignedByGid.set(gid, obj);
    assignedGidByObj.set(obj, gid);
    return ok(undefined);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return err({ kind: "DuplicateGid", message: msg });
  }
};

const findGeneratedRoomCandidatesForDelta = (rooms: Room[], d: RoomDeltaV2): Room[] => {
  // Prefer coordinate-based reassociation when available; these are stable for a given seed/depth/pathId.
  if (typeof d.roomX === "number" && typeof d.roomY === "number") {
    const candidates = rooms.filter(
      (r) => r.roomX === d.roomX && r.roomY === d.roomY && r.pathId === d.pathId,
    );
    if (candidates.length === 1) return candidates;
    if (candidates.length > 1) {
      // Disambiguate by mapGroup if possible; otherwise keep stable ordering.
      const mg = candidates.filter((r) => r.mapGroup === d.mapGroup);
      const ordered = (mg.length > 0 ? mg : candidates).slice();
      ordered.sort((a, b) => (a.globalId < b.globalId ? -1 : a.globalId > b.globalId ? 1 : 0));
      return ordered;
    }
  }

  // Backward compat: if roomX/roomY are missing, try to locate by any saved anchor coordinate that
  // should still lie within the room bounds (tile or entity positions are in world coords).
  const findByAnchor = (): Room | undefined => {
    const anchors: Array<{ x: number; y: number }> = [];
    for (const t of d.tiles) anchors.push({ x: t.x, y: t.y });
    for (const e of d.enemies) anchors.push({ x: e.x, y: e.y });
    for (const it of d.items) anchors.push({ x: it.x, y: it.y });
    for (const p of d.projectiles) anchors.push({ x: p.x, y: p.y });
    for (const hw of d.hitWarnings) anchors.push({ x: hw.x, y: hw.y });

    const MAX_ANCHORS = 64;
    let intersection: Room[] | null = null;
    let processed = 0;

    for (const a of anchors) {
      if (processed >= MAX_ANCHORS) break;
      processed++;

      const candidates = rooms.filter(
        (r) => r.pathId === d.pathId && r.isPositionInRoom(a.x, a.y),
      );
      if (candidates.length === 0) continue;

      // If an anchor uniquely identifies a room, take it immediately.
      if (candidates.length === 1) return candidates[0];

      // Otherwise, try to intersect candidate sets across anchors to disambiguate.
      if (!intersection) {
        intersection = candidates;
      } else {
        const set = new Set(candidates);
        intersection = intersection.filter((r) => set.has(r));
        if (intersection.length === 1) return intersection[0];
      }
    }

    if (intersection && intersection.length > 0) {
      // Prefer mapGroup if possible, but don't guess if we still have ambiguity.
      const mg = intersection.filter((r) => r.mapGroup === d.mapGroup);
      const narrowed = mg.length > 0 ? mg : intersection;
      if (narrowed.length === 1) return narrowed[0];
    }

    return undefined;
  };
  const byAnchor = findByAnchor();
  if (byAnchor) return [byAnchor];

  // Backward compat: older V2 saves used (roomId,mapGroup,pathId).
  const legacyCandidates = rooms.filter(
    (r) => r.id === d.roomId && r.mapGroup === d.mapGroup && r.pathId === d.pathId,
  );
  if (legacyCandidates.length === 1) return legacyCandidates;
  if (legacyCandidates.length > 1) {
    const ordered = legacyCandidates.slice();
    ordered.sort((a, b) => (a.globalId < b.globalId ? -1 : a.globalId > b.globalId ? 1 : 0));
    return ordered;
  }

  // Resilience: if mapGroup drifted (e.g., due to generation order changes), fall back to id+pathId.
  const byIdCandidates = rooms.filter((r) => r.id === d.roomId && r.pathId === d.pathId);
  if (byIdCandidates.length === 1) return byIdCandidates;
  if (byIdCandidates.length > 1) {
    const ordered = byIdCandidates.slice();
    ordered.sort((a, b) => (a.globalId < b.globalId ? -1 : a.globalId > b.globalId ? 1 : 0));
    return ordered;
  }

  return [];
};

export const loadSaveV2 = async (game: Game, save: SaveV2): Promise<Result<void>> => {
  game.loadingSaveV2 = true;
  try {
  // Restore developer mode early so subsequent load/debug behavior matches the saved session.
  // Back-compat: old saves omit this field.
  if (save.meta?.developerMode !== undefined) {
    GameConstants.DEVELOPER_MODE = save.meta.developerMode;
  }

  // Ensure builtin codecs are registered.
  registerBuiltinTileCodecsV2();
  registerBuiltinItemCodecsV2();
  registerBuiltinEnemyCodecsV2();

  // We discard and regenerate the world during load; clear previous session ID reservations so
  // saved gids can be re-reserved without collisions from the pre-load world.
  IdGenerator.clearRegistryForLoad();

  // IMPORTANT: if the app was refreshed, IdGenerator's counter resets and regeneration can create
  // the same textual IDs as the save. Pre-reserve all gids from the save before regenerating so
  // generation will skip them.
  const preReservedGids = collectSaveGids(save);
  for (const gid of preReservedGids) {
    if (!IdGenerator.isReserved(gid)) IdGenerator.reserve(gid);
  }
  const assignedByGid = new Map<string, GidCarrier>();
  const assignedGidByObj = new Map<GidCarrier, string>();
  const enemyAiStateByGid = new Map<
    string,
    { seenPlayer?: boolean; heardPlayer?: boolean; aggro?: boolean }
  >();

  // Reset high-level game collections (similar to legacy loadGameState).
  game.rooms = [];
  game.roomsById = new Map();
  game.levels = [];
  game.levelsById = new Map();
  game.players = {};
  game.offlinePlayers = {};

  // Recreate generator and deterministic inputs.
  game.levelgen = new LevelGenerator();
  game.levelgen.setSeed(save.worldSpec.seed);
  game.levelgen.setMainPathEnvOverride(envKindToEnvType(save.worldSpec.env));

  // Generate main path depths 0..depth WITH population.
  // We need the full tile geometry (floors/walls/doors/ladder placement) to exist exactly as in gameplay;
  // we'll overwrite dynamic deltas (entities/items/projectiles) afterward.
  // Use the saved generation plan when present to avoid any runtime nondeterminism
  // (e.g. PNG level availability checks or variation selection).
  for (let depth = 0; depth <= save.worldSpec.depth; depth++) {
    const planEntry = save.worldSpec.mainPathPlan?.find((p) => p.depth === depth);
    const genOverride =
      planEntry?.kind === "png" && typeof planEntry.pngUrl === "string" && planEntry.pngUrl.length > 0
        ? { forcePngUrl: planEntry.pngUrl }
        : planEntry?.kind === "procedural"
          ? { forceProcedural: true }
          : undefined;

    await game.levelgen.generate(
      game,
      depth,
      false,
      () => {},
      envKindToEnvType(save.worldSpec.env),
      false,
      undefined,
      // IMPORTANT: pass no controls here to match runtime generation.
      // Main-path generation in live gameplay is triggered via `DownLadder`/`SidePathManager`,
      // which calls `levelgen.generate(..., pathId="main", opts=undefined)`. If we pass explicit
      // branching/loopiness overrides here, the layout can diverge and room reassociation fails.
      undefined,
      genOverride,
    );
  }

  // Switch to the active depth.
  const activeLevel = game.levels[save.worldSpec.depth];
  if (!activeLevel) {
    return err({ kind: "InvalidState", message: "Active level not generated" });
  }

  // Build per-sidepath generation overrides (env + opts) from the saved rope-down ladders.
  // When saving while inside a sidepath, this data is critical to reproduce the sidepath layout and skins.
  const roomDeltaByGid = new Map<string, RoomDeltaV2>();
  for (const rd of save.delta.rooms) roomDeltaByGid.set(rd.roomGid, rd);
  const sidepathGenOverrides = new Map<
    string,
    { env: ReturnType<typeof envKindToEnvType>; opts?: SidePathOptions }
  >();

  const inferSidepathOptsFallback = (
    env: EnvType,
    depth: number,
    roomsHint?: number,
  ): SidePathOptions | undefined => {
    // Best-effort backward compat when loading older saves that didn't persist DownLadder.opts.
    // Keep this narrow and deterministic; prefer exact saved opts when available.
    // Forest sidepaths at depth=1 are intended to be single-room mazes with a soft margin.
    if (env === EnvType.FOREST && depth === 1) {
      return {
        caveRooms: roomsHint ?? 1,
        locked: true,
        linearity: 0.5,
        mapWidth: 50,
        mapHeight: 50,
        giantCentralRoom: true,
        giantRoomScale: 0.6,
        entranceInMainRoom: true,
        keyInMainRoom: true,
        exitInMainRoom: true,
        organicTunnelsAvoidCenter: true,
        softMargin: 5,
      };
    }
    // If we at least know the intended room count, preserve that.
    if (roomsHint !== undefined) return { caveRooms: roomsHint };
    return undefined;
  };

  for (const rd of save.delta.rooms) {
    for (const ts of rd.tiles) {
      if (ts.kind !== "down_ladder") continue;
      if (ts.isSidePath !== true) continue;
      if (!ts.linkedRoomGid) continue;
      const linkedDelta = roomDeltaByGid.get(ts.linkedRoomGid);
      if (!linkedDelta) continue;
      const pid = linkedDelta.pathId;
      if (!pid || pid === "main") continue;

      const optsSave = ts.opts;
      const optsRuntime: SidePathOptions | undefined =
        optsSave === undefined
          ? inferSidepathOptsFallback(envKindToEnvType(ts.environment), save.worldSpec.depth, undefined)
          : {
              caveRooms: optsSave.caveRooms,
              mapWidth: optsSave.mapWidth,
              mapHeight: optsSave.mapHeight,
              locked: optsSave.locked,
              envType: optsSave.envType ? envKindToEnvType(optsSave.envType) : undefined,
              linearity: optsSave.linearity,
              branching: optsSave.branching,
              loopiness: optsSave.loopiness,
              giantCentralRoom: optsSave.giantCentralRoom,
              giantRoomScale: optsSave.giantRoomScale,
              organicTunnelsAvoidCenter: optsSave.organicTunnelsAvoidCenter,
              softMargin: optsSave.softMargin,
              keyInMainRoom: optsSave.keyInMainRoom,
              entranceInMainRoom: optsSave.entranceInMainRoom,
              exitInMainRoom: optsSave.exitInMainRoom,
            };

      // First write wins (stable); multiple ladders could point to the same sidepath.
      if (!sidepathGenOverrides.has(pid)) {
        sidepathGenOverrides.set(pid, {
          env: envKindToEnvType(ts.environment),
          opts: optsRuntime,
        });
      }
    }
  }

  // Ensure sidepaths exist (deterministic by pathId + room count where available).
  for (const sp of save.worldSpec.sidepaths) {
    // Sidepath generation no longer overwrites `game.rooms`; capture the linkedRoom and merge
    // its level's rooms into the active level.
    let linkedRoom: Room | undefined = undefined;
    const override = sidepathGenOverrides.get(sp.pathId);
    const env = override?.env ?? envKindToEnvType(save.worldSpec.env);
    const opts: SidePathOptions | undefined =
      override?.opts ??
      inferSidepathOptsFallback(env, save.worldSpec.depth, sp.rooms);
    await game.levelgen.generate(
      game,
      save.worldSpec.depth,
      true,
      (r) => {
        linkedRoom = r ?? undefined;
      },
      env,
      false,
      sp.pathId,
      opts,
    );

    const generatedSideRooms =
      linkedRoom?.level?.rooms?.filter((r) => r.pathId === sp.pathId) ?? [];
    const existing = new Set(activeLevel.rooms.map((r) => r.globalId));
    for (const r of generatedSideRooms) {
      if (!existing.has(r.globalId)) activeLevel.rooms.push(r);
    }
  }

  // Set active room list and rebuild map.
  game.rooms = activeLevel.rooms;

  // Align generated room globalIds to saved roomGids using deterministic locator (roomId+mapGroup+pathId).
  const usedGeneratedRooms = new Set<Room>();
  const seenSaveRoomGids = new Set<string>();
  for (const rd of save.delta.rooms) {
    if (seenSaveRoomGids.has(rd.roomGid)) {
      return err({
        kind: "InvalidState",
        message: `Duplicate roomGid in save.delta.rooms: ${rd.roomGid}`,
      });
    }
    seenSaveRoomGids.add(rd.roomGid);

    const candidates = findGeneratedRoomCandidatesForDelta(game.rooms, rd).filter(
      (r) => !usedGeneratedRooms.has(r),
    );
    const candidate = candidates[0];
    if (!candidate) {
      return err({
        kind: "MissingReference",
        message: `Could not find UNUSED generated room for saved roomGid=${rd.roomGid} roomId=${rd.roomId} mapGroup=${rd.mapGroup} pathId=${rd.pathId} roomX=${String(rd.roomX)} roomY=${String(rd.roomY)} candidates=${candidates.length}`,
      });
    }
    usedGeneratedRooms.add(candidate);
    const gidRes = reserveAndAssignGid(
      candidate,
      rd.roomGid,
      preReservedGids,
      assignedByGid,
      assignedGidByObj,
    );
    if (!gidRes.ok) return gidRes;
  }

  game.roomsById = new Map(game.rooms.map((r) => [r.globalId, r]));

  const entitiesByGid = new Map<string, Entity>();
  const tilesByGid = new Map<string, Tile>();
  const itemsByGid = new Map<string, Item>();

  // Apply per-room deltas: flags, tiles, items, entities.
  for (const rd of save.delta.rooms) {
    const room = game.roomsById.get(rd.roomGid);
    if (!room) {
      return err({ kind: "MissingReference", message: `Room not found for gid=${rd.roomGid}` });
    }
    room.entered = rd.entered;
    room.active = rd.active;
    room.onScreen = rd.onScreen;

    const ctx = { game };

    const findFirstDownLadder = (): DownLadder | null => {
      for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
        for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
          const t = room.roomArray[x]?.[y];
          if (t instanceof DownLadder) return t;
        }
      }
      return null;
    };

    const findFirstUpLadder = (): UpLadder | null => {
      for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
        for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
          const t = room.roomArray[x]?.[y];
          if (t instanceof UpLadder) return t;
        }
      }
      return null;
    };

    // Apply tile deltas (in-room mutations).
    for (const ts of rd.tiles) {
      let effectiveTs: typeof ts = ts;
      let applyRoom: Room = room;
      let t = applyRoom.roomArray[ts.x]?.[ts.y];

      const findNearestDownLadder = (
        wantSidePath: boolean,
        wantKeyId?: number,
      ): { room: Room; tile: DownLadder } | null => {
        let best: { room: Room; tile: DownLadder; dist: number } | null = null;
        for (const r of game.rooms) {
          for (let x = r.roomX - 1; x < r.roomX + r.width + 1; x++) {
            for (let y = r.roomY - 1; y < r.roomY + r.height + 1; y++) {
              const tt = r.roomArray[x]?.[y];
              if (!(tt instanceof DownLadder)) continue;
              if (tt.isSidePath !== wantSidePath) continue;
              if (wantKeyId !== undefined) {
                const kid = tt.lockable?.keyID;
                if (kid !== wantKeyId) continue;
              }
              const dist = Math.abs(tt.x - effectiveTs.x) + Math.abs(tt.y - effectiveTs.y);
              if (!best || dist < best.dist) best = { room: r, tile: tt, dist };
            }
          }
        }
        return best ? { room: best.room, tile: best.tile } : null;
      };

      const findTileAtCoordInAnyRoom = <T extends Tile>(
        x: number,
        y: number,
        predicate: (tile: Tile) => tile is T,
      ): { room: Room; tile: T } | null => {
        for (const r of game.rooms) {
          const tt = r.roomArray[x]?.[y];
          if (!tt) continue;
          if (!predicate(tt)) continue;
          return { room: r, tile: tt };
        }
        return null;
      };

      const findNearestTileInRoom = <T extends Tile>(
        predicate: (tile: Tile) => tile is T,
      ): T | null => {
        let best: { tile: T; dist: number } | null = null;
        for (let x = applyRoom.roomX - 1; x < applyRoom.roomX + applyRoom.width + 1; x++) {
          for (let y = applyRoom.roomY - 1; y < applyRoom.roomY + applyRoom.height + 1; y++) {
            const tt = applyRoom.roomArray[x]?.[y];
            if (!tt) continue;
            if (!predicate(tt)) continue;
            const dist = Math.abs(tt.x - effectiveTs.x) + Math.abs(tt.y - effectiveTs.y);
            if (!best || dist < best.dist) best = { tile: tt, dist };
          }
        }
        return best ? best.tile : null;
      };

      // Ladders are generation features and can move if levelgen changes slightly.
      // If the saved coordinate isn't a ladder anymore, re-associate the save to the generated ladder.
      if (ts.kind === "down_ladder" && !(t instanceof DownLadder)) {
        // First, if the saved coordinate is still a DownLadder but belongs to a different room (global coords),
        // re-target this tile apply to that room.
        for (const r of game.rooms) {
          const tt = r.roomArray[ts.x]?.[ts.y];
          if (tt instanceof DownLadder) {
            applyRoom = r;
            t = tt;
            break;
          }
        }

        if (t instanceof DownLadder) {
          // ok
        } else {
        // Prefer matching an existing ladder (by sidepath flag + keyId when present) anywhere in the loaded world.
        const nearest = findNearestDownLadder(ts.isSidePath, ts.lock?.keyId);
        if (nearest) {
          applyRoom = nearest.room;
          t = nearest.tile;
          effectiveTs = { ...ts, x: nearest.tile.x, y: nearest.tile.y };
        } else {
        const found = findFirstDownLadder();
        if (found) {
          t = found;
          effectiveTs = { ...ts, x: found.x, y: found.y };
        } else {
          // As a last resort, recreate the ladder in this room.
          const place = (() => {
            if (room.isPositionInRoom(ts.x, ts.y)) {
              const existing = room.roomArray[ts.x]?.[ts.y];
              if (existing && existing.isSolid() === false) return { x: ts.x, y: ts.y };
            }
            const center = room.getRoomCenter();
            const centerTile = room.roomArray[center.x]?.[center.y];
            if (centerTile && centerTile.isSolid() === false) return center;
            for (let x = room.roomX; x < room.roomX + room.width; x++) {
              for (let y = room.roomY; y < room.roomY + room.height; y++) {
                const tt = room.roomArray[x]?.[y];
                if (tt && tt.isSolid() === false) return { x, y };
              }
            }
            return null;
          })();

          if (!place) {
            return err({
              kind: "MissingReference",
              message: `DownLadder not found and no valid placement in room gid=${room.globalId}`,
            });
          }

          // Build lock override if present.
          const lockStateOverride =
            ts.lock === undefined
              ? undefined
              : {
                  lockType:
                    ts.lock.lockType === "none"
                      ? LockType.NONE
                      : ts.lock.lockType === "locked"
                        ? LockType.LOCKED
                        : ts.lock.lockType === "guarded"
                          ? LockType.GUARDED
                          : LockType.TUNNEL,
                  keyID: ts.lock.keyId,
                };

          const opts =
            ts.opts === undefined
              ? undefined
              : {
                  caveRooms: ts.opts.caveRooms,
                  mapWidth: ts.opts.mapWidth,
                  mapHeight: ts.opts.mapHeight,
                  locked: ts.opts.locked,
                  envType: ts.opts.envType
                    ? envKindToEnvType(ts.opts.envType)
                    : undefined,
                  linearity: ts.opts.linearity,
                  branching: ts.opts.branching,
                  loopiness: ts.opts.loopiness,
                  giantCentralRoom: ts.opts.giantCentralRoom,
                  giantRoomScale: ts.opts.giantRoomScale,
                  organicTunnelsAvoidCenter: ts.opts.organicTunnelsAvoidCenter,
                  softMargin: ts.opts.softMargin,
                  keyInMainRoom: ts.opts.keyInMainRoom,
                  entranceInMainRoom: ts.opts.entranceInMainRoom,
                  exitInMainRoom: ts.opts.exitInMainRoom,
                };

          const dl = new DownLadder(
            room,
            game,
            place.x,
            place.y,
            ts.isSidePath,
            envKindToEnvType(ts.environment),
            LockType.NONE,
            opts,
            lockStateOverride,
          );
          room.roomArray[place.x][place.y] = dl;
          applyRoom = room;
          t = dl;
          effectiveTs = { ...ts, x: place.x, y: place.y };
        }
        }
        }
      }
      if (ts.kind === "up_ladder" && !(t instanceof UpLadder)) {
        // If the saved coordinate is an UpLadder but belongs to a different room, re-target apply.
        for (const r of game.rooms) {
          const tt = r.roomArray[ts.x]?.[ts.y];
          if (tt instanceof UpLadder) {
            applyRoom = r;
            t = tt;
            break;
          }
        }

        if (t instanceof UpLadder) {
          // ok
        } else {
        const found = findFirstUpLadder();
        if (found) {
          t = found;
          effectiveTs = { ...ts, x: found.x, y: found.y };
        } else {
          const place = (() => {
            if (room.isPositionInRoom(ts.x, ts.y)) {
              const existing = room.roomArray[ts.x]?.[ts.y];
              if (existing && existing.isSolid() === false) return { x: ts.x, y: ts.y };
            }
            const center = room.getRoomCenter();
            const centerTile = room.roomArray[center.x]?.[center.y];
            if (centerTile && centerTile.isSolid() === false) return center;
            for (let x = room.roomX; x < room.roomX + room.width; x++) {
              for (let y = room.roomY; y < room.roomY + room.height; y++) {
                const tt = room.roomArray[x]?.[y];
                if (tt && tt.isSolid() === false) return { x, y };
              }
            }
            return null;
          })();
          if (!place) {
            return err({
              kind: "MissingReference",
              message: `UpLadder not found and no valid placement in room gid=${room.globalId}`,
            });
          }
          const ul = new UpLadder(room, game, place.x, place.y);
          room.roomArray[place.x][place.y] = ul;
          applyRoom = room;
          t = ul;
          effectiveTs = { ...ts, x: place.x, y: place.y };
        }
        }
      }

      // Doors/buttons can also move if generation changes (or if PNG/procedural selection differs).
      // Remap to the nearest matching tile in the room instead of failing the entire load.
      if (effectiveTs.kind === "door" && !(t instanceof Door)) {
        const globalFound = findTileAtCoordInAnyRoom(
          effectiveTs.x,
          effectiveTs.y,
          (tile): tile is Door => tile instanceof Door,
        );
        if (globalFound) {
          applyRoom = globalFound.room;
          t = globalFound.tile;
        }

        const found = t instanceof Door ? null : findNearestTileInRoom((tile): tile is Door => tile instanceof Door);
        if (found) {
          t = found;
          effectiveTs = { ...effectiveTs, x: found.x, y: found.y };
        }
      }
      if (effectiveTs.kind === "inside_level_door" && !(t instanceof InsideLevelDoor)) {
        const globalFound = findTileAtCoordInAnyRoom(
          effectiveTs.x,
          effectiveTs.y,
          (tile): tile is InsideLevelDoor => tile instanceof InsideLevelDoor,
        );
        if (globalFound) {
          applyRoom = globalFound.room;
          t = globalFound.tile;
        }

        const found =
          t instanceof InsideLevelDoor
            ? null
            : findNearestTileInRoom(
                (tile): tile is InsideLevelDoor => tile instanceof InsideLevelDoor,
              );
        if (found) {
          t = found;
          effectiveTs = { ...effectiveTs, x: found.x, y: found.y };
        }
      }
      if (effectiveTs.kind === "button" && !(t instanceof Button)) {
        const globalFound = findTileAtCoordInAnyRoom(
          effectiveTs.x,
          effectiveTs.y,
          (tile): tile is Button => tile instanceof Button,
        );
        if (globalFound) {
          applyRoom = globalFound.room;
          t = globalFound.tile;
        }

        const found = t instanceof Button ? null : findNearestTileInRoom((tile): tile is Button => tile instanceof Button);
        if (found) {
          t = found;
          effectiveTs = { ...effectiveTs, x: found.x, y: found.y };
        }
      }

      if (!t) {
        // Non-fatal: generation changed; skip this tile delta rather than abort load.
        console.warn(
          `V2 load: tile missing at (${effectiveTs.x},${effectiveTs.y}) in room gid=${room.globalId} kind=${effectiveTs.kind}; skipping`,
        );
        continue;
      }
      if (effectiveTs.gid) {
        const gid = effectiveTs.gid;

        // If we already associated a tile with this gid earlier in the load, reuse it.
        const existing = tilesByGid.get(gid);
        if (existing) {
          t = existing;
          applyRoom = existing.room;
          effectiveTs = { ...effectiveTs, x: existing.x, y: existing.y };
        } else {
          const gidRes = reserveAndAssignGid(
            t,
            gid,
            preReservedGids,
            assignedByGid,
            assignedGidByObj,
          );
          if (!gidRes.ok) {
            // If the gid was reserved earlier (likely due to tile deltas referencing shared/global tiles),
            // treat this as non-fatal if we can continue without applying this tile delta.
            console.warn(`V2 load: duplicate tile gid=${gid} (kind=${effectiveTs.kind}); skipping tile delta`);
            continue;
          }
          tilesByGid.set(gid, t);
        }
      }

      // Handle fields that require mapping before codec apply.
      if (effectiveTs.kind === "down_ladder") {
        const dl = t;
        if (!(dl instanceof DownLadder)) {
          return err({ kind: "InvalidState", message: "Expected DownLadder at saved down_ladder coordinate" });
        }
        dl.environment = envKindToEnvType(effectiveTs.environment);
      }

      const codec = tileRegistryV2.get(effectiveTs.kind);
      if (!codec) {
        return err({ kind: "MissingReference", message: `No tile codec registered for kind=${effectiveTs.kind}` });
      }
      codec.apply(effectiveTs, applyRoom, ctx);
    }

    // Replace room items and entities with saved ones for supported kinds.
    room.items = [];
    for (const is of rd.items) {
      const codec = itemRegistryV2.get(is.kind);
      if (!codec) {
        if (GameplaySettings.SAVE_V2_STRICT_KINDS) {
          return err({ kind: "InvalidState", message: `Missing Item codec for kind=${is.kind}` });
        }
        continue; // unsupported kind not yet persisted
      }
      const spawned = codec.spawn(is, room, { game });
      // Ensure gid matches save (codec sets, but enforce reservation)
      const gidRes = reserveAndAssignGid(
        spawned,
        is.gid,
        preReservedGids,
        assignedByGid,
        assignedGidByObj,
      );
      if (!gidRes.ok) return gidRes;
      itemsByGid.set(is.gid, spawned);
      spawned.level = room;
      if (!spawned.pickedUp) room.items.push(spawned);
    }

    room.entities = [];
    // Reset per-room counters derived from the entities list.
    room.currentSpawnerCount = 0;
    for (const es of rd.enemies) {
      const codec = enemyRegistryV2.get(es.kind);
      if (!codec) {
        if (GameplaySettings.SAVE_V2_STRICT_KINDS) {
          return err({ kind: "InvalidState", message: `Missing Enemy codec for kind=${es.kind}` });
        }
        continue;
      }
      const spawned = codec.spawn(es, room, { game });
      const gidRes = reserveAndAssignGid(
        spawned,
        es.gid,
        preReservedGids,
        assignedByGid,
        assignedGidByObj,
      );
      if (!gidRes.ok) return gidRes;
      spawned.room = room;
      room.entities.push(spawned);
      entitiesByGid.set(es.gid, spawned);

      // Track AI wake/aggro state; must be applied after players are restored (targetPlayer linking).
      if ("seenPlayer" in es || "heardPlayer" in es || "aggro" in es) {
        const seenPlayer = "seenPlayer" in es ? es.seenPlayer : undefined;
        const heardPlayer = "heardPlayer" in es ? es.heardPlayer : undefined;
        const aggro = "aggro" in es ? es.aggro : undefined;
        if (seenPlayer !== undefined || heardPlayer !== undefined || aggro !== undefined) {
          enemyAiStateByGid.set(es.gid, { seenPlayer, heardPlayer, aggro });
        }
      }

      // Restore chest drop references so opened chests don't incorrectly self-empty on load.
      if (es.kind === "chest" && spawned instanceof Chest) {
        const dropGids = es.spawnedItemGids;
        if (Array.isArray(dropGids) && dropGids.length > 0) {
          const drops: Item[] = [];
          for (const gid of dropGids) {
            const it = itemsByGid.get(gid);
            if (it) drops.push(it);
          }
          spawned.drops = drops;
        }
      }
    }

    room.projectiles = [];
    for (const ps of rd.projectiles) {
      if (ps.kind === "wizard_fireball") {
        const parent = entitiesByGid.get(ps.parentGid);
        if (!parent) {
          return err({ kind: "MissingReference", message: `wizard_fireball parent missing gid=${ps.parentGid}` });
        }
        if (!(parent instanceof WizardEnemy)) {
          return err({ kind: "InvalidState", message: "wizard_fireball parent is not WizardEnemy" });
        }
        const proj = new WizardFireball(parent, ps.x, ps.y);
        proj.dead = ps.dead;
        proj.state = ps.state;
        if (ps.delay !== undefined) proj.delay = ps.delay;
        const gidRes = reserveAndAssignGid(
          proj,
          ps.gid,
          preReservedGids,
          assignedByGid,
          assignedGidByObj,
        );
        if (!gidRes.ok) return gidRes;
        room.projectiles.push(proj);
      }
      if (ps.kind === "enemy_spawn_animation") {
        const enemyCodec = enemyRegistryV2.get(ps.enemy.kind);
        if (!enemyCodec) continue;
        const enemy = enemyCodec.spawn(ps.enemy, room, { game });
        const egid = reserveAndAssignGid(
          enemy,
          ps.enemy.gid,
          preReservedGids,
          assignedByGid,
          assignedGidByObj,
        );
        if (!egid.ok) return egid;
        entitiesByGid.set(ps.enemy.gid, enemy);

        const anim = new EnemySpawnAnimation(room, enemy, ps.x, ps.y);
        anim.dead = ps.dead;
        const pgid = reserveAndAssignGid(
          anim,
          ps.gid,
          preReservedGids,
          assignedByGid,
          assignedGidByObj,
        );
        if (!pgid.ok) return pgid;
        room.projectiles.push(anim);
      }
    }

    room.hitwarnings = [];
    for (const hws of rd.hitWarnings) {
      const hw = new HitWarning(game, hws.x, hws.y, hws.x, hws.y);
      hw.dead = hws.dead;
      room.hitwarnings.push(hw);
    }
  }

  // De-duplicate sidepath rope-down ladders: regen + ladder remapping should produce exactly one,
  // but if we ever end up with multiple, keep the one that corresponds to a saved gid.
  const savedSideDownLadderGids = new Set<string>();
  for (const rd of save.delta.rooms) {
    for (const ts of rd.tiles) {
      if (ts.kind === "down_ladder" && ts.isSidePath && typeof ts.gid === "string") {
        savedSideDownLadderGids.add(ts.gid);
      }
    }
  }
  if (savedSideDownLadderGids.size > 0) {
    for (const r of game.rooms) {
      for (let x = r.roomX - 1; x < r.roomX + r.width + 1; x++) {
        for (let y = r.roomY - 1; y < r.roomY + r.height + 1; y++) {
          const tt = r.roomArray[x]?.[y];
          if (!(tt instanceof DownLadder)) continue;
          if (!tt.isSidePath) continue;
          // If this ladder's gid isn't in the save, it's an extra. Replace with floor.
          if (!savedSideDownLadderGids.has(tt.globalId)) {
            r.roomArray[x][y] = new Floor(r, x, y);
          }
        }
      }
    }
  }

  // Post-pass linking across rooms by saved gids.
  const doorsByGid = new Map<string, Door>();
  const insideDoorsByGid = new Map<string, InsideLevelDoor>();
  const buttonsByGid = new Map<string, Button>();
  const downByGid = new Map<string, DownLadder>();
  const upByGid = new Map<string, UpLadder>();

  for (const r of game.rooms) {
    for (let x = r.roomX - 1; x < r.roomX + r.width + 1; x++) {
      for (let y = r.roomY - 1; y < r.roomY + r.height + 1; y++) {
        const t = r.roomArray[x]?.[y];
        if (!t) continue;
        if (t instanceof Door) doorsByGid.set(t.globalId, t);
        if (t instanceof InsideLevelDoor) insideDoorsByGid.set(t.globalId, t);
        if (t instanceof Button) buttonsByGid.set(t.globalId, t);
        if (t instanceof DownLadder) downByGid.set(t.globalId, t);
        if (t instanceof UpLadder) upByGid.set(t.globalId, t);
      }
    }
  }

  for (const rd of save.delta.rooms) {
    for (const ts of rd.tiles) {
      if (ts.kind === "door") {
        const ds = ts as DoorTileSaveV2;
        if (ds.linkedDoorGid && doorsByGid.has(ds.gid) && doorsByGid.has(ds.linkedDoorGid)) {
          const a = doorsByGid.get(ds.gid) as Door;
          const b = doorsByGid.get(ds.linkedDoorGid) as Door;
          a.link(b);
          b.link(a);
        }
      }
      if (ts.kind === "button") {
        const b = buttonsByGid.get(ts.gid);
        if (b && ts.linkedDoorGid) {
          const d = insideDoorsByGid.get(ts.linkedDoorGid);
          if (d) b.linkedDoor = d;
        }
      }
      if (ts.kind === "down_ladder") {
        const dl = downByGid.get(ts.gid);
        if (dl && ts.linkedRoomGid) {
          const linkedRoom = game.roomsById.get(ts.linkedRoomGid);
          if (linkedRoom) dl.linkedRoom = linkedRoom;
        }
      }
      if (ts.kind === "up_ladder") {
        const ul = upByGid.get(ts.gid);
        if (ul && ts.linkedRoomGid) {
          const linkedRoom = game.roomsById.get(ts.linkedRoomGid);
          if (linkedRoom) ul.linkedRoom = linkedRoom;
        }
      }
    }
  }

  const restorePlayer = (id: string, ps: SaveV2["delta"]["players"][string], isLocal: boolean): Result<Player> => {
    const p = new Player(game, ps.x, ps.y, isLocal);
    p.dead = ps.dead;
    p.direction = directionKindToDirection(ps.direction);
    p.health = ps.health;
    p.maxHealth = ps.maxHealth;
    p.mana = ps.mana;
    p.maxMana = ps.maxMana;
    p.sightRadius = ps.sightRadius;

    if (ps.light) {
      p.lightEquipped = ps.light.equipped;
      p.lightColor = [ps.light.colorRgb[0], ps.light.colorRgb[1], ps.light.colorRgb[2]];
      p.lightBrightness = ps.light.brightness;
    }

    const room = game.roomsById.get(ps.roomGid);
    if (!room) {
      return err({ kind: "MissingReference", message: `Player room not found gid=${ps.roomGid}` });
    }
    p.levelID = game.rooms.indexOf(room);
    p.roomGID = room.globalId;
    p.depth = save.worldSpec.depth;

    // Inventory: restore layout + set slots by index (supported kinds only).
    p.inventory.isOpen = ps.inventory.isOpen;
    p.inventory.cols = ps.inventory.cols;
    p.inventory.rows = ps.inventory.rows;
    p.inventory.expansion = ps.inventory.expansion;
    p.inventory.selX = ps.inventory.selX;
    p.inventory.selY = ps.inventory.selY;
    p.inventory.coins = ps.inventory.coins;

    const total = (ps.inventory.rows + ps.inventory.expansion) * ps.inventory.cols;
    p.inventory.items = new Array(total).fill(null);
    p.inventory.equipAnimAmount = new Array(total).fill(0);

    const equipped: Equippable[] = [];
    for (let i = 0; i < ps.inventory.slots.length && i < total; i++) {
      const slot = ps.inventory.slots[i];
      if (!slot) continue;
      const codec = itemRegistryV2.get(slot.kind);
      if (!codec) {
        if (GameplaySettings.SAVE_V2_STRICT_KINDS) {
          return err({ kind: "InvalidState", message: `Missing Item codec for kind=${slot.kind}` });
        }
        continue;
      }
      const spawned = codec.spawn(slot, room, { game });
      spawned.pickedUp = true;
      spawned.level = room;
      spawned.player = p;
      if (spawned instanceof Equippable) {
        spawned.setWielder(p);
        if ("equipped" in slot && typeof slot.equipped === "boolean") {
          spawned.equipped = slot.equipped;
        }
        if (spawned.equipped) equipped.push(spawned);
      }
      p.inventory.items[i] = spawned;
    }

    // Apply onEquip effects for equipped items, but suppress chat spam during load.
    if (equipped.length > 0) {
      const originalPushMessage = game.pushMessage;
      game.pushMessage = (_message: string) => {};
      try {
        for (const it of equipped) {
          try {
            it.onEquip();
          } catch {
            // If an item has brittle onEquip side-effects, don't fail the entire load.
          }
        }
      } finally {
        game.pushMessage = originalPushMessage;
      }
    }
    if (ps.inventory.equippedWeaponSlot !== undefined) {
      const w = p.inventory.items[ps.inventory.equippedWeaponSlot];
      if (w instanceof Weapon) {
        p.inventory.weapon = w;
      }
    }

    return ok(p);
  };

  // Restore players (minimal): recreate players and set inventory slots for supported item kinds.
  for (const [id, ps] of Object.entries(save.delta.players)) {
    const pr = restorePlayer(id, ps, id === game.localPlayerID);
    if (pr.ok === false) return err(pr.error);
    game.players[id] = pr.value;
  }

  // Restore offlinePlayers as non-local players (no special active room selection).
  for (const [id, ps] of Object.entries(save.delta.offlinePlayers)) {
    const pr = restorePlayer(id, ps, false);
    if (pr.ok === false) return err(pr.error);
    game.offlinePlayers[id] = pr.value;
  }

  // Set active room to local player's room if present.
  const local = game.players[game.localPlayerID];
  if (local) {
    const room = game.rooms[local.levelID];
    if (room) game.room = room;
  }

  // Restore enemy AI "awake/aggro" state now that players exist.
  // Many enemies require a valid `targetPlayer` when `seenPlayer` is true.
  if (enemyAiStateByGid.size > 0) {
    const localPlayer = game.players[game.localPlayerID];
    const activePlayers = Object.values(game.players);
    for (const [gid, st] of enemyAiStateByGid.entries()) {
      const ent = entitiesByGid.get(gid);
      if (!(ent instanceof Enemy)) continue;

      const wantsSeen = st.seenPlayer === true;
      const wantsAggro = st.aggro === true;
      const needsTarget = wantsSeen || wantsAggro;

      const target = localPlayer ?? activePlayers[0];
      if (needsTarget) {
        if (!target) {
          // No players available; keep enemy asleep to avoid null target crashes.
          ent.seenPlayer = false;
          ent.aggro = false;
        } else {
          ent.targetPlayer = target;
          if (st.seenPlayer !== undefined) ent.seenPlayer = st.seenPlayer;
          if (st.aggro !== undefined) ent.aggro = st.aggro;
        }
      } else {
        if (st.seenPlayer !== undefined) ent.seenPlayer = st.seenPlayer;
        if (st.aggro !== undefined) ent.aggro = st.aggro;
      }

      if (st.heardPlayer !== undefined) ent.heardPlayer = st.heardPlayer;
    }
  }
  // Restore active path context (main vs sidepath). Game update/draw loops heavily filter by `currentPathId`.
  if (game.room && typeof game.room.pathId === "string" && game.room.pathId.length > 0) {
    game.currentPathId = game.room.pathId;
  } else {
    game.currentPathId = "main";
  }

  // Restore gameplay RNG state AFTER regeneration and object reconstruction.
  // Generation itself reseeds per depth/path; we only want to continue the run deterministically.
  Random.setState(save.worldSpec.rngState);

  // Ensure game is in a playable state post-load.
  game.levelState = LevelState.IN_LEVEL;
  game.started = true;
  game.setPlayer?.();

  // Wall info warm-up: normally done on room entry / during ticks, but on load we want
  // correct wall rendering immediately.
  // Run for all rooms we have loaded (main + sidepaths).
  for (const r of game.rooms) {
    try {
      r.calculateWallInfo();
    } catch {
      // Don't fail load on rendering precompute.
    }
  }

  // Lighting warm-up: on fresh load, we haven't gone through the normal "enter room" path,
  // so lighting buffers may remain uninitialized until the player moves.
  // Recompute which rooms are on-screen for the local player, then update lighting for the active room.
  const lp = game.players[game.localPlayerID];
  if (lp && game.room) {
    const roomsToCheck = game.room.level?.rooms ?? game.rooms;
    for (const r of roomsToCheck) {
      try {
        r.roomOnScreen(lp);
      } catch {
        // Keep load resilient; a lighting warm-up failure shouldn't block gameplay.
      }
    }
    try {
      game.room.updateLighting({ x: lp.x, y: lp.y });
    } catch {
      // Same as above: don't fail the load on lighting warm-up.
    }
  }

  return ok(undefined);
  } finally {
    game.loadingSaveV2 = false;
  }
};


