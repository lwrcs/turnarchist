import { Game } from "../game";
import { Tile, SkinType } from "./tile";
import { Room } from "../room";
import { Player } from "../player";
import { InsideLevelDoor } from "./insideLevelDoor";
import { Entity } from "../entity/entity";

export class Button extends Tile {
  // all are in grid units
  w: number;
  h: number;
  pressed: boolean;
  turnsSincePressed: number;
  linkedDoor: InsideLevelDoor;

  constructor(room: Room, x: number, y: number, linkedDoor: InsideLevelDoor) {
    super(room, x, y);
    this.w = 1;
    this.h = 1;

    this.pressed = false;
    this.turnsSincePressed = 1;

    this.linkedDoor = linkedDoor;
  }

  press = () => {
    this.pressed = true;
    this.linkedDoor.opened = true;
  };

  unpress = () => {
    this.pressed = false;
    this.linkedDoor.opened = false;
  };

  /*onCollide = (player: Player) => {
    this.press();
  };

  onCollideEnemy = (enemy: Enemy) => {
    this.press();
  };*/

  tickEnd = () => {
    this.unpress();
    for (const i in this.room.game.players) {
      if (this.room.game.players[i].x === this.x && this.room.game.players[i].y === this.y) this.press();
    }
    for (const e of this.room.entities) {
      if (e.x === this.x && e.y === this.y) this.press();
    }
  };

  draw = (delta: number) => {
    Game.drawTile(1, 0, 1, 1, this.x, this.y, 1, 1, this.room.shadeColor, this.shadeAmount());
    if (this.pressed)
      Game.drawTile(
        18,
        0,
        1,
        1,
        this.x,
        this.y,
        this.w,
        this.h,
        this.room.shadeColor,
        this.shadeAmount()
      );
    else
      Game.drawTile(
        17,
        0,
        1,
        1,
        this.x,
        this.y,
        this.w,
        this.h,
        this.room.shadeColor,
        this.shadeAmount()
      );
  };
}
