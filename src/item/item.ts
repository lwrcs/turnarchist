import { Game } from "../game";
import { GameConstants } from "../gameConstants";
import { LevelConstants } from "../levelConstants";
import { Player } from "../player";
import { Room } from "../room";
import { Sound } from "../sound";
import { Drawable } from "../drawable";

// Item class extends Drawable class and represents an item in the game
export class Item extends Drawable {
  // Item properties
  x: number; // x-coordinate of the item
  y: number; // y-coordinate of the item
  w: number; // width of the item
  h: number; // height of the item
  offsetY: number; // offset of the item on the y-axis
  tileX: number; // x-coordinate of the tile where the item is located
  tileY: number; // y-coordinate of the tile where the item is located
  frame: number; // frame number for animation
  level: Room; // level where the item is located
  stackable: boolean; // whether the item is stackable or not
  stackCount: number; // number of items in the stack
  pickedUp: boolean; // whether the item has been picked up or not
  alpha: number; // alpha value for transparency
  scaleFactor: number; // scale factor for size adjustment

  // Constructor for the Item class
  constructor(level: Room, x: number, y: number) {
    super();

    // Initialize properties
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

  // Empty tick function to be overridden by subclasses
  tick = () => {};
  // Empty tick function for inventory behavior to be overridden by subclasses
  tickInInventory = () => {};

  // Function to get description of the item, to be overridden by subclasses
  getDescription = (): string => {
    return "";
  };

  // Function to play sound when item is picked up
  pickupSound = () => {
    if (this.level === this.level.game.room) Sound.genericPickup();
  };

  // Empty function to be called when item is dropped, to be overridden by subclasses
  onDrop = () => {};

  dropFromInventory = () => {};

  // Function to be called when item is picked up
  onPickup = (player: Player) => {
    if (!this.pickedUp) {
      this.pickedUp = player.inventory.addItem(this);
      if (this.pickedUp) this.pickupSound();
    }
  };

  // Function to get the amount of shade at the item's location
  shadeAmount = () => {
    if (!this.x || !this.y) return 0;
    else return this.level.softVis[this.x][this.y];
  };

  // Function to draw the item
  draw = (delta: number) => {
    if (!this.pickedUp) {
      this.drawableY = this.y;

      if (this.scaleFactor < 1) this.scaleFactor += 0.04;
      else this.scaleFactor = 1;

      Game.drawItem(0, 0, 1, 1, this.x, this.y, 1, 1);
      this.frame += (delta * (Math.PI * 2)) / 60;
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
  // Function to draw the top layer of the item
  drawTopLayer = (delta: number) => {
    if (this.pickedUp) {
      this.y -= 0.125;
      this.alpha -= 0.03;
      if (this.y < -1)
        this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level

      if (GameConstants.ALPHA_ENABLED)
        Game.ctx.globalAlpha = Math.max(0, this.alpha);

      Game.drawItem(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x,
        this.y - 1,
        this.w,
        this.h
      );

      Game.ctx.globalAlpha = 1.0;
    }
  };
  // Function to draw the item's icon
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
