import { Game } from "../game";
import { GameConstants } from "../gameConstants";
import { LevelConstants } from "../levelConstants";
import { Player } from "../player";
import { Level } from "../level";
import { Sound } from "../sound";
import { Drawable } from "../drawable";

export class Item extends Drawable {
  x: number;
  y: number;
  w: number;
  h: number;
  offsetY: number;
  tileX: number;
  tileY: number;
  frame: number;
  level: Level;
  stackable: boolean;
  stackCount: number;
  pickedUp: boolean;
  alpha: number;
  scaleFactor: number;

  constructor(level: Level, x: number, y: number) {
    super();

    this.level = level;
    this.x = x;
    this.y = y;
    this.drawableY = y;
    this.w = 1;
    this.h = 2;
    this.tileX = 0;
    this.tileY = 0;
    this.frame = 0;
    this.stackable = false;
    this.stackCount = 1;
    this.pickedUp = false;
    this.alpha = 1;
    this.scaleFactor = 0.2;
    this.offsetY = -0.25;
  }

  tick = () => { };
  tickInInventory = () => { }; // different tick behavior for when we have the item in our inventory

  getDescription = (): string => {
    return "";
  };

  pickupSound = () => {
    if (this.level === this.level.game.level) Sound.genericPickup();
  };

  onPickup = (player: Player) => {
    if (!this.pickedUp) {
      this.pickedUp = player.inventory.addItem(this);
      if (this.pickedUp) this.pickupSound();
    }
  };

  shadeAmount = () => {
    return this.level.softVis[this.x][this.y];
  };

  draw = (delta: number) => {
    if (!this.pickedUp) {
      if (this.scaleFactor < 1) this.scaleFactor += 0.04;
      else this.scaleFactor = 1;

      Game.drawItem(0, 0, 1, 1, this.x, this.y, 1, 1);
      this.frame += delta * (Math.PI * 2) / 60;
      Game.drawItem(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x + this.w * (this.scaleFactor * -0.5 + 0.5),
        this.y +
        Math.sin(this.frame) * 0.07 -
        1 +
        this.offsetY +
        this.h * (this.scaleFactor * -0.5 + 0.5),
        this.w * this.scaleFactor,
        this.h * this.scaleFactor,
        this.level.shadeColor,
        this.shadeAmount()
      );
    }
  };
  drawTopLayer = (delta: number) => {
    if (this.pickedUp) {
      this.y -= 0.125;
      this.alpha -= 0.03;
      if (this.y < -1) this.level.items = this.level.items.filter(x => x !== this); // removes itself from the level

      if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = Math.max(0, this.alpha);

      Game.drawItem(this.tileX, this.tileY, 1, 2, this.x, this.y - 1, this.w, this.h);

      Game.ctx.globalAlpha = 1.0;
    }
  };
  drawIcon = (delta: number, x: number, y: number, opacity = 1) => {
    if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = opacity;
    Game.drawItem(this.tileX, this.tileY, 1, 2, x, y - 1, this.w, this.h);
    Game.ctx.globalAlpha = 1;

    let countText = this.stackCount <= 1 ? "" : "" + this.stackCount;
    let width = Game.measureText(countText).width;
    let countX = 16 - width;
    let countY = 10;

    Game.fillTextOutline(
      countText,
      x * GameConstants.TILESIZE + countX,
      y * GameConstants.TILESIZE + countY,
      GameConstants.OUTLINE,
      "white"
    );
  };
}
