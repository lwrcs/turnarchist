import { Game } from "../../game";
import { Room } from "../../room/room";
import { Resource } from "./resource";
import { Coal } from "../../item/coal";

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
