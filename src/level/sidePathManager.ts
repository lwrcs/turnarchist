import type { Game } from "../game";
import { type Room, RoomType } from "../room/room";
import { UpLadder } from "../tile/upLadder";
import { DownLadder } from "../tile/downLadder";
import { statsTracker } from "../game/stats";
import { EnvType } from "../constants/environmentTypes";
import { GameplaySettings } from "../game/gameplaySettings";
import { Key } from "../item/key";
import { Lockable, LockType } from "../tile/lockable";
import type { Level } from "./level";

export interface SidePathOptions {
  caveRooms?: number;
  mapWidth?: number;
  mapHeight?: number;
  locked?: boolean;
  envType?: EnvType;
  /**
   * If true, enforce X+Y symmetry for cave/sidepath partition layouts by keeping one quadrant
   * and mirroring it across both axes before connectivity is generated.
   */
  xySymmetry?: boolean;
  /** Half-size (in tiles) of the empty central "courtyard" to preserve after mirroring. */
  xySymmetryCenterVoidHalfSize?: number;
  /** Half-thickness (in tiles) of the preferred plus-shaped arms near the center axes. */
  xySymmetryArmHalfThickness?: number;
  /**
   * When set (odd integer >= 3), a square boss room of this size is placed at the center
   * of the mirrored layout. The axis lines are offset to create space with proper 1-tile
   * BSP gaps. Ignored when xySymmetry is false.
   */
  xySymmetryCentralRoomSize?: number;
  linearity?: number;
  branching?: number; // 0..1 probability of adding a second branch door
  loopiness?: number; // 0..1 scale for number of loop connections
  giantCentralRoom?: boolean; // enable giant central room layout
  giantRoomScale?: number; // 0..1 fraction of width/height for central room size (default ~0.65)
  organicTunnelsAvoidCenter?: boolean; // favor perimeter-biased tunnel routing
  /**
   * Soft margin (in tiles) used by single-room sidepath maze carving and endpoint placement.
   * Higher values keep tunnels/targets farther from the outer walls (reduces flat wall reveals).
   */
  softMargin?: number;
  /** If true, place the key inside the main room (not in a dedicated satellite room). */
  keyInMainRoom?: boolean;
  /** If true, place the rope entrance (UpLadder) inside the main room. */
  entranceInMainRoom?: boolean;
  /** If true, place the exit (DownLadder) inside the main room (not in a dedicated satellite room). */
  exitInMainRoom?: boolean;
  /**
   * If true, this sidepath level has no exit downladder to a further layer.
   * Suppresses the env-driven sidepath spec that would normally chain to the next environment.
   */
  terminal?: boolean;
  /** If true, skip boss spawning in this sidepath level. */
  noBoss?: boolean;
  /** If true, no enemies spawn in this sidepath level. */
  peaceful?: boolean;
  /**
   * Scale factor for tunnel carve radius in single-room sidepath mazes.
   * 1.0 = default width; 0.5 = half-width tunnels. Applies to tunnel body,
   * node chambers, and side pockets.
   */
  tunnelRadiusScale?: number;
  /**
   * If true, the maze tunnel carver uses a square (Chebyshev) brush instead of
   * a circular one. Produces blocky, rectilinear-feeling corridors.
   */
  squareBrush?: boolean;
  /** If true, the maze tunnel network uses L-shaped (angular) paths instead of wormy ones. */
  angularMaze?: boolean;
  /**
   * Multiplier applied to enemy counts in this sidepath level.
   * 1.0 = default density; 0.2 = one-fifth as many enemies.
   */
  enemyDensityScale?: number;
}

/** Env types that use the castle sidepath structure (PNG levels, boss room, key in exit). */
export const CASTLE_LIKE_ENV_TYPES: ReadonlySet<EnvType> = new Set([
  EnvType.CASTLE,
  EnvType.DARK_CASTLE,
]);

/**
 * Canonical options for CASTLE sidepaths.
 * Keep this centralized so environment-driven generation and debug/test entry points
 * (e.g. `/new castle`) stay in sync.
 */
