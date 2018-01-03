import { Collidable } from "../tile/collidable";
import { Game } from "../game";
import { Level } from "../level";
import { Bones } from "../tile/bones";
import { LevelConstants } from "../levelConstants";
import { Player } from "../player";
import { DeathParticle } from "../deathParticle";

export class Enemy extends Collidable {
  drawX: number;
  drawY: number;
  dead: boolean;
  game: Game;
  health: number;
  tileX: number;
  tileY: number;
  hasShadow: boolean;
  hasDarkVersion: boolean;

  constructor(level: Level, game: Game, x: number, y: number) {
    super(level, x, y);
    this.game = game;
    this.drawX = 0;
    this.drawY = 0;
    this.health = 1;
    this.tileX = 0;
    this.tileY = 0;
    this.hasShadow = true;
    this.hasDarkVersion = true;
  }

  tryMove = (x: number, y: number) => {
    for (const e of this.level.enemies) {
      if (e !== this && e.x === x && e.y === y) {
        return;
      }
    }
    if (this.game.player.x === x && this.game.player.y === y) {
      return;
    }
    if (this.game.level.getCollidable(x, y) === null) {
      this.x = x;
      this.y = y;
    }
  };

  hit = (): number => {
    return 0;
  };

  dropXP = () => {
    return 0;
  };

  hurt = (player: Player, damage: number) => {
    this.health -= damage;
    if (this.health <= 0) {
      player.stats.getXP(this.dropXP());
      this.kill();
    }
  };

  kill = () => {
    this.level.levelArray[this.x][this.y] = new Bones(this.level, this.x, this.y);
    this.dead = true;
    this.level.particles.push(new DeathParticle(this.x, this.y));
  };

  draw = () => {
    if (!this.dead) {
      let darkOffset =
        this.level.visibilityArray[this.x][this.y] <= LevelConstants.VISIBILITY_CUTOFF &&
        this.hasDarkVersion
          ? 2
          : 0;
      this.drawX += -0.5 * this.drawX;
      this.drawY += -0.5 * this.drawY;
      if (this.hasShadow) Game.drawMob(0, 0, 1, 1, this.x - this.drawX, this.y - this.drawY, 1, 1);
      Game.drawMob(
        this.tileX,
        this.tileY + darkOffset,
        1,
        2,
        this.x - this.drawX,
        this.y - 1.5 - this.drawY,
        1,
        2
      );
    }
  };
  tick = () => {};
  drawTopLayer = () => {};
}
