import { Player } from "../player/player";
import { Game } from "../game";
import { Room } from "../room/room";
import { GameConstants } from "../game/gameConstants";
import { SkinType, Tile } from "./tile";
import { DownLadder } from "./downLadder";
import { Sound } from "../sound/sound";
import { Lockable, LockType } from "./lockable";
import { Passageway } from "./passageway";

export class UpLadder extends Passageway {
  linkedRoom: Room;
  isRope = false;
  depth: number;
  lockable: Lockable;

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    lockType: LockType = LockType.NONE,
  ) {
    super(room, game, x, y);
    this.depth = room.depth;

    // Initialize lockable with default config
    this.lockable = new Lockable(game, {
      lockType: lockType,
      isTopDoor: true,
    });
  }

  onCollide = (player: Player) => {
    if (!this.game) {
      console.error("Game instance is undefined in UpLadder:", this);
      return;
    }

    // Check if locked
    if (this.lockable.isLocked()) {
      if (this.lockable.canUnlock(player)) {
        this.lockable.unlock(player);
      }
      return;
    }

    try {
      if (!this.linkedRoom) {
        this.linkRoom();
      }
      // If this is a rope (sidepath) exit, switch active path back to the linked room's path
      if (this.isRope && this.linkedRoom) {
        (this.game as any).currentPathId = this.linkedRoom.pathId || "main";
      }
      this.game.changeLevelThroughLadder(player, this);
      Sound.forestMusic.pause();
      Sound.caveMusic.pause();
    } catch (error) {
      console.error("Error during changeLevelThroughLadder:", error);
    }
  };

  getName = () => {
    return this.isRope ? "rope up" : "staircase up";
  };

  linkRoom = () => {
    // For sidepaths (rope), link back to the room that contains the DownLadder
    if (this.isRope && !this.linkedRoom) {
      const level = this.game.levels[this.depth];
      if (level) {
        // Prefer any room in an earlier mapGroup that contains a sidepath DownLadder
        for (const candidate of level.rooms) {
          if (candidate.mapGroup < this.room.mapGroup) {
            for (
              let x = candidate.roomX;
              x < candidate.roomX + candidate.width;
              x++
            ) {
              for (
                let y = candidate.roomY;
                y < candidate.roomY + candidate.height;
                y++
              ) {
                const t = candidate.roomArray[x]?.[y];
                if (t instanceof DownLadder && t.isSidePath) {
                  this.linkedRoom = candidate;
                  t.linkedRoom = this.room;
                  return;
                }
              }
            }
          }
        }
        // Fallback: link to level start if not found
        // Prefer stable map lookup when available
        const anyRoom = (level as any).roomsById
          ? (level as any).roomsById.values().next().value
          : level.rooms[0];
        this.linkedRoom = level.startRoom || anyRoom;
        return;
      }
    }
    // Main path: link to previous depth exit
    if (this.depth - 1 >= 0 && this.game.levels[this.depth - 1]) {
      this.linkedRoom = this.game.levels[this.depth - 1].exitRoom;
    }
  };

  draw = (delta: number) => {
    let xx = 29;
    let yy = 0;
    if (this.isRope) {
      xx = 16;
      yy = 1;
    }

    Game.drawTile(
      1,
      this.skin,
      1,
      1,
      this.x,
      this.y,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );
    if (!this.isRope) {
      Game.drawTile(
        xx,
        yy,
        1,
        1,
        this.x,
        this.y - 1,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    } else {
      Game.drawTile(
        xx,
        yy + 0,
        1,
        2,
        this.x,
        this.y - 1,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
    Game.drawTile(
      xx,
      yy + 1,
      1,
      1,
      this.x,
      this.y,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );
  };

  drawAboveShading = (delta: number) => {
    // Update lockable animation
    this.lockable.update(delta);

    // Draw lock icon
    this.lockable.drawIcon(this.x, this.y, delta);

    // Original floating animation
    if (this.frame > 100) this.frame = 0;
    this.frame += 1 * delta;
    let multiplier = 0.125;

    Game.drawFX(
      2,
      2,
      1,
      1,
      this.x,
      this.y - 1.25 + multiplier * Math.sin((this.frame * Math.PI) / 50),
      1,
      1,
    );
  };

  drawAbovePlayer = (delta: number) => {
    if (this.isRope)
      Game.drawTile(
        16,
        1,
        1,
        1,
        this.x,
        this.y - 1,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
  };

  isLocked(): boolean {
    return this.lockable.isLocked();
  }
}
