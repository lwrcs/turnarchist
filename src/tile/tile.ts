import { Room } from "../room";
import { LevelConstants } from "../levelConstants";
import { Player } from "../player";
import { Enemy } from "../enemy/enemy";
import { Drawable } from "../drawable";

export enum SkinType {
  DUNGEON = 0,
  CAVE = 1,
}

export class Tile extends Drawable {
  x: number;
  y: number;
  level: Room;
  skin: SkinType;
  isDoor: boolean;

  constructor(level: Room, x: number, y: number) {
    super();
    this.skin = level.skin;
    this.level = level;
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
    return this.level.softVis[this.x][this.y];
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
  onCollideEnemy = (enemy: Enemy) => {};
  tick = () => {};
  tickEnd = () => {};

  draw = (delta: number) => {};
  drawUnderPlayer = (delta: number) => {};
  drawAbovePlayer = (delta: number) => {};
  drawAboveShading = (delta: number) => {};
}
