import { Game } from "../game";
import { GameConstants } from "../gameConstants";
import { Player } from "../player";
import { Room } from "../room";
import { Sound } from "../sound";
import { Drawable } from "../drawable";
import { Utils } from "../utils";

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
  name: string;
  startY: number;
  randomOffset: number;
  durability: number;
  durabilityMax: number;
  broken: boolean;
  description: string;
  drawOffset: number;
  pickupOffsetY: number;
  static itemName: string;
  inChest: boolean;
  chestOffsetY: number;
  sineAnimateFactor: number;

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
    this.scaleFactor = 5;
    this.offsetY = -0.25;
    this.name = "";
    this.startY = y;
    this.randomOffset = Math.random();
    this.durability = 50;
    this.durabilityMax = 50;
    this.broken = false;
    this.description = "";
    this.drawOffset = 0;
    this.pickupOffsetY = 1;
    this.chestOffsetY = 0;
    this.sineAnimateFactor = 1;
  }

  static add<
    T extends new (room: Room, x: number, y: number, ...rest: any[]) => Item,
  >(this: T, room: Room, x: number, y: number, ...rest: any[]) {
    return new this(room, x, y, ...rest);
  }

  // Empty tick function to be overridden by subclasses
  tick = () => {};
  // Empty tick function for inventory behavior to be overridden by subclasses
  tickInInventory = () => {};

  // Function to get description of the item, to be overridden by subclasses
  getDescription = (): string => {
    return "";
  };

  animateFromChest = () => {
    this.chestOffsetY = 0.5;
    this.alpha = 0;
    this.inChest = true;
    this.sineAnimateFactor = 0;
  };

  // Function to play sound when item is picked up
  pickupSound = () => {
    if (this.level === this.level.game.room) Sound.genericPickup();
  };

  // Empty function to be called when item is dropped, to be overridden by subclasses
  onDrop = () => {};
  // Function to be called when item is picked up
  onPickup = (player: Player) => {
    if (!this.pickedUp) {
      this.startY = player.y;

      this.drawableY = this.y;
      this.alpha = 1;
      this.pickedUp = player.inventory.addItem(this);
      if (this.pickedUp) this.pickupSound();
    }
  };

  dropFromInventory = () => {
    this.setDrawOffset();
  };

  // Function to get the amount of shade at the item's location
  shadeAmount = () => {
    if (!this.x || !this.y) return 0;
    else return this.level.softVis[this.x][this.y];
  };

  drawStatus = (x: number, y: number) => {};

  drawBrokenSymbol = (x: number, y: number) => {
    if (this.broken) {
      Game.drawFX(
        5,
        0,
        1,
        1,
        x - 0.5 / GameConstants.TILESIZE,
        y - 0.5 / GameConstants.TILESIZE,
        1,
        1,
      );
    }
  };

  // Function to draw the item
  draw = (delta: number) => {
    Game.ctx.save();
    if (!this.pickedUp) {
      Game.ctx.globalAlpha = this.alpha;
      if (this.alpha < 1) this.alpha += 0.01 * delta;
      this.drawableY = this.y;
      if (this.inChest) {
        this.chestOffsetY -= Math.abs(this.chestOffsetY + 0.5) * 0.035 * delta;

        if (this.chestOffsetY < -0.47) {
          this.chestOffsetY = -0.5;
        }
      }
      if (this.sineAnimateFactor < 1 && this.chestOffsetY < -0.45)
        this.sineAnimateFactor += 0.2 * delta;
      if (this.scaleFactor > 0) this.scaleFactor *= 0.5 ** delta;
      else this.scaleFactor = 0;
      const scale = 1 / (this.scaleFactor + 1);
      Game.ctx.imageSmoothingEnabled = false;

      Game.drawItem(0, 0, 1, 1, this.x, this.y, 1, 1);
      this.frame += (delta * (Math.PI * 2)) / 60;
      Game.drawItem(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x + this.w * (scale * -0.5 + 0.5) + this.drawOffset,
        this.y +
          this.sineAnimateFactor * Math.sin(this.frame) * 0.07 -
          1 +
          this.offsetY +
          this.h * (scale * -0.5 + 0.5) +
          this.chestOffsetY,
        this.w * scale,
        this.h * scale,
        this.level.shadeColor,
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };

  setDrawOffset = () => {
    const itemsOnTile = this.level.items.filter(
      (item) => item.x === this.x && item.y === this.y,
    );
    if (itemsOnTile.length > 1) {
      itemsOnTile.forEach((item) => {
        item.drawOffset =
          (-itemsOnTile.length / 2 + itemsOnTile.indexOf(item) + 1) /
          itemsOnTile.length;
      });
    }
  };

  degrade = () => {
    this.durability -= 1;
  };

  // Function to draw the top layer of the item
  drawTopLayer = (delta: number) => {
    if (this.pickedUp) {
      this.pickupOffsetY += (4.5 - this.pickupOffsetY) * 0.1 * delta;

      //this.x += (Math.sin(Date.now() / 50) * delta) / 10;
      this.alpha *= 0.9 ** delta;
      if (Math.abs(this.alpha) < 0.01) {
        this.drawOffset = 0;
        this.pickupOffsetY = 1;

        this.level.items = this.level.items.filter((x) => x !== this);
      }

      if (GameConstants.ALPHA_ENABLED)
        Game.ctx.globalAlpha = Math.max(0, this.alpha);

      Game.drawItem(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x,
        this.y - this.pickupOffsetY,
        this.w,
        this.h,
      );

      Game.ctx.globalAlpha = 1.0;
    }
  };
  // Function to draw the item's icon
  drawIcon = (delta: number, x: number, y: number, opacity = 1, count?) => {
    if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = opacity;
    this.drawDurability(x, y);
    let shake = 0;
    if (this.durability <= 1 && !this.broken)
      shake =
        Math.round(Math.sin(Date.now() / 25) + 1 / 2) /
        2 /
        GameConstants.TILESIZE;

    Game.drawItem(
      this.tileX,
      this.tileY,
      1,
      2,
      x + shake,
      y - 1,
      this.w,
      this.h,
    );
    Game.ctx.globalAlpha = 1;

    let countToUse = count ? count : this.stackCount;
    let countText = countToUse <= 1 ? "" : "" + countToUse;
    let width = Game.measureText(countText).width;
    let countX = 16 - width;
    let countY = 10;

    Game.fillTextOutline(
      countText,
      x * GameConstants.TILESIZE + countX,
      y * GameConstants.TILESIZE + countY,
      GameConstants.OUTLINE,
      "white",
    );
    this.drawStatus(x, y);
    this.drawBrokenSymbol(x, y);
  };

  // Function to draw the item's durability bar with color transitioning from green to red
  drawDurability = (x: number, y: number) => {
    if (this.durability < this.durabilityMax) {
      // Calculate durability ratio (1 = full, 0 = broken)
      const durabilityRatio = this.durability / this.durabilityMax;

      // Map durability ratio to hue (120 = green, 0 = red)
      let color = Utils.hsvToHex(
        120 * durabilityRatio, // Hue from 120 (green) to 0 (red)
        1, // Full saturation
        1, // Full value
      );

      const iconWidth = GameConstants.TILESIZE;
      const barWidth = Math.ceil(durabilityRatio * iconWidth); // Round to nearest pixel
      const barHeight = 2; // 2 pixels tall

      // Calculate the position of the durability bar
      const barX = Math.round(x * GameConstants.TILESIZE); // Round to nearest pixel
      const barY = Math.round(
        y * GameConstants.TILESIZE + GameConstants.TILESIZE - 2,
      ); // Round to nearest pixel

      // Set the fill style for the durability bar
      Game.ctx.fillStyle = color;
      Game.ctx.imageSmoothingEnabled = false;

      // Draw the durability bar
      Game.ctx.fillRect(barX, barY, barWidth, barHeight);

      // Reset settings
      Game.ctx.fillStyle = "white";
    }
  };
}
