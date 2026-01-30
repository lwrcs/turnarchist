import { Room } from "../room/room";
import { Player } from "../player/player";
import { Entity } from "../entity/entity";
import { Drawable } from "../drawable/drawable";
import { GameConstants } from "../game/gameConstants";
import { IdGenerator } from "../globalStateManager/IdGenerator";

export enum SkinType {
  DUNGEON = 0,
  CAVE = 1,
  FOREST = 2,
  CASTLE = 3,
  GLACIER = 4,
  DARK_CASTLE = 5,
  PLACEHOLDER = 6,
  DESERT = 7,
  MAGMA_CAVE = 8,
  DARK_DUNGEON = 9,
  TUTORIAL = 10,
  FLOODED_CAVE = 11,
}

export abstract class Tile extends Drawable {
  globalId: string;
  x: number;
  y: number;
  /**
   * Vertical layer within the room. Most tiles are shared across all layers for now.
   * Rendering of multiple layers will be handled in a later step.
   */
  z: number;
  room: Room;
  skin: SkinType;
  isDoor: boolean;
  opacity: number;
  name: string = "";

  constructor(room: Room, x: number, y: number, z: number = 0) {
    super();
    this.globalId = IdGenerator.generate("T");
    this.skin = room.skin;
    this.room = room;
    this.x = x;
    this.y = y;
    this.z = z;
    this.drawableY = y;
    this.isDoor = false;
    this.opacity = 1;
  }

  getName = () => {
    return this.name;
  };

  /**
   * Context-menu "Examine" text. Empty string = no examine option.
   * (Most floor/wall tiles should return empty.)
   */
  examineText = (): string => {
    return "";
  };

  hasPlayer = (player: Player) => {
    // Tiles are currently shared across all vertical layers; z-aware rendering/tiles come later.
    if (player.x === this.x && player.y === this.y) return true;
    else return false;
  };

  shadeAmount = (
    offsetX: number = 0,
    offsetY: number = 0,
    disable: boolean = true,
  ) => {
    if (GameConstants.SMOOTH_LIGHTING && disable) return 0;
    const v = this.room.softVis[this.x + offsetX][this.y + offsetY];
    return GameConstants.applyShadeForTiles(v);
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
