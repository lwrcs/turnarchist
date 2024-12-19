import { Entity } from "../entity";
import { Room } from "../../room";
import { Game } from "../../game";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { WeaponFragments } from "../../item/weaponFragments";
import { Coin } from "../../item/coin";

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
    if (Math.random() < 0.1) {
      this.drop = new WeaponFragments(this.room, this.x, this.y);
    } else {
      this.drop = new Coin(this.room, this.x, this.y);
    }
  }

  get type() {
    return EntityType.PROP;
  }

  killNoBones = () => {
    this.kill();
  };

  draw = (delta: number) => {
    // not inherited because it doesn't have the 0.5 offset
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
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
