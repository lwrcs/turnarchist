import { Item } from "../../item/item";
import { Game } from "../../game";
import { Key } from "../../item/key";
import { Room } from "../../room";
import { Heart } from "../../item/heart";
import { Armor } from "../../item/armor";
import { Resource } from "./resource";
import { GenericParticle } from "../../particle/genericParticle";
import { Gold } from "../../item/gold";
import { Sound } from "../../sound";

export class GoldResource extends Resource {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 13;
    this.tileY = 0;
    this.health = 2;
    this.name = "gold";
  }

  hurtCallback = () => {
    if (this.room === this.game.room) Sound.mine();
  };

  kill = () => {
    if (this.room === this.game.room) Sound.breakRock();

    this.dead = true;

    this.room.items.push(new Gold(this.room, this.x, this.y));

    GenericParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      "#fbf236",
    );
  };
  killNoBones = () => {
    this.kill();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