/** Base castle-structure options shared by CASTLE and DARK_CASTLE sidepaths. */
function baseCastleOptions(
  envType: EnvType,
  overrides?: Partial<SidePathOptions>,
): SidePathOptions {
  return {
    caveRooms: 12,
    locked: true,
    xySymmetry: true,
    xySymmetryCenterVoidHalfSize: 6,
    xySymmetryArmHalfThickness: 2,
    xySymmetryCentralRoomSize: 9,
    linearity: 0.8,
    entranceInMainRoom: false,
    keyInMainRoom: false,
    exitInMainRoom: false,
    organicTunnelsAvoidCenter: false,
    mapWidth: 30,
    mapHeight: 30,
    ...(overrides ?? {}),
    envType,
  };
}

export function createCastleSidePathOptions(
  overrides?: Partial<SidePathOptions>,
): SidePathOptions {
  return baseCastleOptions(EnvType.CASTLE, overrides);
}

export function createDarkCastleSidePathOptions(
  overrides?: Partial<SidePathOptions>,
): SidePathOptions {
  return baseCastleOptions(EnvType.DARK_CASTLE, overrides);
}

/**
 * Centralized manager for creating and wiring up sidepaths (rope caves).
 *
 * Responsibilities:
 * - Deterministic pathId creation per down-ladder coordinate
 * - Invoke level generation for sidepaths and receive the linked room
 * - Merge newly generated sidepath rooms into the level
 * - Link all up-ladders in the sidepath back to the correct parent room/ladder
 * - Provide helpers to switch current active path before transitioning
 */
export class SidePathManager {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  /**
   * Generate the sidepath for a given `DownLadder` if it doesn't already exist.
   * Populates `downLadder.linkedRoom` and links up-ladders appropriately.
   */
  async generateFor(downLadder: DownLadder): Promise<void> {
    if (downLadder.linkedRoom) return;

    const targetDepth = downLadder.room.depth + (downLadder.isSidePath ? 0 : 1);
    const pathId = this.getDeterministicPathId(downLadder);

    await this.game.levelgen.generate(
      this.game,
      targetDepth,
      downLadder.isSidePath,
      (linkedRoom) => this.handleLinkedRoom(downLadder, linkedRoom),
      downLadder.environment,
      false,
      pathId,
      downLadder.opts,
    );

    statsTracker.recordSidePathEntered({
      depth: this.game.currentDepth,
      sidePath: downLadder.linkedRoom.envType,
    });
  }

  /**
   * Switches the active path to the sidepath associated with this down ladder
   * (to ensure subsequent transitions and spawns align with the right path).
   */
  switchToPathBeforeTransition(downLadder: DownLadder): void {
    if (downLadder.isSidePath && downLadder.linkedRoom) {
      (this.game as any).currentPathId =
        (downLadder.linkedRoom as any).pathId ||
        (this.game as any).currentPathId ||
        "main";
    }
  }

  private getDeterministicPathId(d: DownLadder): string {
    if (!d.isSidePath) return "main";
    const parentPid: string = (this.game as any).currentPathId || "main";
    const roomAnchor = `${d.room.depth}:${d.room.roomX},${d.room.roomY}`;
    const tileAnchor = `${d.x},${d.y}`;
    const coordPid = `sp:${parentPid}:${roomAnchor}:${tileAnchor}`;
    const legacyGid: string =
      ((d as any).globalId as string) ||
      `${(d.room as any).globalId}:${d.x},${d.y}`;
    // Prefer coordinate-based pid; fall back to legacy GID-based for old saves
    return coordPid || legacyGid || "main";
  }

  private handleLinkedRoom(downLadder: DownLadder, linkedRoom: Room): void {
    downLadder.linkedRoom = linkedRoom;
    this.linkUpLadders(downLadder);
    this.maybePlaceMainPathKeyInCastleExitRoom(downLadder, linkedRoom);
  }

  /**
   * Legacy: previously sidepath generation relied on `game.rooms` as a global container and then
   * merged into a level. Sidepaths now carry their own `Level.rooms` list directly, so no merge is
   * needed (and merging would duplicate rooms).
   */
  private handleSidePathRooms(linkedRoom: Room): void {
    return;
  }

