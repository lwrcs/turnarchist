import { Game } from "../../game";
import { Room } from "../../room/room";
import { Resource } from "./resource";
import { Coal } from "../../item/coal";
import { Geode } from "../../item/geode";

export class CoalResource extends Resource {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 12;
    this.tileY = 0;
    this.health = 1;
    this.name = "coal";
    if (Math.random() < 0.1) {
      this.drops.push(new Geode(this.room, this.x, this.y));
    }
    this.drops.push(new Coal(this.room, this.x, this.y));
  }
}
