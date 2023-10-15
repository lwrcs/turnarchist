import { Enemy } from "./enemy";
import { Room } from "../room";
import { Game } from "../game";
import { Heart } from "../item/heart";
import { LevelConstants } from "../levelConstants";
import { GenericParticle } from "../particle/genericParticle";
import { Item } from "../item/item";
import { Coin } from "../item/coin";
import { EntityType } from "./enemy";

export class PottedPlant extends Enemy {
  drop: Item;
  constructor(level: Room, game: Game, x: number, y: number, rand: () => number, drop?: Item) {
    super(level, game, x, y);
    this.level = level;
    this.health = 2;
    this.tileX = 3;
    this.tileY = 0;
    this.hasShadow = false;
    this.chainPushable = false;
    this.entityType = EntityType.Prop
    if (drop) this.drop = drop;
    
    else {
      let dropProb = rand();
      if (dropProb < 0.025) this.drop = new Heart(this.level, 0, 0);
      else this.drop = new Coin(this.level, 0, 0);
    }
  }

  hurtCallback = () => {
    GenericParticle.spawnCluster(this.level, this.x + 0.5, this.y + 0.5, "#5d9250");
  };

  kill = () => {
    this.dead = true;
    this.killNoBones();

    GenericParticle.spawnCluster(this.level, this.x + 0.5, this.y + 0.5, "#ce736a");
  };
  killNoBones = () => {
    this.dead = true;
    this.dropLoot();
  };
  
  draw = (delta: number) => {
    // not inherited because it doesn't have the 0.5 offset
    if (!this.dead) {
      this.drawX += -0.5 * this.drawX;
      this.drawY += -0.5 * this.drawY;
      if (this.health <= 1) 
        this.tileX = 2;
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

  dropLoot = () => {
    this.drop.level = this.level;
    this.drop.x = this.x;
    this.drop.y = this.y;
    this.level.items.push(this.drop);
  };
}
