import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { WeaponFragments } from "../../item/usable/weaponFragments";
import { Coin } from "../../item/coin";
import { Random } from "../../utility/random";

export class Barrel extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 1;
    this.tileY = 0;
    this.hasShadow = false;
    this.pushable = true;
    this.name = "barrel";
    this.imageParticleX = 3;
    this.imageParticleY = 25;
    if (Random.rand() < 0.1) {
      this.drops.push(new WeaponFragments(this.room, this.x, this.y));
    } else {
      this.drops.push(new Coin(this.room, this.x, this.y));
    }
  }

  get type() {
    return EntityType.PROP;
  }

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      this.updateDrawXY(delta);
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
}
