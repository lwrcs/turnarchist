import { Entity } from "../entity";
import { Room } from "../../room";
import { Game } from "../../game";
import { Heart } from "../../item/heart";
import { LevelConstants } from "../../levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { Enemy } from "./enemy";

export class Rook extends Enemy {
  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    rand: () => number
  ) {
    super(room, game, x, y, rand);
    this.room = room;
    this.health = 1;
    this.maxHealth = 1;
    this.tileX = 14;
    this.tileY = 2;
    this.hasShadow = false;
    this.pushable = true;
    this.name = "rook";
  }

  kill = () => {
    this.dead = true;

    GenericParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      "#d9a066"
    );
  };
  killNoBones = () => {
    this.kill();
  };

  draw = (delta: number) => {
    // not inherited because it doesn't have the 0.5 offset
    if (!this.dead) {
      Game.drawObj(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount()
      );
    }
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;

    this.drawX += -0.5 * this.drawX;
    this.drawY += -0.5 * this.drawY;
  };
}
