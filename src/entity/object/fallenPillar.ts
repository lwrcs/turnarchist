import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { WeaponFragments } from "../../item/usable/weaponFragments";
import { Coin } from "../../item/coin";

export class FallenPillar extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 0;
    this.tileY = 6;
    this.hasShadow = true;
    this.pushable = false;
    this.w = 2;
    this.name = "fallen pillar";
    this.imageParticleX = 3;
    this.imageParticleY = 25;
    this.hasShadow = false;
    this.chainPushable = false;
    //this.drawYOffset = 0.1;
  }

  get type() {
    return EntityType.PROP;
  }

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      if (this.hasShadow) this.drawShadow(delta);

      this.updateDrawXY(delta);
      Game.drawObj(
        this.tileX,
        this.tileY,
        2,
        1,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY + 0.75,
        2,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
