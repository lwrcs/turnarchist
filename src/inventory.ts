import { Item } from "./item/item";
import { LevelConstants } from "./levelConstants";
import { Game } from "./game";
import { Key } from "./item/key";
import { GameConstants } from "./gameConstants";
import { Equippable } from "./item/equippable";
import { Armor } from "./item/armor";
import { GoldenKey } from "./item/goldenKey";
import { Coin } from "./item/coin";
import { Gold } from "./item/gold";
import { GreenGem } from "./item/greengem";
import { Coal } from "./item/coal";
import { Weapon } from "./weapon/weapon";
import { Dagger } from "./weapon/dagger";
import { Room } from "./room";
import { Usable } from "./item/usable";
import { Shotgun } from "./weapon/shotgun";
import { DualDagger } from "./weapon/dualdagger";
import { Candle } from "./item/candle";
import { Torch } from "./item/torch";
import { Lantern } from "./item/lantern";
import { Player } from "./player";
import { Spear } from "./weapon/spear";
import { Pickaxe } from "./weapon/pickaxe";
import { Spellbook } from "./weapon/spellbook";
import { Backpack } from "./item/backpack";
import { Slingshot } from "./weapon/slingshot";
import { Heart } from "./item/heart";
import { MouseCursor } from "./mouseCursor";
import { Warhammer } from "./weapon/warhammer";
import { GodStone } from "./item/godStone";
import { Input } from "./input";

let OPEN_TIME = 100; // milliseconds
// Dark gray color used for the background of inventory slots
let FILL_COLOR = "#5a595b";
// Very dark blue-gray color used for outlines and borders
let OUTLINE_COLOR = "#292c36";
// Light blue color used to indicate equipped items
let EQUIP_COLOR = "#85a8e6";
// White color used for the outer border of the inventory
let FULL_OUTLINE = "white";

export class Inventory {
  player: Player;
  items: Array<Item | null>;
  rows = 3;
  cols = 5;
  selX = 0;
  selY = 0;
  game: Game;
  isOpen: boolean = false;
  openTime: number = Date.now();
  coins: number = 0;
  equipAnimAmount: Array<number>;
  weapon: Weapon | null = null;
  expansion: number = 0;
  grabbedItem: Item | null = null;
  private _mouseDownStartX: number | null = null;
  private _mouseDownStartY: number | null = null;
  private _mouseDownItem: Item | null = null;
  private _wasHoldDetected: boolean = false;
  private _isDragging: boolean = false;
  private _dragStartItem: Item | null = null;
  private _dragStartSlot: number | null = null;
  private itemEquipAnimations: Map<Item, number> = new Map();

  constructor(game: Game, player: Player) {
    this.game = game;
    this.player = player;
    Input.mouseDownListeners.push((x, y, button) =>
      this.handleMouseDown(x, y, button),
    );
    Input.mouseUpListeners.push((x, y, button) =>
      this.handleMouseUp(x, y, button),
    );
    Input.holdCallback = () => this.onHoldDetected();

    this.items = new Array<Item | null>(
      (this.rows + this.expansion) * this.cols,
    ).fill(null);
    this.equipAnimAmount = new Array<number>(
      (this.rows + this.expansion) * this.cols,
    ).fill(0);
    let a = (i: Item | null) => {
      if (i === null) return;
      if (i instanceof Equippable) {
        i.setWielder(this.player);
      }
      if (i instanceof Weapon && this.weapon === null) {
        i.toggleEquip();
        this.weapon = i;
        //this.player.weapon = this.weapon;
      }

      this.addItem(i);
    };
    let startingInv = GameConstants.DEVELOPER_MODE
      ? GameConstants.STARTING_DEV_INVENTORY
      : GameConstants.STARTING_INVENTORY;

    startingInv.forEach((item) => {
      a(new item({ game: this.game } as Room, 0, 0));
    });

    Input.mouseDownListeners.push((x, y, button) =>
      this.handleMouseDown(x, y, button),
    );
    Input.mouseUpListeners.push((x, y, button) =>
      this.handleMouseUp(x, y, button),
    );
  }

  clear = () => {
    this.items.fill(null);
    this.equipAnimAmount.fill(0);
  };

