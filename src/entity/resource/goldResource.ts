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
    this.drop = new Gold(this.room, this.x, this.y);
  }
}
