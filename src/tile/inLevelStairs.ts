import { Game } from "../game";
import { Player } from "../player/player";
import { Room } from "../room/room";
import { Floor } from "./floor";
import { Wall } from "./wall";

/**
 * In-level stairs only change the player's vertical layer (`player.z`) within the same room.
 * They do NOT transition between depths/levels (that's handled by UpLadder/DownLadder).
 *
 * Rendering of multiple layers will be handled later; for now these draw like floor with a small marker.
 */
export class InLevelStairs extends Wall {
  readonly deltaZ: number;

  constructor(room: Room, x: number, y: number, deltaZ: number) {
    super(room, x, y);
    this.deltaZ = deltaZ;
    this.name = deltaZ >= 0 ? "stairs up" : "stairs down";
  }

  interact = (player: Player) => {
    //player.move(this.x, this.y, player.z + this.deltaZ);
  };

  draw = (delta: number) => {
    // Floor.draw is a class-field arrow function, so calling `super.draw(...)` here
    // is invalid in TS (and would be undefined at runtime). Inline the floor draw.
    Game.drawTile(
      0,
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
    // Tiny marker so it's visible even before proper multi-layer rendering exists.
    // Uses FX spritesheet indices already used elsewhere; harmless if not perfectly themed.
    const fxX = this.deltaZ >= 0 ? 2 : 3;
    Game.drawFX(fxX, 0, 1, 1, this.x, this.y, 1, 1);
  };
}

export class UpStairs extends InLevelStairs {
  constructor(room: Room, x: number, y: number) {
    super(room, x, y, 1);
  }
}

export class DownStairs extends InLevelStairs {
  constructor(room: Room, x: number, y: number) {
    super(room, x, y, -1);
  }
}
