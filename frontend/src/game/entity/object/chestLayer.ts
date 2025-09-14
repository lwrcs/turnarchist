import { Game } from "../../game";
import { Room } from "../../room/room";
import { Entity } from "../entity";
import { Item } from "../../item/item";

export class ChestLayer extends Entity {
  frame: number;
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.x = x;
    this.y = y;
    this.game = game;
    this.room = room;

    this.frame = 0;
  }

  setDrawableY = () => {
    for (let i of this.room.items)
      if (i.x === this.x && i.y === this.y)
        this.drawableY ===
          this.room.roomArray[this.x][this.y].drawableY + 0.001;
  };

  draw = (delta: number) => {
    this.drawableY = this.y - 0.01;
    this.setDrawableY;
    if (!this.dead) {
      Game.drawObj(
        0,
        4,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
  };
}
