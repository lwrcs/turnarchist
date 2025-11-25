import { Game } from "../../game";
import { Room } from "../../room/room";

import { Resource } from "./resource";
import { GoldOre } from "../../item/resource/goldOre";
import { Geode } from "../../item/resource/geode";
import { Random } from "../../utility/random";
export class GoldResource extends Resource {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 13;
    this.tileY = 0;
    this.health = 2;
    this.name = "gold";
    if (Random.rand() < 0.005) {
      this.drops.push(new Geode(this.room, this.x, this.y));
    }

    this.drops.push(new GoldOre(this.room, this.x, this.y));
  }
}
