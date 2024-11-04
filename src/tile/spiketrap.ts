import { Player } from "../player";
import { Game } from "../game";
import { Room } from "../room";
import { LevelConstants } from "../levelConstants";
import { Tile } from "./tile";
import { Entity } from "../entity/entity";
import { Crate } from "../entity/object/crate";
import { Barrel } from "../entity/object/barrel";
import { HitWarning } from "../hitWarning";

export class SpikeTrap extends Tile {
  on: boolean;
  tickCount: number;
  frame: number;
  t: number;

  constructor(room: Room, x: number, y: number, tickCount?: number) {
    super(room, x, y);
    if (tickCount) this.tickCount = tickCount;
    else this.tickCount = 0;
    this.on = false;
    this.frame = 0;
    this.t = 0;
  }

  tick = () => {
    this.tickCount++;
    if (this.tickCount >= 4) this.tickCount = 0;
    this.on = this.tickCount === 0;

    if (this.on) {
      for (const i in this.room.game.players) {
        if (
          this.room ===
          this.room.game.rooms[this.room.game.players[i].levelID] &&
          this.room.game.players[i].x === this.x &&
          this.room.game.players[i].y === this.y
        )
          this.room.game.players[i].hurt(1, "spike trap");
      }
    }

    if (this.tickCount === 3)
      this.room.hitwarnings.push(
        new HitWarning(this.room.game, this.x, this.y, this.x, this.y, false)
      );
  };

  tickEnd = () => {
    if (this.on) {
      for (const e of this.room.entities) {
        if (e.x === this.x && e.y === this.y) {
          e.hurt(null, 1);
        }
      }
    }
  };

  onCollideEnemy = (enemy: Entity) => {
    if (this.on && !(enemy instanceof Crate || enemy instanceof Barrel))
      enemy.hurt(null, 1);
  };

  draw = (delta: number) => {
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
      this.shadeAmount()
    );

    let rumbleOffsetX = 0;
    this.t += delta;
    if (!this.on && this.tickCount === 3) {
      if (Math.floor(this.t) % 4 === 1) rumbleOffsetX = 0.0325;
      if (Math.floor(this.t) % 4 === 3) rumbleOffsetX = -0.0325;
    }
    let frames = [0, 1, 2, 3, 3, 4, 2, 0];
    let f = 6 + frames[Math.floor(this.frame)];
    if (
      this.tickCount === 1 ||
      (this.tickCount === 0 && frames[Math.floor(this.frame)] === 0)
    ) {
      f = 5;
    }
    Game.drawObj(
      f,
      0,
      1,
      2,
      this.x + rumbleOffsetX,
      this.y - 1,
      1,
      2,
      this.room.shadeColor,
      this.shadeAmount()
    );
    if (this.on && this.frame < frames.length - 1) {
      if (frames[Math.floor(this.frame)] < 3) this.frame += 0.4 * delta;
      else this.frame += 0.2 * delta;
    }
    if (!this.on) this.frame = 0;
  };
}
