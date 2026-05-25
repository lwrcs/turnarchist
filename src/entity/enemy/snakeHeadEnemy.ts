import { Game } from "../../game";
import { Room } from "../../room/room";
import { Item } from "../../item/item";
import { AbstractSnakeHeadEnemy } from "./abstractSnakeHeadEnemy";

export class SnakeHeadEnemy extends AbstractSnakeHeadEnemy {
  static difficulty: number = 2;
  static tileX: number = 41;
  static tileY: number = 17;
  static examineText =
    "A serpent. The body coils long behind it; aim for the head.";

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y, drop);
    // All defaults (name, health, colors, movementMode, hasStripes) are set in
    // AbstractSnakeHeadEnemy. No overrides needed for the standard snake.
  }
}
