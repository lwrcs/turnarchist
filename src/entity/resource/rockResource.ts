import { Room } from "../../room";
import { Game } from "../../game";
import { Heart } from "../../item/heart";
import { LevelConstants } from "../../levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { Player } from "../../player";
import { Sound } from "../../sound";
import { Stone } from "../../item/stone";
import { Resource } from "./resource";
import { ImageParticle } from "../../particle/imageParticle";

export class Rock extends Resource {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 2;
    this.tileX = 8;
    this.tileY = 2;
    this.hasShadow = false;
    this.chainPushable = false;
    this.name = "rock";
  }

  hurtCallback = () => {
    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 0, 24); //rock particle coord 0, 24

    if (this.room === this.game.room) Sound.mine();
  };

  kill = () => {
    if (this.room === this.game.room) Sound.breakRock();

    this.dead = true;

    GenericParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      "#9badb7"
    );

    this.room.items.push(new Stone(this.room, this.x, this.y));
  };
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
        this.y - 1 - this.drawY,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount()
      );
    }
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
