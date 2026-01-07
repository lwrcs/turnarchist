import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/usable/heart";
import { LevelConstants } from "../../level/levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { Shrooms } from "../../item/usable/shrooms";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { Sound } from "../../sound/sound";
import { Resource } from "../resource/resource";

export class ObsidianBlock extends Resource {
  static examineText = "Obsidian. Harder than it looks.";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 18;
    this.tileY = 6;
    this.hasShadow = true;
    this.chainPushable = false;
    this.name = "obsidian block";
    this.imageParticleX = 6;
    this.imageParticleY = 24;
    this.opaque = true;
    this.hitSound = Sound.breakRock;
    this.extendShadow = true;
    this.shadowOpacity = 0.5;
    //this.drops.push(new Shrooms(this.room, this.x, this.y));
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
      if (this.hasShadow) this.drawShadow(delta);

      Game.drawObj(
        this.tileX,
        this.tileY,
        2,
        2,
        this.x - this.drawX - 0.5,
        this.y - this.drawYOffset - this.drawY,
        2,
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
