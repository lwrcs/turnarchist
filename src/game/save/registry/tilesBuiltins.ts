import { Door, DoorType } from "../../../tile/door";
import { DownLadder } from "../../../tile/downLadder";
import { UpLadder } from "../../../tile/upLadder";
import { Button } from "../../../tile/button";
import { InsideLevelDoor } from "../../../tile/insideLevelDoor";
import { LockType } from "../../../tile/lockable";
import type { Tile } from "../../../tile/tile";
import { Lockable } from "../../../tile/lockable";
import type { LoadContext, SaveContext } from "../context";
import type { DoorKind, LockKind, TileSaveV2 } from "../schema";
import { directionToDirectionKind, envTypeToEnvKind } from "../mappers";
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
        const lock =
          lockKind === "none"
            ? undefined
            : { lockType: lockKind, keyId: tile.lockable.keyID };
        return {
          kind: "down_ladder",
          gid: tile.globalId,
          x: tile.x,
          y: tile.y,
          isSidePath: tile.isSidePath,
          environment: envTypeToEnvKind(tile.environment),
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
        if (value.lock) {
          // Rebuild lockable from saved state.
          const lockType: LockType =
            value.lock.lockType === "none"
              ? LockType.NONE
              : value.lock.lockType === "locked"
                ? LockType.LOCKED
                : value.lock.lockType === "guarded"
                  ? LockType.GUARDED
                  : LockType.TUNNEL;
          t.lockable = new Lockable(ctx.game, { lockType, keyID: value.lock.keyId, isTopDoor: false });
        }
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
        return {
          kind: "up_ladder",
          gid: tile.globalId,
          x: tile.x,
          y: tile.y,
          isRope: tile.isRope === true,
          linkedRoomGid: tile.linkedRoom ? tile.linkedRoom.globalId : undefined,
        };
      },
      apply: (value: TileSaveV2, room, _ctx: LoadContext): void => {
        if (value.kind !== "up_ladder") return;
        const t = room.roomArray[value.x]?.[value.y];
        if (!(t instanceof UpLadder)) {
          throw new Error("up_ladder codec apply: target tile is not UpLadder");
        }
        t.isRope = value.isRope;
        // linkedRoom linking happens in post-pass by gid
      },
    });
  }
};


