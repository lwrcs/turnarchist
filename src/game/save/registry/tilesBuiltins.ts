import { Door, DoorType } from "../../../tile/door";
import { DownLadder } from "../../../tile/downLadder";
import { UpLadder } from "../../../tile/upLadder";
import { Floor } from "../../../tile/floor";
import { SpikeTrap } from "../../../tile/spiketrap";
import { Button } from "../../../tile/button";
import { InsideLevelDoor } from "../../../tile/insideLevelDoor";
import { LockType } from "../../../tile/lockable";
import type { Tile } from "../../../tile/tile";
import { Lockable } from "../../../tile/lockable";
import type { LoadContext, SaveContext } from "../context";
import type { DoorKind, LockKind, TileSaveV2 } from "../schema";
import { directionToDirectionKind, envKindToEnvType, envTypeToEnvKind } from "../mappers";
import { tileRegistryV2 } from "./tiles";

const doorTypeToDoorKind = (t: DoorType): DoorKind => {
  switch (t) {
    case DoorType.DOOR:
      return "door";
    case DoorType.LOCKEDDOOR:
      return "locked_door";
    case DoorType.GUARDEDDOOR:
      return "guarded_door";
    case DoorType.TUNNELDOOR:
      return "tunnel_door";
  }
};

const lockTypeToLockKind = (t: LockType): LockKind => {
  switch (t) {
    case LockType.NONE:
      return "none";
    case LockType.LOCKED:
      return "locked";
    case LockType.GUARDED:
      return "guarded";
    case LockType.TUNNEL:
      return "tunnel";
  }
};

/**
 * Registers built-in tile codecs for SaveV2.
 * Idempotent: safe to call multiple times.
 */
