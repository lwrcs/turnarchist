import { Room } from "../room";
import { LevelConstants } from "../levelConstants";
import { Player } from "../player";
import { Entity } from "../entity/entity";
import { Drawable } from "../drawable";

export enum SkinType {
  DUNGEON = 0,
  CAVE = 1,
  FOREST = 2,
  SWAMP = 3,
  GLACIER = 4,
  CASTLE = 5,
}

export abstract class Tile extends Drawable {
  x: number;
  y: number;
  room: Room;
  skin: SkinType;
  isDoor: boolean;

  constructor(room: Room, x: number, y: number) {
    super();
    this.skin = room.skin;
    this.room = room;
    this.x = x;
    this.y = y;
    this.drawableY = y;
    this.isDoor = false;
  }

  hasPlayer = (player: Player) => {
    if (player.x === this.x && player.y === this.y) return true;
    else return false;
  };

  shadeAmount = () => {
    return this.room.softVis[this.x][this.y];
  };

  isSolid = (): boolean => {
    return false;
  };
  canCrushEnemy = (): boolean => {
    return false;
  };
  isOpaque = (): boolean => {
    return false;
  };
  onCollide = (player: Player) => {};
  onCollideEnemy = (enemy: Entity) => {};
  tick = () => {};
  tickEnd = () => {};

  draw = (delta: number) => {};
  drawUnderPlayer = (delta: number) => {};
  drawAbovePlayer = (delta: number) => {};
  drawAboveShading = (delta: number) => {};
}
