import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { Entity } from "../../entity/entity";
import { Drawable } from "../../drawable/drawable";
import { GameConstants } from "../../game/gameConstants";
import { Game } from "../../game";
import { Decoration } from "./decoration";
import { SkinType } from "../../tile/tile";

export class Puddle extends Decoration {
  x: number;
  y: number;
  room: Room;
  skin: SkinType;
  isDoor: boolean;
  opacity: number;
  applySkin: boolean;

  constructor(room: Room, x: number, y: number) {
    super(room, x, y);
    this.skin = room.skin;
    this.room = room;
    this.x = x;
    this.y = y;
    this.drawableY = y;
    this.isDoor = false;
    this.opacity = 1;
    this.applySkin = false;
  }

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
  drawUnderPlayer = (delta: number) => {
    let tileY = 1;
    if (this.applySkin) tileY = this.skin;

    Game.drawTile(
      1,
      tileY,
      1,
      1,
      this.x,
      this.y,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );
  };
  drawAbovePlayer = (delta: number) => {};
  drawAboveShading = (delta: number) => {};
}
