import { Item } from "../../item/item";
import { Game } from "../../game";
import { Key } from "../../item/key";
import { Room } from "../../room/room";
import { Heart } from "../../item/usable/heart";
import { Armor } from "../../item/armor";
import { Resource } from "./resource";
import { GenericParticle } from "../../particle/genericParticle";
import { Gold } from "../../item/resource/gold";
import { Sound } from "../../sound/sound";
import { Geode } from "../../item/resource/geode";
import { Random } from "../../utility/random";
export class GoldResource extends Resource {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 13;
    this.tileY = 0;
    this.health = 2;
    this.name = "gold";
    if (Random.rand() < 0.2) {
      this.drops.push(new Geode(this.room, this.x, this.y));
    }

    this.drops.push(new Gold(this.room, this.x, this.y));
  }
}
