import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/heart";
import { LevelConstants } from "../../levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { Item } from "../../item/item";
import { Coin } from "../../item/coin";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { Random } from "../../random";
import { Sound } from "../../sound";

export class PottedPlant extends Entity {
  drop: Item;
  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.room = room;
    this.health = 2;
    this.tileX = 3;
    this.tileY = 0;
    this.hasShadow = false;
    this.chainPushable = false;
    this.name = "plant";
    this.imageParticleX = 0;
    this.imageParticleY = 28;
    if (drop) this.drop = drop;
    else {
      let dropProb = Random.rand();
      if (dropProb < 0.025) this.drop = new Heart(this.room, this.x, this.y);
      else this.drop = new Coin(this.room, this.x, this.y);
    }
  }

  get type() {
    return EntityType.PROP;
  }

  killNoBones = () => {
    this.dead = true;
  };

  uniqueKillBehavior = () => {
    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 0, 29);
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      this.updateDrawXY(delta);
      if (this.health <= 1 || this.dying) this.tileX = 2;
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
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };

  dropLoot = () => {
    this.drop.level = this.room;
    this.drop.x = this.x;
    this.drop.y = this.y;
    this.room.items.push(this.drop);
  };
}
