import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Player } from "../player/player";
import { Room } from "../room/room";
import { Sound } from "../sound/sound";
import { Drawable } from "../drawable/drawable";
import { Utils } from "../utility/utils";
import { ItemGroup } from "./itemGroup";
import { Random } from "../utility/random";
import { IdGenerator } from "../globalStateManager/IdGenerator";
import { Shadow } from "../drawable/shadow";
import { statsTracker } from "../game/stats";
import { globalEventBus } from "../event/eventBus";
import { EVENTS } from "../event/events";

// Item class extends Drawable class and represents an item in the game
export class Item extends Drawable {
  // Item properties
  globalId: string;
  x: number; // x-coordinate of the item
  y: number; // y-coordinate of the item
  /**
   * Vertical layer within the room/level. (Particles already use `z` for height physics,
   * so items/entities/projectiles keep `z` for layer.)
   */
  z: number;
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
  iconOffset: number;
  grouped: boolean;
  group: ItemGroup = null;
  degradeable: boolean = true;
  cooldown: number = 0;
  maximumStackCount: number = 8;
  private animStartX: number = 0;
  private animStartY: number = 0;
  private animTargetX: number = 0;
  private animTargetY: number = 0;
  private animT: number = 0;
  private animStartDistance: number = null;
  player: Player;
  // Constructor for the Item class
  constructor(level: Room, x: number, y: number, z: number = 0) {
    super();
    this.globalId = IdGenerator.generate("IT");

    // Initialize properties
    this.level = level;
    this.x = x;
    this.y = y;
    this.z = z;
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
    this.offsetY = -0.5;
    this.name = "item";
    this.startY = y;
    this.randomOffset = Random.rand();
    this.durability = 50;
    this.durabilityMax = 50;
    this.broken = false;
    this.description = "";
    this.drawOffset = 0;
    this.pickupOffsetY = 1;
    this.chestOffsetY = 0;
    this.sineAnimateFactor = 1;
    this.iconOffset = 0;
    this.grouped = false;
    this.group = null;
    this.maximumStackCount = 12;
    this.player = null;
  }

  static add<
    T extends new (room: Room, x: number, y: number, ...rest: any[]) => Item,
  >(this: T, room: Room, x: number, y: number, ...rest: any[]) {
    return new this(room, x, y, ...rest);
  }

  hoverText = () => {
    return this.name;
  };

  get animateToInventory() {
    return GameConstants.AUTO_PICKUP_ITEMS.includes(
      this.constructor as new (...args: any[]) => Item,
    );
  }

  // Empty tick function to be overridden by subclasses
  tick = () => {};
  // Empty tick function for inventory behavior to be overridden by subclasses
  tickInInventory = () => {};

  // Function to get description of the item, to be overridden by subclasses
  getDescription = (): string => {
    const stackText = this.stackable ? `\nAmount: ${this.stackCount}` : "";
    return `${this.name} \n${this.description} \n${stackText}`;
  };

  animateFromChest = () => {
    this.chestOffsetY = 0.5;
    this.alpha = 0;
    this.inChest = true;
    this.sineAnimateFactor = 0;
    this.setDrawOffset();
  };

  // Function to play sound when item is picked up
  pickupSound = () => {
    let delay = 0;
    if (GameConstants.ITEM_AUTO_PICKUP && this.animateToInventory)
      delay = Math.ceil(Random.rand() * 200 + 400);

    if (this.level === this.level.game.room)
      Sound.delayPlay(Sound.genericPickup, delay);
  };

  // Empty function to be called when item is dropped, to be overridden by subclasses
  onDrop = () => {};
  // Function to be called when item is picked up
  onPickup = (player: Player) => {
    if (!player.inventory.canPickup(this)) return;
    this.player = player;
    if (!this.pickedUp) {
      this.startY = player.y;

      this.drawableY = this.y;
      this.alpha = 1;
      this.pickedUp = player.inventory.addItem(this);
      if (this.pickedUp) {
        // Initialize lerp-to-inventory animation
        if (this.animateToInventory === true) {
          this.animStartX = this.x;
          this.animStartY = this.y;
          this.animTargetX = this.player.x;
          this.animTargetY = this.player.y;
          this.animT = 0;
        }
        if (this.isNewItem(player)) {
          this.pickupMessage();

          player.inventory.foundItems.push(this);
        }
        this.pickupSound();

        // Emit item collected event for statistics tracking
        globalEventBus.emit(EVENTS.ITEM_COLLECTED, { itemId: this.name });

        if (this.grouped) {
          statsTracker.recordWeaponChoice(this.name);

          this.group.destroyOtherItems(this);
          this.grouped = false;
          this.group = null;
        }
      }
    }
  };

  autoPickup = () => {
    if (GameConstants.ITEM_AUTO_PICKUP && this.animateToInventory) {
      this.onPickup(this.level.game.players[this.level.game.localPlayerID]);
    }
  };

