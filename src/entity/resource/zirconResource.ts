import { Item } from "../../item/item";
import { Game } from "../../game";
import { Key } from "../../item/key";
import { Room } from "../../room/room";
import { Heart } from "../../item/usable/heart";
import { Armor } from "../../item/armor";
import { GreenGem } from "../../item/resource/greengem";
import { Resource } from "./resource";
import { GenericParticle } from "../../particle/genericParticle";
import { Sound } from "../../sound/sound";
import { Geode } from "../../item/resource/geode";
import { Random } from "../../utility/random";
import { RedGem } from "../../item/resource/redgem";
import { BlueGem } from "../../item/resource/bluegem";

export class ZirconResource extends Resource {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 16;
    this.tileY = 0;
    this.health = 3;
    this.name = "zircon";
    if (Random.rand() < 0.025) {
      this.drops.push(new Geode(this.room, this.x, this.y));
    }
    this.drops.push(new BlueGem(this.room, this.x, this.y));
  }
}
