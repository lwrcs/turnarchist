import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/usable/heart";
import { LevelConstants } from "../../level/levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { Candle } from "../../item/light/candle";
import { Random } from "../../utility/random";
import { Coin } from "../../item/coin";
import { Sound } from "../../sound/sound";

export class DarkPot extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 8;
    this.tileY = 6;
    this.hasShadow = true;
    this.chainPushable = false;
    this.name = "dark pot";

    this.hitSound = Sound.potSmash;
    this.imageParticleX = 0;
    this.imageParticleY = 29;

    let dropProb = Random.rand();
    //if (dropProb < 0.025) this.drops.push(new Heart(this.room, this.x, this.y));
    //else this.drops.push(new Coin(this.room, this.x, this.y));
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