  /**
   * For sidepaths, ensure ALL up ladders in this sidepath mapGroup link back to the correct parent room.
   * For main path, link the first up ladder in the generated room.
   */
  private linkUpLadders(downLadder: DownLadder): void {
    if (!downLadder.linkedRoom) return;

    if (downLadder.isSidePath) {
      const level = downLadder.linkedRoom.level;
      const groupId = downLadder.linkedRoom.mapGroup;
      const groupRooms = level.rooms.filter((r) => r.mapGroup === groupId);
      for (const room of groupRooms) {
        for (let x = room.roomX; x < room.roomX + room.width; x++) {
          for (let y = room.roomY; y < room.roomY + room.height; y++) {
            const tile = room.roomArray[x]?.[y];
            if (tile instanceof UpLadder) {
              this.setUpLadderLink(downLadder, tile as UpLadder);
              if (
                !downLadder.entryUpLadderPos &&
                room === downLadder.linkedRoom
              ) {
                downLadder.entryUpLadderPos = {
                  x: tile.x,
                  y: tile.y,
                };
              }
            }
          }
        }
      }
    } else {
      // Non-sidepath: link the first up ladder in the generated room
      for (
        let x = downLadder.linkedRoom.roomX;
        x < downLadder.linkedRoom.roomX + downLadder.linkedRoom.width;
        x++
      ) {
        for (
          let y = downLadder.linkedRoom.roomY;
          y < downLadder.linkedRoom.roomY + downLadder.linkedRoom.height;
          y++
        ) {
          const tile = downLadder.linkedRoom.roomArray[x]?.[y];
          if (tile instanceof UpLadder) {
            this.setUpLadderLink(downLadder, tile as UpLadder);
            downLadder.entryUpLadderPos = {
              x: tile.x,
              y: tile.y,
            };
            return;
          }
        }
      }
    }
  }

  private setUpLadderLink(downLadder: DownLadder, upLadder: UpLadder): void {
    if (downLadder.isSidePath) {
      upLadder.isRope = true;
      upLadder.isSidePath = true;

      // Default: link back to the immediate parent room / ladder used to enter this sidepath
      let targetRoom: Room = downLadder.room;
      let targetPos: { x: number; y: number } = {
        x: downLadder.x,
        y: downLadder.y,
      };

      // Special case: a "root return" rope-up ladder should go back to the main-path
      // sidepath entry ladder (e.g., CASTLE sidepath returns to the FOREST entry on main).
      if (upLadder.returnToRoot) {
        const parentPid = downLadder.room?.pathId;
        const parsed = this.tryParseRootSidePathAnchor(parentPid);
        if (parsed) {
          const level = this.game.levels[parsed.depth];
          if (level) {
            const room = level.rooms.find(
              (r) => r.roomX === parsed.roomX && r.roomY === parsed.roomY,
            );
            if (room) {
              targetRoom = room;
              targetPos = { x: parsed.tileX, y: parsed.tileY };
            }
          }
        }
      }

      upLadder.linkedRoom = targetRoom;
      // Record the exact parent down-ladder tile to spawn on when going back up
      upLadder.exitDownLadderPos = targetPos;
    } else {
      upLadder.linkedRoom = this.game.levels[downLadder.room.depth].exitRoom;
    }
  }

  private maybePlaceMainPathKeyInCastleExitRoom(
    downLadder: DownLadder,
    linkedRoom: Room,
  ): void {
    if (GameplaySettings.MAIN_PATH_KEY_REQUIRED !== true) return;
    const sideLevel = linkedRoom.level;
    if (!sideLevel || !CASTLE_LIKE_ENV_TYPES.has(sideLevel.environment.type))
      return;

    const mainLevel = this.game.levels[downLadder.room.depth];
    const mainDownLadder = mainLevel
      ? this.findMainPathDownLadder(mainLevel)
      : null;
    if (!mainDownLadder) return;
    // Only place a key for locked main-path down ladders.
    if (mainDownLadder.lockable?.isLocked?.() !== true) return;

    const exitRoom = this.findCastleExitRoom(sideLevel);
    if (!exitRoom) return;

    const existing = exitRoom.items.find(
      (it) => it instanceof Key && it.doorID === mainDownLadder.lockable.keyID,
    );
    if (existing) return;

    const tiles = exitRoom.getEmptyTilesNotBlockingDoors();
    const pos = exitRoom.getRandomEmptyPosition(tiles);
    if (!pos) return;

    const key = new Key(exitRoom, pos.x, pos.y);
    if (mainDownLadder.lockable.keyID > 0) {
      key.doorID = mainDownLadder.lockable.keyID;
    } else {
      mainDownLadder.lockable.setKey(key);
    }
    exitRoom.items.push(key);

    // Lock the rope-up ladder in the exit room so the player can't leave
    // without picking up the key first. Picking up the key auto-unlocks it.
    const ropeUp = this.findReturnToRootLadder(exitRoom);
    if (ropeUp) {
      const ropeKeyID = Lockable.generateID();
      ropeUp.lockable.keyID = ropeKeyID;
      ropeUp.lockable.lock();
      ropeUp.lockable.lockedMessage = "Grab the key first!";
      key.onPickupCallback = () => {
        ropeUp.lockable.removeLock();
        ropeUp.lockable.removeLockIcon();
      };
    }
  }