  pickupMessage = () => {
    const name = (this.constructor as typeof Item).itemName;
    let message = this.stackable
      ? `You find ${this.stackCount} ${name}.`
      : `You find a ${name}.`;

    if (this.stackCount > 1 && this.name === "coin") {
      message = `You find ${this.stackCount} ${name}s.`;
    }

    this.level.game.pushMessage(message);
  };

  isNewItem = (player: Player) => {
    for (let item of player.inventory.foundItems) {
      if (item.constructor === this.constructor) {
        return false;
      }
    }
    return true;
  };

  dropFromInventory = () => {
    this.setDrawOffset();
  };

  // Function to get the amount of shade at the item's location
  shadeAmount = () => {
    if (
      GameConstants.SMOOTH_LIGHTING &&
      !GameConstants.SHADE_INLINE_IN_ENTITY_LAYER
    )
      return 0;
    if (!this.level.softVis[this.x]) {
      console.warn(
        "tried to get shade for tile that does not exist",
        this.x,
        this.y,
      );
      return 0;
    }
    return this.level.softVis[this.x]?.[this.y];
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

  destroy() {
    this.pickedUp = true;
    //this.level.items = this.level.items.filter((x) => x !== this);
  }

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
      if (this.scaleFactor > 0) {
        this.scaleFactor *= 0.5 ** delta;
        if (this.scaleFactor < 0.01) this.scaleFactor = 0;
      }
      const scale = 1 / (this.scaleFactor + 1);
      Game.ctx.imageSmoothingEnabled = false;
      Shadow.draw(this.x, this.y, 1, 1);
      //Game.drawItem(0, 0, 1, 1, this.x, this.y, 1, 1);
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
    if (this.degradeable) this.durability -= 1;
  };

  drawAboveShading = (delta: number) => {
    if (this.pickedUp) {
      if (this.animateToInventory === true && this.player) {
        // Lerp towards the inventory button with ease-out
        const speed = 0.025 * delta; // slower overall speed
        this.animT = Math.min(1, this.animT + speed);
        const t = Math.pow(this.animT, 2); // ease-in cubic
        const posX =
          this.animStartX * (1 - t) +
          this.animTargetX * t +
          (this.player.x - this.animTargetX - this.player.drawX) * t +
          this.drawOffset;
        const posY =
          this.animStartY * (1 - t) +
          this.animTargetY * t +
          (this.player.y - this.animTargetY - this.player.drawY) * t +
          this.chestOffsetY;

        if (this.animStartDistance === null) {
          this.animStartDistance = Utils.distance(
            this.player.x - this.player.drawX,
            this.player.y - this.player.drawY,
            posX,
            posY,
          );
        }
        const distance = Math.abs(
          Utils.distance(
            this.player.x - this.player.drawX,
            this.player.y - this.player.drawY,
            posX,
            posY,
          ),
        );
        // Fade near the end
        const fadeStart = 0.5;
        if (t > fadeStart) {
          const k = (t - fadeStart) / (1 - fadeStart);
          this.alpha = Math.max(
            1 - k,
            Math.abs(distance / this.animStartDistance),
          );
        }

        if (GameConstants.ALPHA_ENABLED)
          Game.ctx.globalAlpha = Math.max(0, this.alpha);
        this.x = Math.floor(posX);
        this.y = Math.floor(posY);

        Game.drawItem(
          this.tileX,
          this.tileY,
          1,
          2,
          posX,
          posY - 1.5, // + diffY,
          this.w,
          this.h,
          this.level.shadeColor,
          this.shadeAmount(),
        );
        Game.ctx.globalAlpha = 1.0;

        if (this.animT >= 1) {
          //this.animateToInventory = false;
          this.level.items = this.level.items.filter((x) => x !== this);
        }
        return;
      } else {
        return;
      }
    }
  };

  // Function to draw the top layer of the item
  drawTopLayer = (delta: number) => {
    if (this.pickedUp) {
      if (this.animateToInventory === false) {
        this.pickupOffsetY += (4.5 - this.pickupOffsetY) * 0.1 * delta;
      } else return;

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

  outline = () => {
    return {
      color: "white",
      opacity: 0,
      offset: 0,
      manhattan: false,
    };
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

    if (this.cooldown > 0) {
      Game.ctx.globalAlpha = 0.35;
    }

    Game.drawItem(
      this.tileX,
      this.tileY,
      1,
      2,
      x + shake,
      y - 1 + this.iconOffset,
      this.w,
      this.h,
      undefined,
      undefined,
      undefined,
      this.outline().color,
      this.outline().opacity,
      this.outline().offset,
      this.outline().manhattan,
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
    this.drawCooldown(x, y);

    this.drawStatus(x, y);
    this.drawBrokenSymbol(x, y);
  };

  drawCooldown = (x: number, y: number) => {
    if (this.cooldown > 0) {
      Game.fillTextOutline(
        this.cooldown.toString(),
        x * GameConstants.TILESIZE + 10,
        y * GameConstants.TILESIZE + 10,
        GameConstants.OUTLINE,
        "white",
      );
    }
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
      const barX = Math.ceil(x * GameConstants.TILESIZE); // Round to nearest pixel
      const barY = Math.ceil(
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
