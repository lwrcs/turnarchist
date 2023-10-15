import { Enemy } from "./enemy";
import { Room } from "../room";
import { Game } from "../game";
import { Heart } from "../item/heart";
import { LevelConstants } from "../levelConstants";
import { GenericParticle } from "../particle/genericParticle";
import { Player } from "../player";
import { Sound } from "../sound";
import { Stone } from "../item/stone";
import { Resource } from "./resource";

export class Rock extends Resource {
  constructor(level: Room, game: Game, x: number, y: number) {
    super(level, game, x, y);
    this.level = level;
    this.health = 2;
    this.tileX = 8;
    this.tileY = 2;
    this.hasShadow = false;
    this.chainPushable = false;
  }

  hurtCallback = () => {
    GenericParticle.spawnCluster(this.level, this.x + 0.5, this.y + 0.5, "#ffffff");

    if (this.level === this.game.level) Sound.mine();
  };

  kill = () => {
    if (this.level === this.game.level) Sound.breakRock();

    this.dead = true;

    GenericParticle.spawnCluster(this.level, this.x + 0.5, this.y + 0.5, "#9badb7");

    this.level.items.push(new Stone(this.level, this.x, this.y));
  };
  killNoBones = () => {
    this.kill();
  };

  draw = (delta: number) => {
    // not inherited because it doesn't have the 0.5 offset
    if (!this.dead) {
      this.drawX += -0.5 * this.drawX;
      this.drawY += -0.5 * this.drawY;
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
  };
}
