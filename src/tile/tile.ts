import { Room } from "../room";
import { Player } from "../player";
import { Entity } from "../entity/entity";
import { Drawable } from "../drawable";
import { GameConstants } from "../gameConstants";

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
  opacity: number;

  constructor(room: Room, x: number, y: number) {
    super();
    this.skin = room.skin;
    this.room = room;
    this.x = x;
    this.y = y;
    this.drawableY = y;
    this.isDoor = false;
    this.opacity = 1;
  }

  hasPlayer = (player: Player) => {
    if (player.x === this.x && player.y === this.y) return true;
    else return false;
  };

  shadeAmount = (offsetX: number = 0, offsetY: number = 0) => {
    if (GameConstants.SMOOTH_LIGHTING) return 0;
    return this.room.softVis[this.x + offsetX][this.y + offsetY];
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