  open = () => {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.openTime = Date.now();
    if (!this.isOpen) {
      this.selY = 0;
    }
  };

  close = () => {
    this.isOpen = false;
    if (this.selY > 0) {
      this.selY = 0;
    }
  };

  left = () => {
    if (this.selX > 0) {
      this.selX--;
    }
  };

  right = () => {
    if (this.selX < this.cols - 1) {
      this.selX++;
    }
  };

  up = () => {
    if (this.selY > 0) {
      this.selY--;
    }
  };

  down = () => {
    if (this.selY < this.rows + this.expansion - 1) {
      this.selY++;
    }
  };

  space = () => {
    this.itemUse();
  };

  itemAtSelectedSlot = (): Item | null => {
    let index = this.selX + this.selY * this.cols;
    if (index < 0 || index >= this.items.length) {
      return null;
    }
    return this.items[index];
  };

  getIndexOfItem = (item: Item): number => {
    if (item === null) return -1;
    return this.items.indexOf(item);
  };

  itemUse = () => {
    let index = this.selX + this.selY * this.cols;
    if (index < 0 || index >= this.items.length) return;
    const item = this.items[index];
    if (item instanceof Usable) {
      item.onUse(this.player);
      //this.items[index] = null; // Optionally remove the item after use
    } else if (item instanceof Equippable) {
      // Don't equip on the same tick as using an item
      item.toggleEquip();
      if (item instanceof Weapon) {
        this.weapon = item.equipped ? item : null;
      }
      if (item.equipped) {
        this.items.forEach((i, idx) => {
          if (i instanceof Equippable && i !== item && !item.coEquippable(i)) {
            i.equipped = false;
            this.equipAnimAmount[idx] = 0;
          }
        });
      }
    }
  };

  mouseLeftClick = () => {
    const { x, y } = MouseCursor.getInstance().getPosition();
    const bounds = this.isPointInInventoryBounds(x, y);

    // Only close inventory if clicking outside
    if (!bounds.inBounds && !this.isPointInQuickbarBounds(x, y).inBounds) {
      this.close();
    }
  };

  mouseRightClick = () => {
    const { x, y } = MouseCursor.getInstance().getPosition();
    const bounds = this.isPointInInventoryBounds(x, y);

    if (bounds.inBounds) {
      this.drop();
    }
  };

  leftQuickbar = () => {
    this.left();
  };

  rightQuickbar = () => {
    this.right();
  };

  spaceQuickbar = () => {
    this.itemUse();
  };

  handleNumKey = (num: number) => {
    this.selX = Math.max(0, Math.min(num - 1, this.cols - 1));
    this.selY = 0;
    this.itemUse();
  };

