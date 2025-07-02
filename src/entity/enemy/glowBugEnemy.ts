import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { GameConstants } from "../../game/gameConstants";
import { Enemy } from "./enemy";
import { Utils } from "../../utility/utils";
import { GlowBugs } from "../../item/light/glowBugs";
import { LightSource } from "../../lighting/lightSource";
import { Entity } from "../entity";

export class GlowBugEnemy extends Entity {
  ticks: number;
  frame: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  static difficulty: number = 1;
  static tileX: number = 8;
  static tileY: number = 4;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.tileX = 8;
    this.tileY = 0;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "glowbug";
    this.orthogonalAttack = true;
    this.imageParticleX = 3;
    this.imageParticleY = 24;
    //if (drop) this.drop = drop;
    this.drawYOffset = 1;
    this.hasShadow = true;
    this.hasHitParticles = false;
    this.hasDamageNumbers = false;
    this.hasBloom = true;
    this.bloomAlpha = 1;
    this.bloomColor = "#054B4B";

    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      6,
      [5, 75, 75],
    );
    this.addLightSource(this.lightSource);
    this.drops = [new GlowBugs(this.room, this.x, this.y)]; //this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  get alertText() {
    return `New Enemy Spotted: Crab 
    Health: ${this.health}
    Attack Pattern: Omnidirectional
    Moves every other turn`;
  }

  hit = (): number => {
    return 0.5;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    this.seenPlayer = true;
    this.aggro = true;

    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      this.wander();

      this.lightSource.x = this.x + 0.5;
      this.lightSource.y = this.y + 0.5;
      this.room.updateLighting();
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;

    if (!this.dead) {
      this.updateDrawXY(delta);

      this.frame += 0.15 * delta;
      if (this.frame >= 4) this.frame = 0;
      this.tileX = 8 + this.frame;
      if (this.hasShadow)
        Game.drawMob(
          0,
          0,
          1,
          1,
          this.x - this.drawX,
          this.y - this.drawY,
          1,
          1,
          this.room.shadeColor,
          this.shadeAmount(),
        );
      Game.drawMob(
        Math.floor(this.tileX),
        this.tileY,
        1,
        1,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        1,
        this.softShadeColor,
        this.shadeAmount(),
      );
      if (this.crushed) {
        this.crushAnim(delta);
      }
    }
    if (!this.cloned) {
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta, 0, 0.75 * GameConstants.TILESIZE);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta, 0, 0.75 * GameConstants.TILESIZE);
      }
    }
    Game.ctx.restore();
  };
}
