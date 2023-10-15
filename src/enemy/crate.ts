import { Enemy } from "./enemy";
import { Room } from "../room";
import { Game } from "../game";
import { Heart } from "../item/heart";
import { LevelConstants } from "../levelConstants";
import { GenericParticle } from "../particle/genericParticle";
import { EntityType } from "./enemy";

export class Crate extends Enemy {
  constructor(level: Room, game: Game, x: number, y: number) {
    super(level, game, x, y);
    this.level = level;
    this.health = 1;
    this.maxHealth = 1;
    this.tileX = 0;
    this.tileY = 0;
    this.hasShadow = false;
    this.pushable = true;
    this.entityType = EntityType.Prop
  }

  kill = () => {
    this.dead = true;

    GenericParticle.spawnCluster(this.level, this.x + 0.5, this.y + 0.5, "#d9a066");
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
        this.y - 1 - this.drawY,
        1,
        2,
        this.level.shadeColor,
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
