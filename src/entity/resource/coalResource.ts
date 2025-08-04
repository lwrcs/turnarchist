import { Game } from "../../game";
import { Room } from "../../room/room";
import { Resource } from "./resource";
import { Coal } from "../../item/resource/coal";
import { Geode } from "../../item/resource/geode";
import { Random } from "../../utility/random";

export class CoalResource extends Resource {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 12;
    this.tileY = 0;
    this.health = 1;
    this.name = "coal";
    if (Random.rand() < 0.1) {
      this.drops.push(new Geode(this.room, this.x, this.y));
    }
    this.drops.push(new Coal(this.room, this.x, this.y));
  }
}
