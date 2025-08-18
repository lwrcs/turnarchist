import { Room } from "../room/room";
import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Tile } from "./tile";

export class Chasm extends Tile {
  tileX: number;
  tileY: number;
  topEdge: boolean;
  private _buffer: HTMLCanvasElement;

  constructor(
    room: Room,
    x: number,
    y: number,
    leftEdge: boolean,
    rightEdge: boolean,
    topEdge: boolean,
    bottomEdge: boolean,
  ) {
    super(room, x, y);

    this.tileX = this.skin === 1 ? 24 : 20;
    this.tileY = 1;

    if (leftEdge) this.tileX--;
    else if (rightEdge) this.tileX++;
    if (topEdge) this.tileY--;
    else if (bottomEdge) this.tileY++;

    this.topEdge = topEdge;
  }

  isSolid = (): boolean => {
    return true;
  };
  canCrushEnemy = (): boolean => {
    return true;
  };

  draw = (delta: number) => {
    const ts = GameConstants.TILESIZE;
    const tilesHigh = this.topEdge ? 2 : 1;

    // Prepare/reuse offscreen buffer with correct size
    if (
      !this._buffer ||
      this._buffer.width !== ts ||
      this._buffer.height !== tilesHigh * ts
    ) {
      this._buffer = document.createElement("canvas");
      this._buffer.width = ts;
      this._buffer.height = tilesHigh * ts;
    }

    const offCtx = this._buffer.getContext("2d");
    offCtx.clearRect(0, 0, this._buffer.width, this._buffer.height);

    // Temporarily redirect Game.ctx to offscreen to reuse Game.drawTile
    const mainCtx = Game.ctx;
    const prevComp =
      offCtx.globalCompositeOperation as GlobalCompositeOperation;
    (Game as any).ctx = offCtx;

    // 1) Mask
    offCtx.globalCompositeOperation = "source-over";
    Game.drawTile(
      this.tileX,
      this.tileY,
      1,
      1,
      0,
      0,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );

    // 2) Fill clipped by mask
    offCtx.globalCompositeOperation = "source-in";
    Game.drawTile(
      1,
      this.skin,
      1,
      1,
      0,
      0,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );

    // 3) Background behind both (only for top edge variant which spans 2 tiles)
    if (this.topEdge) {
      offCtx.globalCompositeOperation = "destination-over";
      Game.drawTile(
        22,
        0,
        1,
        2,
        0,
        0,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }

    // Restore Game.ctx
    (Game as any).ctx = mainCtx;
    offCtx.globalCompositeOperation = prevComp;

    // Blit to main canvas at world position
    Game.ctx.save();
    Game.ctx.globalCompositeOperation = "source-over";
    Game.ctx.drawImage(this._buffer, this.x * ts, this.y * ts);
    Game.ctx.restore();
  };
}
