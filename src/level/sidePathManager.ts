import type { Game } from "../game";
import type { Room } from "../room/room";
import { UpLadder } from "../tile/upLadder";
import type { DownLadder } from "../tile/downLadder";
import { statsTracker } from "../game/stats";

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
    if (downLadder.isSidePath) {
      this.handleSidePathRooms(linkedRoom);
    }

    downLadder.linkedRoom = linkedRoom;
    this.linkUpLadders(downLadder);
  }

  /**
   * Merge rooms belonging to the newly created sidepath's mapGroup into the generated level.
   */
  private handleSidePathRooms(linkedRoom: Room): void {
    const level = linkedRoom.level;
    const sidePathRooms = this.game.rooms.filter(
      (room) => room.mapGroup === linkedRoom.mapGroup,
    );
    const startingId = level.rooms.length;
    sidePathRooms.forEach((room, index) => {
      room.id = startingId + index;
      level.rooms.push(room);
    });
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
                  x: (tile as any).x,
                  y: (tile as any).y,
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
            return;
          }
        }
      }
    }
  }

  private setUpLadderLink(downLadder: DownLadder, upLadder: UpLadder): void {
    if (downLadder.isSidePath) {
      upLadder.linkedRoom = downLadder.room;
      (upLadder as any).isRope = true;
      // Record the exact parent down-ladder tile to spawn on when going back up
      (upLadder as any).exitDownLadderPos = {
        x: downLadder.x,
        y: downLadder.y,
      };
    } else {
      upLadder.linkedRoom = this.game.levels[downLadder.room.depth].exitRoom;
    }
  }
}
