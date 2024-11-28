import { Item } from "../../item/item";
import { Game } from "../../game";
import { Key } from "../../item/key";
import { Room } from "../../room";
import { Heart } from "../../item/heart";
import { Armor } from "../../item/armor";
import { GreenGem } from "../../item/greengem";
import { Resource } from "./resource";
import { GenericParticle } from "../../particle/genericParticle";
import { Sound } from "../../sound";

export class EmeraldResource extends Resource {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 14;
    this.tileY = 0;
    this.health = 3;
    this.name = "emerald";
  }

  hurtCallback = () => {
    GenericParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      "#fbf236",
    );

    if (this.room === this.game.room) Sound.mine();
  };

  kill = () => {
    if (this.room === this.game.room) Sound.breakRock();

    this.dead = true;

    this.room.items.push(new GreenGem(this.room, this.x, this.y));
  };
  killNoBones = () => {
    this.kill();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