  mouseMove = () => {
    const { x, y } = MouseCursor.getInstance().getPosition();
    const bounds = this.isPointInInventoryBounds(x, y);

    if (bounds.inBounds) {
      const s = this.isOpen
        ? Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME)
        : 18;
      const b = 2;
      const g = -2;

      const oldSelX = this.selX;
      const oldSelY = this.selY;

      this.selX = Math.max(
        0,
        Math.min(
          Math.floor((x - bounds.startX) / (s + 2 * b + g)),
          this.cols - 1,
        ),
      );
      this.selY = this.isOpen
        ? Math.max(
            0,
            Math.min(
              Math.floor((y - bounds.startY) / (s + 2 * b + g)),
              this.rows + this.expansion - 1,
            ),
          )
        : 0;

      if (oldSelX !== this.selX || oldSelY !== this.selY) {
      }
    }
  };

  moveItemToSlot = (
    item: Item | null,
    index: number,
    otherItem: Item | null,
    otherIndex: number,
  ) => {
    if (item === null) return;

    // Preserve animation states before moving
    const itemAnim = this.equipAnimAmount[index];
    const otherAnim = otherItem ? this.equipAnimAmount[otherIndex] : 0;

    if (otherItem === null) {
      this.items[index] = item;
      this.equipAnimAmount[index] = this.itemEquipAnimations.get(item) ?? 0;
    } else {
      this.items[index] = otherItem;
      this.items[otherIndex] = item;
      this.equipAnimAmount[index] =
        this.itemEquipAnimations.get(otherItem) ?? 0;
      this.equipAnimAmount[otherIndex] =
        this.itemEquipAnimations.get(item) ?? 0;
    }
  };

  grabItem = (item: Item) => {
    if (item === null) {
      return;
    }
    if (this.grabbedItem !== null) {
      return;
    }

    // Remove the item from its slot when grabbed
    const index = this.getIndexOfItem(item);

    if (index !== -1) {
      this.items[index] = null;
      this.grabbedItem = item;
    } else {
    }
  };

  releaseItem = () => {
    if (this.grabbedItem === null) {
      return;
    }

    const targetIndex = this.selX + this.selY * this.cols;
    const existingItem = this.items[targetIndex];

    // If target slot is empty, place item there
    if (existingItem === null) {
      this.items[targetIndex] = this.grabbedItem;
    } else {
      // Swap items
      this.items[targetIndex] = this.grabbedItem;
    }

    this.grabbedItem = null;
  };

  drawDraggedItem = (delta: number) => {
    if (this.grabbedItem === null) return;
    const { x, y } = MouseCursor.getInstance().getPosition();

    let item = this.grabbedItem;
    const drawX = x - 0.5 * GameConstants.TILESIZE;
    const drawY = y - 0.5 * GameConstants.TILESIZE;
    const drawXScaled = drawX / GameConstants.TILESIZE;
    const drawYScaled = drawY / GameConstants.TILESIZE;
    item.drawIcon(delta, drawXScaled, drawYScaled);
  };

  drop = () => {
    let index = this.selX + this.selY * this.cols;
    if (index < 0 || index >= this.items.length) return;
    const item = this.items[index];
    if (item === null) return;
    this.dropItem(item, index);
  };

  dropItem = (item: Item, index: number) => {
    item.level = this.game.rooms[this.player.levelID];
    item.x = this.player.x;
    item.y = this.player.y;
    item.alpha = 1;
    item.pickedUp = false;
    item.dropFromInventory();
    this.equipAnimAmount[index] = 0;
    this.game.rooms[this.player.levelID].items.push(item);
    this.items[index] = null;
  };

  dropFromInventory = () => {
    // Intentionally left blank or implement if needed
  };

  hasItem = <T extends Item>(itemType: new (...args: any[]) => T): T | null => {
    return this.items.find((i): i is T => i instanceof itemType) || null;
  };

  hasItemCount = (item: Item | null): boolean => {
    if (item === null) return false;
    if (item instanceof Coin) return this.coinCount() >= item.stackCount;
    return this.items.some(
      (i) =>
        i !== null &&
        i.constructor === item.constructor &&
        i.stackCount >= item.stackCount,
    );
  };

  subtractItemCount = (item: Item | null) => {
    if (item === null) return;
    if (item instanceof Coin) {
      this.subtractCoins(item.stackCount);
      return;
    }
    this.items.forEach((i, idx) => {
      if (i === null) return;
      if (i.constructor === item.constructor) {
        i.stackCount -= item.stackCount;
        if (i.stackCount <= 0) {
          this.items[idx] = null;
        }
      }
    });
  };

  coinCount = (): number => {
    return this.coins;
  };

  subtractCoins = (n: number) => {
    this.coins = Math.max(0, this.coins - n);
  };

  addCoins = (n: number) => {
    this.coins += n;
  };

  isFull = (): boolean => {
    return (
      this.items.filter((i) => i !== null).length >=
      (this.rows + this.expansion) * this.cols
    );
  };

  addItem = (item: Item | null): boolean => {
    if (item === null) return false;
    if (item instanceof Coin) {
      this.coins += item.stack;
      return true;
    }
    if (item instanceof Equippable) {
      item.setWielder(this.player);
    }
    if (item.stackable) {
      for (let i = 0; i < this.items.length; i++) {
        if (
          this.items[i] !== null &&
          this.items[i]!.constructor === item.constructor
        ) {
          this.items[i]!.stackCount += item.stackCount;
          return true;
        }
      }
    }
    if (!this.isFull()) {
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i] === null) {
          this.items[i] = item;
          return true;
        }
      }
    }
    return false;
  };

  removeItem = (item: Item | null) => {
    if (item === null) return;
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items[index] = null;
    }
  };

  getArmor = (): Armor | null => {
    return (
      this.items.find((i): i is Armor => i instanceof Armor && i.equipped) ||
      null
    );
  };

  hasWeapon = (): boolean => {
    return this.weapon !== null;
  };

  getWeapon = (): Weapon | null => {
    return this.weapon;
  };

  tick = () => {
    this.items.forEach((i) => {
      if (i !== null) i.tickInInventory();
    });

    // Check for drag initiation
    this.checkForDragStart();
  };

  textWrap = (text: string, x: number, y: number, maxWidth: number): number => {
    // Returns y value for next line
    if (text === "") return y;
    let words = text.split(" ");
    let line = "";

    while (words.length > 0) {
      if (Game.measureText(line + words[0]).width > maxWidth) {
        Game.fillText(line, x, y);
        line = "";
        y += 8;
      } else {
        if (line !== "") line += " ";
        line += words[0];
        words.splice(0, 1);
      }
    }
    if (line.trim() !== "") {
      Game.fillText(line, x, y);
      y += 8;
    }
    return y;
  };

  drawCoins = (delta: number) => {
    const coinX = LevelConstants.SCREEN_W - 1;
    const coinY = LevelConstants.SCREEN_H - 1;

    Game.drawItem(19, 0, 1, 2, coinX, coinY - 1, 1, 2);

    const countText = `${this.coins}`;
    const width = Game.measureText(countText).width;
    const countX = 4 - width;
    const countY = -1;

    Game.fillTextOutline(
      countText,
      coinX * GameConstants.TILESIZE + countX,
      coinY * GameConstants.TILESIZE + countY,
      GameConstants.OUTLINE,
      "white",
    );

    const turnCountText = `${this.player.turnCount}`;
    Game.fillTextOutline(
      turnCountText,
      coinX * GameConstants.TILESIZE + countX,
      coinY * GameConstants.TILESIZE + countY - 15,
      GameConstants.OUTLINE,
      "white",
    );
  };

  pointInside = (x: number, y: number): boolean => {
    const s = Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME); // size of box
    const b = 2; // border
    const g = -2; // gap
    const hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
    const ob = 1; // outer border
    const width = this.cols * (s + 2 * b + g) - g;
    const height = (this.rows + this.expansion) * (s + 2 * b + g) - g;

    const startX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) - ob;
    const startY = this.isOpen
      ? Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height) - ob
      : GameConstants.HEIGHT - (s + 2 * b) - 5 - ob;
    const checkHeight = this.isOpen ? height + 2 * ob : s + 2 * b + 2 * ob;

    return (
      x >= startX &&
      x <= startX + width + 2 * ob &&
      y >= startY &&
      y <= startY + checkHeight
    );
  };

  drawQuickbar = (delta: number) => {
    const { x, y } = MouseCursor.getInstance().getPosition();
    const isInBounds = this.isPointInInventoryBounds(x, y).inBounds;

    const s = 18; // size of box
    const b = 2; // border
    const g = -2; // gap
    const hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
    const ob = 1; // outer border
    const width = this.cols * (s + 2 * b + g) - g;
    const height = s + 2 * b;
    const startX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width);
    const startY = GameConstants.HEIGHT - height - 5; // 5 pixels from bottom

    // Draw main background
    Game.ctx.fillStyle = FULL_OUTLINE;
    Game.ctx.fillRect(startX - ob, startY - 1, width + 2, height + 2);

    // Draw highlighted background for selected item only if mouse is in bounds
    if (isInBounds) {
      Game.ctx.fillRect(
        startX + this.selX * (s + 2 * b + g) - hg - ob,
        startY - hg - ob,
        s + 2 * b + 2 * hg + 2 * ob,
        s + 2 * b + 2 * hg + 2 * ob,
      );
    }

    // Draw individual item slots
    for (let xIdx = 0; xIdx < this.cols; xIdx++) {
      // Draw slot outline
      Game.ctx.fillStyle = OUTLINE_COLOR;
      Game.ctx.fillRect(
        startX + xIdx * (s + 2 * b + g),
        startY,
        s + 2 * b,
        s + 2 * b,
      );

      // Draw slot background
      Game.ctx.fillStyle = FILL_COLOR;
      Game.ctx.fillRect(startX + xIdx * (s + 2 * b + g) + b, startY + b, s, s);

      // Draw equip animation (this should always show)
      const idx = xIdx;
      Game.ctx.fillStyle = EQUIP_COLOR;
      const yOff = s * (1 - this.equipAnimAmount[idx]);
      Game.ctx.fillRect(
        startX + xIdx * (s + 2 * b + g) + b,
        startY + b + yOff,
        s,
        s - yOff,
      );

      // Draw item icon if exists
      if (idx < this.items.length && this.items[idx] !== null) {
        const drawX =
          startX +
          xIdx * (s + 2 * b + g) +
          b +
          Math.floor(0.5 * s) -
          0.5 * GameConstants.TILESIZE;
        const drawY =
          startY + b + Math.floor(0.5 * s) - 0.5 * GameConstants.TILESIZE;
        const drawXScaled = drawX / GameConstants.TILESIZE;
        const drawYScaled = drawY / GameConstants.TILESIZE;
        this.items[idx]!.drawIcon(delta, drawXScaled, drawYScaled);
      }
    }

    // Draw selection box only if mouse is in bounds
    if (isInBounds) {
      const selStartX = startX + this.selX * (s + 2 * b + g);
      const selStartY = startY;

      // Outer selection box (dark)
      Game.ctx.fillStyle = OUTLINE_COLOR;
      Game.ctx.fillRect(
        selStartX - hg,
        selStartY - hg,
        s + 2 * b + 2 * hg,
        s + 2 * b + 2 * hg,
      );

      // Inner selection box (light grey)
      Game.ctx.fillStyle = FILL_COLOR;
      Game.ctx.fillRect(
        selStartX + b - hg,
        selStartY + b - hg,
        s + 2 * hg,
        s + 2 * hg,
      );

      // Draw equip animation for selected slot with highlight
      const idx = this.selX;
      Game.ctx.fillStyle = EQUIP_COLOR;
      const yOff = (s + 2 * hg) * (1 - this.equipAnimAmount[idx]);
      Game.ctx.fillRect(
        Math.round(startX + this.selX * (s + 2 * b + g) + b - hg),
        Math.round(startY + b + yOff - hg),
        s + 2 * hg,
        s + 2 * hg - yOff,
      );

      // Redraw the selected item
      if (idx < this.items.length && this.items[idx] !== null) {
        const drawX =
          selStartX + b + Math.floor(0.5 * s) - 0.5 * GameConstants.TILESIZE;
        const drawY =
          selStartY + b + Math.floor(0.5 * s) - 0.5 * GameConstants.TILESIZE;
        const drawXScaled = drawX / GameConstants.TILESIZE;
        const drawYScaled = drawY / GameConstants.TILESIZE;
        this.items[idx]!.drawIcon(delta, drawXScaled, drawYScaled);
      }
    }
  };

  updateEquipAnimAmount = (delta: number) => {
    this.equipAnimAmount.forEach((amount, idx) => {
      const item = this.items[idx];
      if (item instanceof Equippable) {
        let targetAmount = item.equipped ? 1 : 0;
        let currentAmount = this.itemEquipAnimations.get(item) ?? amount;

        currentAmount += 0.2 * delta * (targetAmount - currentAmount);
        currentAmount = Math.max(0, Math.min(1, currentAmount));

        this.itemEquipAnimations.set(item, currentAmount);
        this.equipAnimAmount[idx] = currentAmount;
      } else {
        this.equipAnimAmount[idx] = 0;
        if (item) this.itemEquipAnimations.delete(item);
      }
    });
  };

  draw = (delta: number) => {
    const { x, y } = MouseCursor.getInstance().getPosition();
    const isInBounds = this.isPointInInventoryBounds(x, y).inBounds;

    // Draw coins and quickbar (these are always visible)
    this.drawCoins(delta);
    this.drawQuickbar(delta);
    this.updateEquipAnimAmount(delta);

    if (this.isOpen) {
      // Draw semi-transparent background for full inventory
      Game.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

      Game.ctx.globalAlpha = 1;

      // Define dimensions and styling variables (similar to drawQuickbar)
      const s = Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME); // size of box
      const b = 2; // border
      const g = -2; // gap
      const hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
      const invRows = this.rows + this.expansion;
      const ob = 1; // outer border
      const width = this.cols * (s + 2 * b + g) - g;
      const height = invRows * (s + 2 * b + g) - g;

      // Draw main inventory background (similar to drawQuickbar)
      Game.ctx.fillStyle = FULL_OUTLINE;
      const mainBgX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) - ob;
      const mainBgY =
        Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height) - ob;
      Game.ctx.fillRect(mainBgX, mainBgY, width + 2 * ob, height + 2 * ob);

      // Draw highlighted background for selected item only if mouse is in bounds
      if (isInBounds) {
        const highlightX =
          Math.round(
            0.5 * GameConstants.WIDTH -
              0.5 * width +
              this.selX * (s + 2 * b + g),
          ) -
          hg -
          ob;
        const highlightY =
          Math.round(
            0.5 * GameConstants.HEIGHT -
              0.5 * height +
              this.selY * (s + 2 * b + g),
          ) -
          hg -
          ob;

        Game.ctx.fillRect(
          highlightX,
          highlightY,
          s + 2 * b + 2 * hg + 2 * ob,
          s + 2 * b + 2 * hg + 2 * ob,
        );
      }

      // Draw individual inventory slots (similar to drawQuickbar, but for all rows)
      for (let xIdx = 0; xIdx < this.cols; xIdx++) {
        for (let yIdx = 0; yIdx < this.rows + this.expansion; yIdx++) {
          // Draw slot outline
          const slotX = Math.round(
            0.5 * GameConstants.WIDTH - 0.5 * width + xIdx * (s + 2 * b + g),
          );
          const slotY = Math.round(
            0.5 * GameConstants.HEIGHT - 0.5 * height + yIdx * (s + 2 * b + g),
          );
          Game.ctx.fillStyle = OUTLINE_COLOR;
          Game.ctx.fillRect(slotX, slotY, s + 2 * b, s + 2 * b);

          // Draw slot background
          Game.ctx.fillStyle = FILL_COLOR;
          Game.ctx.fillRect(slotX + b, slotY + b, s, s);

          // Draw equip animation (unique to full inventory view)
          const idx = xIdx + yIdx * this.cols;
          Game.ctx.fillStyle = EQUIP_COLOR;
          const yOff = s * (1 - this.equipAnimAmount[idx]);
          Game.ctx.fillRect(slotX + b, slotY + b + yOff, s, s - yOff);

          // Draw item icon if exists
          if (idx < this.items.length && this.items[idx] !== null) {
            const drawX =
              0.5 * GameConstants.WIDTH -
              0.5 * width +
              xIdx * (s + 2 * b + g) +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE;
            const drawY =
              0.5 * GameConstants.HEIGHT -
              0.5 * height +
              yIdx * (s + 2 * b + g) +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE;
            const drawXScaled = drawX / GameConstants.TILESIZE;
            const drawYScaled = drawY / GameConstants.TILESIZE;
            this.items[idx]!.drawIcon(delta, drawXScaled, drawYScaled);
          }
        }
      }

      // Draw item icons after animation delay (similar to drawQuickbar, but for all items)
      if (Date.now() - this.openTime >= OPEN_TIME) {
        this.items.forEach((item, idx) => {
          if (item === null) return;
          const x = idx % this.cols;
          const y = Math.floor(idx / this.cols);

          const drawX =
            0.5 * GameConstants.WIDTH -
            0.5 * width +
            x * (s + 2 * b + g) +
            b +
            Math.floor(0.5 * s) -
            0.5 * GameConstants.TILESIZE;
          const drawY =
            0.5 * GameConstants.HEIGHT -
            0.5 * height +
            y * (s + 2 * b + g) +
            b +
            Math.floor(0.5 * s) -
            0.5 * GameConstants.TILESIZE;

          const drawXScaled = drawX / GameConstants.TILESIZE;
          const drawYScaled = drawY / GameConstants.TILESIZE;

          item.drawIcon(delta, drawXScaled, drawYScaled);
        });

        // Draw selection box and related elements only if mouse is in bounds
        if (isInBounds) {
          // Draw selection box
          Game.ctx.fillStyle = OUTLINE_COLOR;
          Game.ctx.fillRect(
            0.5 * GameConstants.WIDTH -
              0.5 * width +
              this.selX * (s + 2 * b + g) -
              hg,
            0.5 * GameConstants.HEIGHT -
              0.5 * height +
              this.selY * (s + 2 * b + g) -
              hg,
            s + 2 * b + 2 * hg,
            s + 2 * b + 2 * hg,
          );

          const slotX = Math.round(
            0.5 * GameConstants.WIDTH -
              0.5 * width +
              this.selX * (s + 2 * b + g) +
              b -
              hg,
          );
          const slotY = Math.round(
            0.5 * GameConstants.HEIGHT -
              0.5 * height +
              this.selY * (s + 2 * b + g) +
              b -
              hg,
          );
          Game.ctx.fillStyle = FILL_COLOR;
          Game.ctx.fillRect(slotX, slotY, s + 2 * hg, s + 2 * hg);

          // Draw equip animation for selected item (unique to full inventory view)
          const idx = this.selX + this.selY * this.cols;
          if (idx < this.items.length && this.items[idx] !== null) {
            Game.ctx.fillStyle = EQUIP_COLOR;
            const yOff = (s + 2 * hg) * (1 - this.equipAnimAmount[idx]);
            Game.ctx.fillRect(
              0.5 * GameConstants.WIDTH -
                0.5 * width +
                this.selX * (s + 2 * b + g) +
                b -
                hg,
              0.5 * GameConstants.HEIGHT -
                0.5 * height +
                this.selY * (s + 2 * b + g) +
                b -
                hg +
                yOff,
              s + 2 * hg,
              s + 2 * hg - yOff,
            );

            // Redraw selected item icon (similar to drawQuickbar)
            const drawX =
              0.5 * GameConstants.WIDTH -
              0.5 * width +
              this.selX * (s + 2 * b + g) +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE;
            const drawY =
              0.5 * GameConstants.HEIGHT -
              0.5 * height +
              this.selY * (s + 2 * b + g) +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE;

            const drawXScaled = drawX / GameConstants.TILESIZE;
            const drawYScaled = drawY / GameConstants.TILESIZE;

            this.items[idx]!.drawIcon(delta, drawXScaled, drawYScaled);
          }
        }

        // Draw item description and action text (unique to full inventory view)
        const selectedIdx = this.selX + this.selY * this.cols;

        if (
          selectedIdx < this.items.length &&
          this.items[selectedIdx] !== null
        ) {
          const item = this.items[selectedIdx]!;
          Game.ctx.fillStyle = "white";

          // Determine action text
          let topPhrase = "";
          if (item instanceof Equippable) {
            topPhrase = item.equipped
              ? "[SPACE] to unequip"
              : "[SPACE] to equip";
          }
          if (item instanceof Usable) {
            topPhrase = "[SPACE] to use";
          }

          // Draw action text
          const actionTextWidth = Game.measureText(topPhrase).width;
          Game.fillText(
            topPhrase,
            0.5 * (GameConstants.WIDTH - actionTextWidth),
            5,
          );

          // Draw item description
          const lines = item.getDescription().split("\n");
          let nextY = Math.round(
            0.5 * GameConstants.HEIGHT -
              0.5 * height +
              (this.rows + this.expansion) * (s + 2 * b + g) +
              b +
              5,
          );
          lines.forEach((line) => {
            nextY = this.textWrap(line, 5, nextY, GameConstants.WIDTH - 10);
          });
        }
      }
    }
    this.drawDraggedItem(delta);
  };

  private isPointInInventoryBounds = (
    x: number,
    y: number,
  ): { inBounds: boolean; startX: number; startY: number } => {
    const s = this.isOpen
      ? Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME)
      : 18;
    const b = 2; // border
    const g = -2; // gap
    const hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
    const ob = 1; // outer border
    const width = this.cols * (s + 2 * b + g) - g;

    let startX: number;
    let startY: number;
    let height: number;

    if (this.isOpen) {
      // Full inventory bounds
      height = (this.rows + this.expansion) * (s + 2 * b + g) - g;
      startX = 0.5 * GameConstants.WIDTH - 0.5 * width;
      startY = 0.5 * GameConstants.HEIGHT - 0.5 * height;
    } else {
      // Quickbar bounds
      height = s + 2 * b;
      startX = 0.5 * GameConstants.WIDTH - 0.5 * width;
      startY = GameConstants.HEIGHT - height - 5;
    }

    const inBounds =
      x >= startX - ob &&
      x <= startX + width + ob &&
      y >= startY - ob &&
      y <= startY + height + ob;

    return {
      inBounds,
      startX,
      startY,
    };
  };

  isPointInQuickbarBounds = (
    x: number,
    y: number,
  ): { inBounds: boolean; startX: number; startY: number } => {
    const s = this.isOpen
      ? Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME)
      : 18;
    const b = 2; // border
    const g = -2; // gap
    const width = this.cols * (s + 2 * b + g) - g;
    const startX = 0.5 * GameConstants.WIDTH - 0.5 * width;
    const startY = GameConstants.HEIGHT - (s + 2 * b) - 5;
    const quickbarHeight = s + 2 * b;

    const inBounds =
      x >= startX &&
      x <= startX + width &&
      y >= startY &&
      y <= startY + quickbarHeight;

    return {
      inBounds,
      startX,
      startY,
    };
  };

  isPointInInventoryButton = (x: number, y: number): boolean => {
    const tX = x / GameConstants.TILESIZE;
    const tY = y / GameConstants.TILESIZE;
    return (
      tX >= LevelConstants.SCREEN_W - 2 &&
      tX <= LevelConstants.SCREEN_W &&
      tY >= 0 &&
      tY <= 2
    );
  };

  handleMouseDown = (x: number, y: number, button: number) => {
    // Ignore if not left click
    if (button !== 0) return;

    const bounds = this.isPointInInventoryBounds(x, y);
    if (bounds.inBounds) {
      const selectedItem = this.itemAtSelectedSlot();
      if (selectedItem !== null) {
        this._dragStartItem = selectedItem;
        this._dragStartSlot = this.selX + this.selY * this.cols;
      }
    }
  };

  onHoldDetected = () => {
    if (this._dragStartItem !== null && !this._isDragging) {
      this._isDragging = true;
      this.grabbedItem = this._dragStartItem;

      // Remove item from original slot
      if (this._dragStartSlot !== null) {
        this.items[this._dragStartSlot] = null;
      }
    }
  };

  handleMouseUp = (x: number, y: number, button: number) => {
    // Ignore if not left click
    if (button !== 0) return;

    const invBounds = this.isPointInInventoryBounds(x, y);
    const quickbarBounds = this.isPointInQuickbarBounds(x, y);
    const isValidDropZone = this.isOpen
      ? invBounds.inBounds
      : quickbarBounds.inBounds;

    if (isValidDropZone) {
      if (this._isDragging && this.grabbedItem !== null) {
        // We were dragging, place the item
        const targetSlot = this.selX + this.selY * this.cols;
        this.placeItemInSlot(targetSlot);
      } else if (this._dragStartItem !== null) {
        // We had an item but weren't dragging (quick click)
        this.itemUse();
      }
    } else if (this.grabbedItem !== null) {
      // Drop the item in the world
      this.dropItem(this.grabbedItem, this._dragStartSlot);

      this.grabbedItem = null;
      this.items[this._dragStartSlot] = null;
    }

    // Reset all drag/hold state
    this._isDragging = false;
    this._dragStartItem = null;
    this._dragStartSlot = null;
    this.grabbedItem = null;
  };
  z;
  checkForDragStart = () => {
    if (!Input.mouseDown || this._dragStartItem === null || this._isDragging) {
      return;
    }

    if (Input.isMouseHold) {
      this._isDragging = true;
      this.grabbedItem = this._dragStartItem;

      // Remove item from original slot
      if (this._dragStartSlot !== null) {
        this.items[this._dragStartSlot] = null;
      }
    }
  };

  placeItemInSlot = (targetSlot: number) => {
    if (this.grabbedItem === null) return;

    const existingItem = this.items[targetSlot];

    // If target slot is empty
    if (existingItem === null) {
      this.items[targetSlot] = this.grabbedItem;
    } else {
      // Swap items
      if (this._dragStartSlot !== null) {
        this.items[this._dragStartSlot] = existingItem;
      }
      this.items[targetSlot] = this.grabbedItem;
    }

    this.grabbedItem = null;
  };
}