  private findReturnToRootLadder(room: Room): UpLadder | null {
    for (let x = room.roomX; x < room.roomX + room.width; x++) {
      for (let y = room.roomY; y < room.roomY + room.height; y++) {
        const t = room.roomArray[x]?.[y];
        if (t instanceof UpLadder && t.returnToRoot) return t;
      }
    }
    return null;
  }

  /**
   * Finds the castle exit room using the same logic as the roomPopulator:
   * PNG castles use the designer-placed DOWNLADDER room; procedural castles
   * use the boss-neighbor furthest from the down ladder (entry); final fallback
   * is getFurthestFromLadder("down").
   */
  private findCastleExitRoom(sideLevel: Level): Room | null {
    const isPng = sideLevel.genSource === "png";
    if (isPng) {
      const dlRoom = sideLevel.rooms.find(
        (r) => r.type === RoomType.DOWNLADDER,
      );
      if (dlRoom) return dlRoom;
    }

    const bossRoom =
      sideLevel.rooms.find((r) => r.type === RoomType.BOSS) ?? null;
    if (bossRoom && bossRoom.doors.length > 0) {
      const neighbors = bossRoom.doors
        .map((d) => d.linkedDoor?.room)
        .filter(
          (r): r is Room =>
            r !== undefined &&
            r !== null &&
            r !== bossRoom &&
            r.type !== RoomType.ROPECAVE,
        );
      if (neighbors.length > 0) {
        return neighbors.reduce((best, r) => {
          const bd = best.getDistanceToNearestLadder("down") ?? -Infinity;
          const rd = r.getDistanceToNearestLadder("down") ?? -Infinity;
          return rd > bd ? r : best;
        });
      }
    }

    return sideLevel.getFurthestFromLadder("down");
  }

  private findMainPathDownLadder(level: Level): DownLadder | null {
    for (const room of level.rooms) {
      for (let x = room.roomX; x < room.roomX + room.width; x++) {
        for (let y = room.roomY; y < room.roomY + room.height; y++) {
          const t = room.roomArray[x]?.[y];
          if (t instanceof DownLadder && t.isSidePath !== true) return t;
        }
      }
    }
    return null;
  }

  /**
   * Extract the root sidepath entry anchor from a first-level sidepath pid.
   * Expected format: sp:main:<depth>:<roomX>,<roomY>:<tileX>,<tileY>
   */
  private tryParseRootSidePathAnchor(pid: string | undefined): {
    depth: number;
    roomX: number;
    roomY: number;
    tileX: number;
    tileY: number;
  } | null {
    if (!pid) return null;
    // Only support the first-level sidepath form (parent pid is "main").
    // Nested sidepaths have a more complex pid and should not root-return via parsing.
    const m = /^sp:main:(\d+):(-?\d+),(-?\d+):(-?\d+),(-?\d+)$/.exec(pid);
    if (!m) return null;
    const depth = Number(m[1]);
    const roomX = Number(m[2]);
    const roomY = Number(m[3]);
    const tileX = Number(m[4]);
    const tileY = Number(m[5]);
    if (
      !Number.isFinite(depth) ||
      !Number.isFinite(roomX) ||
      !Number.isFinite(roomY) ||
      !Number.isFinite(tileX) ||
      !Number.isFinite(tileY)
    ) {
      return null;
    }
    return { depth, roomX, roomY, tileX, tileY };
  }
}
