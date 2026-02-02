import { Room } from "../../room/room";
import { Game } from "../../game";
import { Item } from "../../item/item";
import { PottedPlant } from "./pottedPlant";

/**
 * Decorative lily plant.
 * Same behavior/properties as `PottedPlant`, but uses the Glowshrooms tileset row
 * with tileX shifted by +1 (Glowshrooms: 1,7 -> this: 2,7).
 */
export class LilyPlant extends PottedPlant {
  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y, drop);
    this.tileX = 2;
    this.tileY = 7;
  }
}

