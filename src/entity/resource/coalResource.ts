import { Item } from "../../item/item";
import { Game } from "../../game";
import { Key } from "../../item/key";
import { Room } from "../../room";
import { Heart } from "../../item/heart";
import { Armor } from "../../item/armor";
import { Resource } from "./resource";
import { GenericParticle } from "../../particle/genericParticle";
import { Coal } from "../../item/coal";
import { Sound } from "../../sound";
import { Inventory } from "../../inventory";
import { Weapon } from "../../weapon/weapon";
import { Pickaxe } from "../../weapon/pickaxe";
import { Player } from "../../player";
import { ItemState, ItemType } from "../../gameState";

export class CoalResource extends Resource {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 12;
    this.tileY = 0;
    this.health = 1;
    this.name = "coal";
    this.drop = new Coal(this.room, this.x, this.y);
  }
}
