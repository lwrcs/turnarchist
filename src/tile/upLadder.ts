import { Player } from "../player/player";
import { Game } from "../game";
import { Room } from "../room/room";
import { GameConstants } from "../game/gameConstants";
import { SkinType, Tile } from "./tile";
import { DownLadder } from "./downLadder";
import { Sound } from "../sound/sound";
import { Lockable, LockType } from "./lockable";

export class UpLadder extends Tile {
  linkedRoom: Room;
  game: Game;
  isRope = false;
  depth: number;
  frame: number = 0;
  lockable: Lockable;
  keyID: number;
  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    lockType: LockType = LockType.NONE,
  ) {
    super(room, x, y);
    this.game = game;
    this.depth = room.depth;
    this.keyID = 0;

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
      this.game.changeLevelThroughLadder(player, this);
      Sound.forestMusic.pause();
    } catch (error) {
      console.error("Error during changeLevelThroughLadder:", error);
    }
  };

  getName = () => {
    return this.isRope ? "rope up" : "staircase up";
  };

  linkRoom = () => {
    this.linkedRoom = this.game.levels[this.depth - 1].exitRoom;
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
    if (!this.isRope)
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

  // Lockable interface methods
  lock(lockType: LockType = LockType.LOCKED) {
    this.lockable = new Lockable(this.game, {
      lockType: lockType,
      isTopDoor: true,
    });
  }

  setKeyID(keyID: number) {
    this.lockable.setKeyID(keyID);
  }

  isLocked(): boolean {
    return this.lockable.isLocked();
  }
}