export const registerBuiltinTileCodecsV2 = (): void => {
  if (!tileRegistryV2.has("door")) {
    tileRegistryV2.register("door", {
      save: (tile: Tile, _ctx: SaveContext): TileSaveV2 => {
        if (!(tile instanceof Door)) {
          throw new Error("door codec received non-Door tile");
        }
        return {
          kind: "door",
          gid: tile.globalId,
          x: tile.x,
          y: tile.y,
          doorType: doorTypeToDoorKind(tile.type),
          doorDir: directionToDirectionKind(tile.doorDir),
          tunnelDoor: tile.type === DoorType.TUNNELDOOR,
          opened: tile.opened,
          locked: tile.locked,
          // Door currently does not expose a stable lockable type/key API without `any`.
          // We rely on (doorType + locked) and linkage.
          lock: undefined,
          linkedDoorGid: tile.linkedDoor ? tile.linkedDoor.globalId : undefined,
        };
      },
      apply: (value: TileSaveV2, room, _ctx: LoadContext): void => {
        if (value.kind !== "door") return;
        const t = room.roomArray[value.x]?.[value.y];
        if (!(t instanceof Door)) {
          throw new Error("door codec apply: target tile is not Door");
        }
        t.opened = value.opened;
        t.locked = value.locked;
        // We intentionally do not attempt to mutate DoorType or doorDir here yet; those are generation invariants.
      },
    });
  }

  if (!tileRegistryV2.has("inside_level_door")) {
    tileRegistryV2.register("inside_level_door", {
      save: (tile: Tile, _ctx: SaveContext): TileSaveV2 => {
        if (!(tile instanceof InsideLevelDoor)) {
          throw new Error("inside_level_door codec received non-InsideLevelDoor tile");
        }
        return {
          kind: "inside_level_door",
          gid: tile.globalId,
          x: tile.x,
          y: tile.y,
          opened: tile.opened,
        };
      },
      apply: (value: TileSaveV2, room, _ctx: LoadContext): void => {
        if (value.kind !== "inside_level_door") return;
        const t = room.roomArray[value.x]?.[value.y];
        if (!(t instanceof InsideLevelDoor)) {
          throw new Error("inside_level_door codec apply: target tile is not InsideLevelDoor");
        }
        t.opened = value.opened;
      },
    });
  }

  if (!tileRegistryV2.has("button")) {
    tileRegistryV2.register("button", {
      save: (tile: Tile, _ctx: SaveContext): TileSaveV2 => {
        if (!(tile instanceof Button)) {
          throw new Error("button codec received non-Button tile");
        }
        return {
          kind: "button",
          gid: tile.globalId,
          x: tile.x,
          y: tile.y,
          linkedDoorGid: tile.linkedDoor ? tile.linkedDoor.globalId : undefined,
        };
      },
      apply: (_value: TileSaveV2, _room, _ctx: LoadContext): void => {
        // Link resolution for buttons happens in a post-pass in loadSaveV2.
      },
    });
  }

  if (!tileRegistryV2.has("down_ladder")) {
    tileRegistryV2.register("down_ladder", {
      save: (tile: Tile, _ctx: SaveContext): TileSaveV2 => {
        if (!(tile instanceof DownLadder)) {
          throw new Error("down_ladder codec received non-DownLadder tile");
        }
        const lockType = tile.lockable.getLockType();
        const lockKind = lockTypeToLockKind(lockType);
        // IMPORTANT: even when unlocked, retain the stable keyId so load can restore it faithfully.
        // Sidepath ladders need it for deterministic re-association; non-sidepath ladders need it so
        // that a previously-locked ladder (now unlocked) round-trips with keyID intact.
        const lock: { lockType: LockKind; keyId: number } | undefined = (() => {
          if (lockKind !== "none") return { lockType: lockKind, keyId: tile.lockable.keyID };
          if (tile.lockable.keyID !== 0) return { lockType: "none", keyId: tile.lockable.keyID };
          return undefined;
        })();
        const opts = tile.opts;
        const optsSave =
          opts === undefined
            ? undefined
            : {
                caveRooms: typeof opts.caveRooms === "number" ? opts.caveRooms : undefined,
                mapWidth: typeof opts.mapWidth === "number" ? opts.mapWidth : undefined,
                mapHeight: typeof opts.mapHeight === "number" ? opts.mapHeight : undefined,
                locked: typeof opts.locked === "boolean" ? opts.locked : undefined,
                envType: opts.envType ? envTypeToEnvKind(opts.envType) : undefined,
                linearity: typeof opts.linearity === "number" ? opts.linearity : undefined,
                branching: typeof opts.branching === "number" ? opts.branching : undefined,
                loopiness: typeof opts.loopiness === "number" ? opts.loopiness : undefined,
                giantCentralRoom:
                  typeof opts.giantCentralRoom === "boolean" ? opts.giantCentralRoom : undefined,
                giantRoomScale: typeof opts.giantRoomScale === "number" ? opts.giantRoomScale : undefined,
                organicTunnelsAvoidCenter:
                  typeof opts.organicTunnelsAvoidCenter === "boolean"
                    ? opts.organicTunnelsAvoidCenter
                    : undefined,
                softMargin: typeof opts.softMargin === "number" ? opts.softMargin : undefined,
                keyInMainRoom: typeof opts.keyInMainRoom === "boolean" ? opts.keyInMainRoom : undefined,
                entranceInMainRoom:
                  typeof opts.entranceInMainRoom === "boolean" ? opts.entranceInMainRoom : undefined,
                exitInMainRoom: typeof opts.exitInMainRoom === "boolean" ? opts.exitInMainRoom : undefined,
                xySymmetry: typeof opts.xySymmetry === "boolean" ? opts.xySymmetry : undefined,
                xySymmetryCenterVoidHalfSize:
                  typeof opts.xySymmetryCenterVoidHalfSize === "number"
                    ? opts.xySymmetryCenterVoidHalfSize
                    : undefined,
                xySymmetryArmHalfThickness:
                  typeof opts.xySymmetryArmHalfThickness === "number"
                    ? opts.xySymmetryArmHalfThickness
                    : undefined,
                xySymmetryCentralRoomSize:
                  typeof opts.xySymmetryCentralRoomSize === "number"
                    ? opts.xySymmetryCentralRoomSize
                    : undefined,
                terminal: typeof opts.terminal === "boolean" ? opts.terminal : undefined,
                noBoss: typeof opts.noBoss === "boolean" ? opts.noBoss : undefined,
                peaceful: typeof opts.peaceful === "boolean" ? opts.peaceful : undefined,
                tunnelRadiusScale:
                  typeof opts.tunnelRadiusScale === "number" ? opts.tunnelRadiusScale : undefined,
                squareBrush: typeof opts.squareBrush === "boolean" ? opts.squareBrush : undefined,
                angularMaze: typeof opts.angularMaze === "boolean" ? opts.angularMaze : undefined,
                tunnelMinRadius:
                  typeof opts.tunnelMinRadius === "number" ? opts.tunnelMinRadius : undefined,
                tunnelMaxRadius:
                  typeof opts.tunnelMaxRadius === "number" ? opts.tunnelMaxRadius : undefined,
                maxNodeRadius:
                  typeof opts.maxNodeRadius === "number" ? opts.maxNodeRadius : undefined,
                minNodeSeparation:
                  typeof opts.minNodeSeparation === "number" ? opts.minNodeSeparation : undefined,
                nodeCountTable: Array.isArray(opts.nodeCountTable) ? opts.nodeCountTable : undefined,
                enemyDensityScale:
                  typeof opts.enemyDensityScale === "number" ? opts.enemyDensityScale : undefined,
              };
        return {
          kind: "down_ladder",
          gid: tile.globalId,
          x: tile.x,
          y: tile.y,
          isSidePath: tile.isSidePath,
          environment: envTypeToEnvKind(tile.environment),
          opts: optsSave,
          lock,
          linkedRoomGid: tile.linkedRoom ? tile.linkedRoom.globalId : undefined,
        };
      },
      apply: (value: TileSaveV2, room, ctx: LoadContext): void => {
        if (value.kind !== "down_ladder") return;
        const t = room.roomArray[value.x]?.[value.y];
        if (!(t instanceof DownLadder)) {
          throw new Error("down_ladder codec apply: target tile is not DownLadder");
        }
        t.isSidePath = value.isSidePath;
        if (value.opts) {
          t.opts = {
            caveRooms: value.opts.caveRooms,
            mapWidth: value.opts.mapWidth,
            mapHeight: value.opts.mapHeight,
            locked: value.opts.locked,
            envType: value.opts.envType ? envKindToEnvType(value.opts.envType) : undefined,
            linearity: value.opts.linearity,
            branching: value.opts.branching,
            loopiness: value.opts.loopiness,
            giantCentralRoom: value.opts.giantCentralRoom,
            giantRoomScale: value.opts.giantRoomScale,
            organicTunnelsAvoidCenter: value.opts.organicTunnelsAvoidCenter,
            softMargin: value.opts.softMargin,
            keyInMainRoom: value.opts.keyInMainRoom,
            entranceInMainRoom: value.opts.entranceInMainRoom,
            exitInMainRoom: value.opts.exitInMainRoom,
            xySymmetry: value.opts.xySymmetry,
            xySymmetryCenterVoidHalfSize: value.opts.xySymmetryCenterVoidHalfSize,
            xySymmetryArmHalfThickness: value.opts.xySymmetryArmHalfThickness,
            xySymmetryCentralRoomSize: value.opts.xySymmetryCentralRoomSize,
            terminal: value.opts.terminal,
            noBoss: value.opts.noBoss,
            peaceful: value.opts.peaceful,
            tunnelRadiusScale: value.opts.tunnelRadiusScale,
            squareBrush: value.opts.squareBrush,
            angularMaze: value.opts.angularMaze,
            tunnelMinRadius: value.opts.tunnelMinRadius,
            tunnelMaxRadius: value.opts.tunnelMaxRadius,
            maxNodeRadius: value.opts.maxNodeRadius,
            minNodeSeparation: value.opts.minNodeSeparation,
            nodeCountTable: value.opts.nodeCountTable,
            enemyDensityScale: value.opts.enemyDensityScale,
          };
        }
        // Always rebuild lockable from saved state (including the unlocked/no-lock case),
        // otherwise a generated locked ladder can incorrectly remain locked after load.
        const lockType: LockType =
          value.lock === undefined
            ? LockType.NONE
            : value.lock.lockType === "none"
              ? LockType.NONE
              : value.lock.lockType === "locked"
                ? LockType.LOCKED
                : value.lock.lockType === "guarded"
                  ? LockType.GUARDED
                  : LockType.TUNNEL;
        const keyID = value.lock?.keyId;
        t.lockable = new Lockable(ctx.game, { lockType, keyID, isTopDoor: false });
        // linkedRoom linking happens in post-pass by gid
      },
    });
  }

  if (!tileRegistryV2.has("up_ladder")) {
    tileRegistryV2.register("up_ladder", {
      save: (tile: Tile, _ctx: SaveContext): TileSaveV2 => {
        if (!(tile instanceof UpLadder)) {
          throw new Error("up_ladder codec received non-UpLadder tile");
        }
        const lockType = tile.lockable.getLockType();
        const lockKind = lockTypeToLockKind(lockType);
        const lock: { lockType: LockKind; keyId?: number; lockedMessage?: string } | undefined =
          lockKind !== "none"
            ? {
                lockType: lockKind,
                keyId: tile.lockable.keyID !== 0 ? tile.lockable.keyID : undefined,
                lockedMessage: tile.lockable.lockedMessage ?? undefined,
              }
            : undefined;
        return {
          kind: "up_ladder",
          gid: tile.globalId,
          x: tile.x,
          y: tile.y,
          isRope: tile.isRope === true,
          returnToRoot: tile.returnToRoot === true,
          linkedRoomGid: tile.linkedRoom ? tile.linkedRoom.globalId : undefined,
          lock,
        };
      },
      apply: (value: TileSaveV2, room, ctx: LoadContext): void => {
        if (value.kind !== "up_ladder") return;
        let t = room.roomArray[value.x]?.[value.y];
        // If the tile at the saved position is an UpLadder but has the wrong returnToRoot
        // (two UpLadders in the same room swapped positions), prefer the correct one.
        if (t instanceof UpLadder && t.returnToRoot !== (value.returnToRoot === true)) {
          const wantRTR = value.returnToRoot === true;
          outerRTR: for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
            for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
              if (x === value.x && y === value.y) continue;
              const candidate = room.roomArray[x]?.[y];
              if (candidate instanceof UpLadder && candidate.returnToRoot === wantRTR) {
                t = candidate;
                break outerRTR;
              }
            }
          }
        }
        if (!(t instanceof UpLadder)) {
          // Generation placed the UpLadder at a different position (non-deterministic
          // relocation during cave population). Scan the room for it and move it.
          // Prefer an UpLadder with matching returnToRoot when multiple exist.
          const wantRTR = value.returnToRoot === true;
          let found: UpLadder | null = null;
          let foundX = 0;
          let foundY = 0;
          // First pass: prefer returnToRoot-matching
          outerPref: for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
            for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
              const candidate = room.roomArray[x]?.[y];
              if (candidate instanceof UpLadder && candidate.returnToRoot === wantRTR) {
                found = candidate;
                foundX = x;
                foundY = y;
                break outerPref;
              }
            }
          }
          // Second pass: any UpLadder as fallback
          if (!found) {
            outerAny: for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
              for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
                const candidate = room.roomArray[x]?.[y];
                if (candidate instanceof UpLadder) {
                  found = candidate;
                  foundX = x;
                  foundY = y;
                  break outerAny;
                }
              }
            }
          }
          if (!found) {
            throw new Error(
              `up_ladder codec apply: no UpLadder found in room (expected at ${value.x},${value.y})`,
            );
          }
          // Relocate: put a Floor where it was, move UpLadder to saved position.
          room.roomArray[foundX][foundY] = new Floor(room, foundX, foundY);
          found.x = value.x;
          found.y = value.y;
          room.roomArray[value.x][value.y] = found;
          t = found;
        }
        const ladder = t as UpLadder;
        ladder.isRope = value.isRope;
        ladder.returnToRoot = value.returnToRoot === true;
        // Rope-up ladders are sidepath ladders; keep this consistent for linkage logic.
        ladder.isSidePath = value.isRope === true;
        // Always rebuild lockable from saved state (including the unlocked/no-lock case).
        // sidePathManager may re-lock the rope during level regeneration; the save wins.
        {
          const lockType: LockType =
            value.lock === undefined
              ? LockType.NONE
              : value.lock.lockType === "locked"
                ? LockType.LOCKED
                : value.lock.lockType === "guarded"
                  ? LockType.GUARDED
                  : value.lock.lockType === "tunnel"
                    ? LockType.TUNNEL
                    : LockType.NONE;
          const keyID = value.lock?.keyId;
          ladder.lockable = new Lockable(ctx.game, { lockType, keyID, isTopDoor: true });
          if (value.lock?.lockedMessage) ladder.lockable.lockedMessage = value.lock.lockedMessage;
        }
        // linkedRoom linking happens in post-pass by gid
      },
    });
  }

  if (!tileRegistryV2.has("spike_trap")) {
    tileRegistryV2.register("spike_trap", {
      save: (tile: Tile, _ctx: SaveContext): TileSaveV2 => {
        if (!(tile instanceof SpikeTrap)) {
          throw new Error("spike_trap codec received non-SpikeTrap tile");
        }
        return {
          kind: "spike_trap",
          x: tile.x,
          y: tile.y,
          triggered: tile.on,
          tickCount: tile.tickCount,
        };
      },
      apply: (value: TileSaveV2, room, _ctx: LoadContext): void => {
        if (value.kind !== "spike_trap") return;
        const t = room.roomArray[value.x]?.[value.y];
        if (!(t instanceof SpikeTrap)) return;
        t.on = value.triggered;
        t.tickCount = value.tickCount;
      },
    });
  }
};


