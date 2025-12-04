import { Item } from "../../item/item";
import { Game } from "../../game";
import { Key } from "../../item/key";
import { Room } from "../../room/room";
import { Heart } from "../../item/usable/heart";
import { Armor } from "../../item/armor";
import { Resource } from "./resource";
import { GenericParticle } from "../../particle/genericParticle";
import { Sound } from "../../sound/sound";
import { Geode } from "../../item/resource/geode";
import { Random } from "../../utility/random";
import { IronOre } from "../../item/resource/ironOre";
export class IronResource extends Resource {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 18;
    this.tileY = 0;
    this.health = 2;
    this.name = "iron";
    if (Random.rand() < 0.005) {
      this.drops.push(new Geode(this.room, this.x, this.y));
    }

    this.drops.push(new IronOre(this.room, this.x, this.y));
  }
}
