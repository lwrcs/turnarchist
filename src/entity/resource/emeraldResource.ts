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
    this.drop = new GreenGem(this.room, this.x, this.y);
  }
}
