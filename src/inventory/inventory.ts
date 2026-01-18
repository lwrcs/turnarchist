import { Item } from "../item/item";
import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Equippable } from "../item/equippable";
import { Armor } from "../item/armor";
import { Coin } from "../item/coin";
import { Weapon } from "../item/weapon/weapon";
import { Room } from "../room/room";
import { Usable } from "../item/usable/usable";
import { Player } from "../player/player";
import { MouseCursor } from "../gui/mouseCursor";
import { Input } from "../game/input";
import { Pickaxe } from "../item/tool/pickaxe";
import { Menu } from "../gui/menu";
import { XPCounter } from "../gui/xpCounter";
import { FishingRod } from "../item/tool/fishingRod";
import { IdGenerator } from "../globalStateManager/IdGenerator";
import { globalEventBus } from "../event/eventBus";
import { EVENTS } from "../event/events";
import { WoodenShield } from "../item/woodenShield";
import { DivingHelmet } from "../item/divingHelmet";
import { Backplate } from "../item/backplate";
import { Gauntlets } from "../item/gauntlets";
import { ShoulderPlates } from "../item/shoulderPlates";
import { ChestPlate } from "../item/chestPlate";

// Inventory overlay transition timings (no size scaling; fade only).
const INVENTORY_FADE_IN_MS = 160;
const INVENTORY_FADE_OUT_MS = 140;
// Dark gray color used for the background of inventory slots
let FILL_COLOR = "#5a595b";
// Very dark blue-gray color used for outlines and borders
let OUTLINE_COLOR = "#292c36";
// Light blue color used to indicate equipped items
let EQUIP_COLOR = "#85a8e6";
// White color used for the outer border of the inventory
let FULL_OUTLINE = "white";

export class Inventory {
  globalId: string;
  player: Player;
  items: Array<Item | null>;
  rows = 4;
  cols = 5;
  selX = 0;
  selY = 0;
  game: Game;
  isOpen: boolean = false;
  openTime: number = Date.now();
  private openFade: {
    kind: "opening" | "closing";
    startMs: number;
    durationMs: number;
  } | null = null;
  // Offscreen buffer for the full inventory overlay (so fade applies uniformly).
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCanvasCtx: CanvasRenderingContext2D | null = null;
  coins: number = 0;
  equipAnimAmount: Array<number>;
  weapon: Weapon | null = null;
  private _expansion: number = GameConstants.DEVELOPER_MODE ? 3 : 0;
  grabbedItem: Item | null = null;
  private _mouseDownStartX: number | null = null;
  private _mouseDownStartY: number | null = null;
  private _mouseDownItem: Item | null = null;
  private _wasHoldDetected: boolean = false;
  private _isDragging: boolean = false;
  private _dragStartItem: Item | null = null;
  private _dragStartSlot: number | null = null;
  private itemEquipAnimations: Map<Item, number> = new Map();
  foundItems: Item[] = [];

  dragEndTime: number = Date.now();

  closeTime: number = Date.now();

  // New state for using items on other items
  private usingItem: Usable | null = null;
  private usingItemIndex: number | null = null;
  mostRecentInput: "mouse" | "keyboard" = "keyboard";
  // Track initial press position so mobile can start dragging on movement threshold (not long-press).
  private dragStartMouseX: number | null = null;
  private dragStartMouseY: number | null = null;

  // Static variables for inventory button position
  private buttonY: number;
  private buttonX: number;
  private initializedItems: boolean = false;

  constructor(game: Game, player: Player) {
    this.globalId = IdGenerator.generate("INV");
    this.game = game;
    this.player = player;

    this.buttonX =
      (Math.round(GameConstants.WIDTH / 2) + 3) / GameConstants.TILESIZE;
    this.buttonY = 10;

    Input.mouseDownListeners.push((x, y, button) =>
      this.handleMouseDown(x, y, button),
    );
    Input.mouseUpListeners.push((x, y, button) =>
      this.handleMouseUp(x, y, button),
    );
    Input.touchStartListeners.push((x: number, y: number) => {
      this.handleMouseDown(x, y, 0);
      return false;
    });
    Input.touchEndListeners.push((x: number, y: number) => {
      this.handleMouseUp(x, y, 0);
    });

    Input.holdCallback = () => this.onHoldDetected();

    this.items = new Array<Item | null>(
      (this.rows + this._expansion) * this.cols,
    ).fill(null);
    this.equipAnimAmount = new Array<number>(
      (this.rows + this._expansion) * this.cols,
    ).fill(0);
    let a = (i: Item | null) => {
      if (i === null) return;
      if (i instanceof Equippable) {
        i.setWielder(this.player);
      }
      if (i instanceof Weapon && this.weapon === null && !i.disabled) {
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
    // Mark that initial inventory population is complete
    this.initializedItems = true;
  }

  clear = () => {
    this.items.fill(null);
    this.equipAnimAmount.fill(0);
  };

  get isDragging() {
    return this._isDragging;
  }

  open = () => {
    if (this.isOpen) return;
    this.isOpen = true;
    this.openTime = Date.now();
    this.openFade = {
      kind: "opening",
      startMs: Date.now(),
      durationMs: INVENTORY_FADE_IN_MS,
    };
    // Close map if it's open when inventory opens
    if (this.player?.map?.mapOpen) {
      this.player.map.mapOpen = false;
      this.player.map.mapOpenProgress = 0;
    }
  };

  toggleOpen = () => {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  };

  close = () => {
    if (!this.isOpen) return;
    this.closeTime = Date.now();
    // Keep drawing while we fade out; `isOpen=false` is applied when opacity hits 0.
    this.openFade = {
      kind: "closing",
      startMs: Date.now(),
      durationMs: INVENTORY_FADE_OUT_MS,
    };
    if (this.selY > 0) {
      this.selY = 0;
    }
    this.usingItem = null;
    this.usingItemIndex = null;
    this._isDragging = false;
    this.grabbedItem = null;
    this._dragStartItem = null;
    this.dragStartMouseX = null;
    this.dragStartMouseY = null;

    // Dismiss any inventory-related tip (e.g., "open inventory" pointer)
    try {
      (this.game as any).removePointer?.("open-inventory");
    } catch {}
  };

  private openAlpha = (): number => {
    if (!this.isOpen) return 0;
    if (!this.openFade) return 1;
    const now = Date.now();
    const tRaw = (now - this.openFade.startMs) / this.openFade.durationMs;
    const t = Math.max(0, Math.min(1, tRaw));
    // Ease-out quadratic.
    const ease = t * (2 - t);
    if (this.openFade.kind === "opening") {
      if (t >= 1) this.openFade = null;
      return ease;
    }
    // closing
    const a = 1 - ease;
    if (t >= 1) {
      this.openFade = null;
      this.isOpen = false;
    }
    return a;
  };

  private ensureOverlayCanvasCtx = (): CanvasRenderingContext2D | null => {
    // Inventory rendering is browser-only; guard for safety.
    if (typeof document === "undefined") return null;
    if (!this.overlayCanvas) {
      this.overlayCanvas = document.createElement("canvas");
      this.overlayCanvasCtx = this.overlayCanvas.getContext("2d");
    }
    if (!this.overlayCanvas || !this.overlayCanvasCtx) return null;

    if (
      this.overlayCanvas.width !== GameConstants.WIDTH ||
      this.overlayCanvas.height !== GameConstants.HEIGHT
    ) {
      this.overlayCanvas.width = GameConstants.WIDTH;
      this.overlayCanvas.height = GameConstants.HEIGHT;
    }
    return this.overlayCanvasCtx;
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
    if (this.selY < this.rows + this._expansion - 1) {
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

    if (this.usingItem) {
      // Attempt to use 'usingItem' on the currently selected item
      if (item === null) {
        // Clicked on empty slot; cancel the using state
        this.usingItem = null;
        this.usingItemIndex = null;
        return;
      }
      // Attempt to use on other
      if (item instanceof Item) {
        this.usingItem.useOnOther(this.player, item);
      }
      // Exit tryingToUse state
      this.usingItem = null;
      this.usingItemIndex = null;
    } else {
      // Not in tryingToUse state
      if (item instanceof Usable) {
        if (item.canUseOnOther) {
          // Enter tryingToUse state
          this.usingItem = item;
          this.usingItemIndex = index;
        } else {
          // Use normally
          item.onUse(this.player);
          // Optionally remove the item
          // this.items[index] = null;
        }
      } else if (item instanceof Equippable) {
        // Existing equipping logic
        item.toggleEquip();
        if (item instanceof Weapon) {
          if (item.broken || item.cooldown > 0 || item.disabled) return;
          this.weapon = item.equipped ? item : null;
        }
        if (item.equipped) {
          this.items.forEach((i, idx) => {
            if (
              i instanceof Equippable &&
              i !== item &&
              !item.coEquippable(i)
            ) {
              i.equipped = false;
              this.equipAnimAmount[idx] = 0;
            }
          });
        }
      }
    }
  };

  canPickup = (item: Item): boolean => {
    if (!this.isFull()) return true;
    if (item instanceof Coin) return true;
    if (
      this.items.find(
        (i) => i !== null && i.constructor === item.constructor,
      ) &&
      item.stackable
    )
      return true;
    return false;
  };

  leftQuickbar = () => {
    this.mostRecentInput = "keyboard";

    this.left();
  };

  rightQuickbar = () => {
    this.mostRecentInput = "keyboard";
    this.right();
  };

  spaceQuickbar = () => {
    this.mostRecentInput = "keyboard";
    this.itemUse();
  };

  mouseMove = () => {
    const { x, y } = MouseCursor.getInstance().getPosition();
    const bounds = this.isPointInInventoryBounds(x, y);

    if (bounds.inBounds) {
      this.mostRecentInput = "mouse";
      const s = 18;
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
              this.rows + this._expansion - 1,
            ),
          )
        : 0;

      if (oldSelX !== this.selX || oldSelY !== this.selY) {
        // Optional: Handle selection change
      }
    }

    // Mobile: initiate dragging by moving past a threshold after touching a slot.
    // Long-press is reserved for context menus.
    if (
      this.player.game.isMobile &&
      // If a context menu is open (often opened via long-press), do not initiate a drag.
      // Also clear any pending drag candidate so we don't "ghost drag" on subsequent movement.
      !this.player.contextMenu?.open &&
      !Input.touchLongPressFired &&
      !this._isDragging &&
      this._dragStartItem !== null &&
      this.dragStartMouseX !== null &&
      this.dragStartMouseY !== null
    ) {
      const dx = x - this.dragStartMouseX;
      const dy = y - this.dragStartMouseY;
      const DRAG_START_PX = 14;
      if (dx * dx + dy * dy >= DRAG_START_PX * DRAG_START_PX) {
        this.initiateDrag();
      }
    }

    if (
      this.player.game.isMobile &&
      (this.player.contextMenu?.open || Input.touchLongPressFired) &&
      (this._dragStartItem !== null ||
        this.dragStartMouseX !== null ||
        this.dragStartMouseY !== null)
    ) {
      // Cancel pending drag candidate when long-press/context menu happens.
      this._dragStartItem = null;
      this._dragStartSlot = null;
      this.dragStartMouseX = null;
      this.dragStartMouseY = null;
    }
  };

  private cancelDragAndRestore = () => {
    // If we had already removed the item from its original slot, put it back.
    if (
      this._isDragging &&
      this.grabbedItem !== null &&
      this._dragStartSlot !== null
    ) {
      const from = this._dragStartSlot;
      // Only restore if the slot is still empty (most common case).
      if (this.items[from] === null) {
        this.items[from] = this.grabbedItem;
      }
    }
    this._isDragging = false;
    this.grabbedItem = null;
    this._dragStartItem = null;
    this._dragStartSlot = null;
    this.dragStartMouseX = null;
    this.dragStartMouseY = null;
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
    // Draw above everything else; isolate canvas state.
    Game.ctx.save();
    const { x, y } = MouseCursor.getInstance().getPosition();

    const drawX = Math.round(x - 0.5 * GameConstants.TILESIZE);
    const drawY = Math.round(y - 0.5 * GameConstants.TILESIZE);
    const drawXScaled = drawX / GameConstants.TILESIZE;
    const drawYScaled = drawY / GameConstants.TILESIZE;
    this.grabbedItem.drawIcon(delta, drawXScaled, drawYScaled);
    Game.ctx.restore();
  };

  drop = () => {
    if (!this.isOpen) return;
    let index = this.selX + this.selY * this.cols;
    if (index < 0 || index >= this.items.length) return;
    const item = this.items[index];
    if (item === null) return;
    this.dropItem(item, index);
  };

  dropItem = (item: Item, index: number) => {
    const room = (this.player as any).getRoom
      ? (this.player as any).getRoom()
      : this.game.levels[this.player.depth].rooms[this.player.levelID];
    item.level = room;
    item.x = this.player.x;
    item.y = this.player.y;
    item.alpha = 1;
    item.pickedUp = false;
    item.dropFromInventory();
    this.equipAnimAmount[index] = 0;
    item.drawableY = this.player.y;
    room.items.push(item);
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

  subtractItem = (item: Item | null, count: number) => {
    if (item === null) return;
    if (item instanceof Coin) {
      this.subtractCoins(item.stackCount);
      return;
    }
    this.items.forEach((i, idx) => {
      if (i === null) return;
      if (i.constructor === item.constructor) {
        i.stackCount -= count;
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
      (this.rows + this._expansion) * this.cols
    );
  };

  addItem = (item: Item | null, stackCount: number | null = null): boolean => {
    if (item === null) return false;
    if (item instanceof Coin) {
      this.coins += item.stackCount;
      // Emit coin collected event for statistics tracking
      globalEventBus.emit(EVENTS.COIN_COLLECTED, { amount: item.stackCount });
      return true;
    }
    if (item instanceof Equippable) {
      item.setWielder(this.player);
    }
    if (item.stackable) {
      if (stackCount) {
        item.stackCount = stackCount;
      }
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
    // Determine if quickbar was already full before this add (i.e., this is 6th+ pickup)
    const preQuickbarFull = this.items
      .slice(0, this.cols)
      .every((it) => it !== null);
    if (!this.isFull()) {
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i] === null) {
          this.items[i] = item;
          // If quickbar was already full before this insertion and we're past startup,
          // prompt the user to open inventory (first time only)
          if (this.initializedItems && preQuickbarFull) {
            try {
              (this.game as any).maybeShowOpenInventoryPointer?.();
            } catch {}
          }
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

  canMine = (): boolean => {
    return this.hasItem(Pickaxe) !== null;
  };

  canFish = (): boolean => {
    return this.hasItem(FishingRod) !== null;
  };

  getArmor = (): Armor | null => {
    return (
      this.items.find(
        (i): i is Armor =>
          (i instanceof Armor || i instanceof WoodenShield) && i.equipped,
      ) || null
    );
  };

  getBackplate = (): Backplate | null => {
    return (
      this.items.find(
        (i): i is Backplate => i instanceof Backplate && i.equipped,
      ) || null
    );
  };

  getGauntlets = (): Gauntlets | null => {
    return (
      this.items.find(
        (i): i is Gauntlets => i instanceof Gauntlets && i.equipped,
      ) || null
    );
  };

  getShoulderPlates = (): ShoulderPlates | null => {
    return (
      this.items.find(
        (i): i is ShoulderPlates => i instanceof ShoulderPlates && i.equipped,
      ) || null
    );
  };

  getChestPlate = (): ChestPlate | null => {
    return (
      this.items.find(
        (i): i is ChestPlate => i instanceof ChestPlate && i.equipped,
      ) || null
    );
  };

  divingHelmetEquipped = (): boolean => {
    return (
      this.items.some(
        (i): i is DivingHelmet => i instanceof DivingHelmet && i.equipped,
      ) || false
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

    // If an overlay UI is open, inventory should not process drag/hold input.
    if (
      this.player.menu.open ||
      this.player.bestiary?.isOpen ||
      this.player.contextMenu?.open
    )
      return;

    // Check for drag initiation
    this.checkForDragStart();
  };

  textWrap = (text: string, x: number, y: number, maxWidth: number): number => {
    // Returns y value for next line
    if (text === "" || maxWidth <= 0) return y;

    const lineHeight = 8;
    const words = text.split(" ");
    let line = "";

    const drawLine = (lineToDraw: string) => {
      const trimmed = lineToDraw.trim();
      if (trimmed === "") return;
      Game.fillText(trimmed, x, y);
      y += lineHeight;
    };

    const findFittingPrefixLength = (s: string): number => {
      // Largest prefix length (>= 1) whose measured width <= maxWidth.
      // Returns 0 if nothing fits.
      if (s.length === 0) return 0;
      if (Game.measureText(s[0]).width > maxWidth) return 0;

      let lo = 1;
      let hi = s.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (Game.measureText(s.slice(0, mid)).width <= maxWidth) lo = mid;
        else hi = mid - 1;
      }
      return lo;
    };

    while (words.length > 0) {
      const word = words[0];
      const testLine = line === "" ? word : line + " " + word;

      if (Game.measureText(testLine).width <= maxWidth) {
        line = testLine;
        words.shift();
        continue;
      }

      // Current line doesn't fit with next word; emit the current line if any.
      if (line !== "") {
        drawLine(line);
        line = "";
        continue;
      }

      // Single word doesn't fit on an empty line; split it into chunks.
      let remaining = word;
      while (remaining.length > 0) {
        const prefixLen = findFittingPrefixLength(remaining);
        if (prefixLen <= 0) break; // give up; avoids infinite loop on pathological widths
        drawLine(remaining.slice(0, prefixLen));
        remaining = remaining.slice(prefixLen);
      }
      words.shift();
    }

    if (line.trim() !== "") drawLine(line);
    return y;
  };

  drawCoins = (delta: number) => {
    let coinTileX = 19;
    if (this.coins >= 3) coinTileX = 20;
    if (this.coins >= 7) coinTileX = 21;

    // Calculate the right edge of the quickbar
    const quickbarStartX = this.getQuickbarStartX();
    const s = 18; // size of box
    const b = 2; // border
    const g = -2; // gap
    const quickbarWidth = this.cols * (s + 2 * b + g) - g;
    const quickbarRightEdge = quickbarStartX + quickbarWidth;
    // Position coin slightly to the right of the quickbar
    let coinX = (quickbarRightEdge - 5) / GameConstants.TILESIZE - 1;
    let coinY = GameConstants.HEIGHT / GameConstants.TILESIZE - 1.3;

    // Ensure coin doesn't go off the right edge of the screen
    const maxCoinX = (GameConstants.WIDTH - 36) / GameConstants.TILESIZE;
    if (coinX > maxCoinX) {
      coinX = maxCoinX;
    }

    if (GameConstants.WIDTH < 180) {
      coinY -= 1.25;
      coinX += 1.15;
    } else {
      coinX += 1.5;
    }
    if (GameConstants.WIDTH < 145) {
      coinX -= 1.15;
    }

    Game.drawItem(coinTileX, 0, 1, 2, coinX, coinY - 1, 1, 2);

    const countText = `${this.coins}`;
    const width = Game.measureText(countText).width;
    const countX = 10;
    const countY = 9;

    Game.fillTextOutline(
      countText,
      coinX * GameConstants.TILESIZE +
        countX -
        Game.measureText(this.coins.toString()).width +
        5,
      coinY * GameConstants.TILESIZE + countY + 2,
      GameConstants.OUTLINE,
      "white",
    );
    /*
    const turnCountText = `${this.player.turnCount}`;
    Game.fillTextOutline(
      turnCountText,
      coinX * GameConstants.TILESIZE + countX,
      coinY * GameConstants.TILESIZE + countY - 15,
      GameConstants.OUTLINE,
      "white",
    );
    */
  };

  pointInside = (x: number, y: number): boolean => {
    const s = 18; // size of box
    const b = 2; // border
    const g = -2; // gap
    const hg = 1 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
    const ob = 1; // outer border
    const width = this.cols * (s + 2 * b + g) - g;
    const height = (this.rows + this._expansion) * (s + 2 * b + g) - g;

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
    const isActive = isInBounds || this.mostRecentInput === "keyboard";

    const s = 18; // size of box
    const b = 2; // border
    const g = -2; // gap
    const hg = 1; // + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
    const ob = 1; // outer border
    const width = Math.floor(this.cols * (s + 2 * b + g) - g);
    const height = Math.floor(s + 2 * b);
    const startX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width);
    const startY = Math.floor(GameConstants.HEIGHT - height - 2);

    // Draw main background
    /*
    Game.ctx.fillStyle = FULL_OUTLINE;
    Game.ctx.fillRect(startX - ob, startY - 1, width + 2, height + 2);
    */
    //Game.ctx.globalCompositeOperation = "xor";

    // Draw highlighted background for selected item only if active (hover or keyboard-like input)
    if (isActive) {
      /*
      Game.ctx.fillRect(
        Math.floor(startX + this.selX * (s + 2 * b + g) - hg - ob),
        Math.floor(startY - hg - ob),
        Math.floor(s + 2 * b + 2 * hg + 2 * ob),
        Math.floor(s + 2 * b + 2 * hg + 2 * ob),
      );
      */
    }

    // Draw individual item slots
    for (let xIdx = 0; xIdx < this.cols; xIdx++) {
      // Skip drawing normal background and icon if this is the selected slot
      const idx = xIdx;

      // Draw slot background
      if (xIdx !== this.selX) {
        Game.ctx.fillStyle = FILL_COLOR;
        Game.ctx.fillRect(
          Math.floor(startX + xIdx * (s + 2 * b + g) + b),
          Math.floor(startY + b),
          Math.floor(s),
          Math.floor(s),
        );

        Game.ctx.clearRect(
          Math.floor(startX + xIdx * (s + 2 * b + g) + b + 1),
          Math.floor(startY + b + 1),
          Math.floor(s - 2),
          Math.floor(s - 2),
        );

        // Draw equip animation (this should always show)
        Game.ctx.fillStyle = EQUIP_COLOR;
        Game.ctx.globalAlpha = 0.3;
        const yOff = Math.floor(s * (1 - this.equipAnimAmount[idx]));
        Game.ctx.fillRect(
          Math.floor(startX + xIdx * (s + 2 * b + g) + b),
          Math.floor(startY + b + yOff),
          Math.floor(s),
          Math.floor(s - yOff),
        );
        Game.ctx.globalAlpha = 1;
        /*
        Game.ctx.clearRect(
          Math.floor(startX + xIdx * (s + 2 * b + g) + b + 1),
          Math.floor(startY + b + 1),
          Math.floor(s - 2),
          Math.floor(s - 2),
        );
        */
      }

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
        this.items[idx]?.drawIcon(delta, drawXScaled, drawYScaled);
      }
    }

    // Draw selection box; use active state to control emphasis
    if (true) {
      const selStartX = Math.floor(startX + this.selX * (s + 2 * b + g));
      const selStartY = Math.floor(startY);
      const hg2 = isActive ? hg : 0;
      /*
      // Outer selection box (dark)
      Game.ctx.fillStyle = OUTLINE_COLOR;
      Game.ctx.fillRect(
        selStartX - hg,
        selStartY - hg,
        s + 2 * b + 2 * hg,
        s + 2 * b + 2 * hg,
      );
      */

      // Inner selection box (light grey)
      Game.ctx.fillStyle = FILL_COLOR;
      Game.ctx.fillRect(
        Math.floor(selStartX + b - hg2),
        Math.floor(selStartY + b - hg2),
        Math.floor(s + 2 * hg2),
        Math.floor(s + 2 * hg2),
      );

      // Clear inner rectangle - use normal size when not in bounds
      const clearSize = isActive ? s : s - 2;
      const selOffset = isActive ? 0 : 1;
      Game.ctx.clearRect(
        Math.floor(startX + this.selX * (s + 2 * b + g) + b + selOffset),
        Math.floor(startY + b + selOffset),
        Math.floor(clearSize),
        Math.floor(clearSize),
      );

      // Draw equip animation for selected slot with highlight
      const idx = this.selX;
      Game.ctx.fillStyle = EQUIP_COLOR;
      Game.ctx.globalAlpha = 0.3;
      const yOff = (s + 2 * hg2) * (1 - this.equipAnimAmount[idx]);
      Game.ctx.fillRect(
        Math.round(startX + this.selX * (s + 2 * b + g) + b - hg2),
        Math.round(startY + b + yOff - hg2),
        Math.round(s + 2 * hg2),
        Math.round(s + 2 * hg2 - yOff),
      );
      Game.ctx.globalAlpha = 1;

      /*
      Game.ctx.clearRect(
        Math.floor(startX + this.selX * (s + 2 * b + g) + b),
        Math.floor(startY + b),
        Math.floor(s),
        Math.floor(s),
      );
      */
      this.drawUsingItem(delta, startX, startY, s, b, g);

      // Redraw the selected item
      if (idx < this.items.length && this.items[idx] !== null) {
        const drawX =
          selStartX + b + Math.floor(0.5 * s) - 0.5 * GameConstants.TILESIZE;
        const drawY =
          selStartY + b + Math.floor(0.5 * s) - 0.5 * GameConstants.TILESIZE;
        const drawXScaled = drawX / GameConstants.TILESIZE;
        const drawYScaled = drawY / GameConstants.TILESIZE;

        this.items[idx]?.drawIcon(delta, drawXScaled, drawYScaled);
      }
      this.drawUsingItem(delta, startX, startY, s, b, g);
    }
    this.drawUsingItem(delta, startX, startY, s, b, g);
  };

  drawUsingItem = (
    delta: number,
    startX: number,
    startY: number,
    s: number,
    b: number,
    g: number,
  ) => {
    // Highlight the usingItem's slot if in using state and it's different from current selection
    Game.ctx.globalCompositeOperation = "source-over";
    if (this.usingItem && this.usingItemIndex !== null) {
      const usingX = this.usingItemIndex % this.cols;
      const usingY = Math.floor(this.usingItemIndex / this.cols);
      const highlightStartX = startX + usingX * (s + 2 * b + g);
      const highlightStartY = startY + usingY * (s + 2 * b + g);

      Game.ctx.strokeStyle = "yellow"; // Choose a distinct color for using item
      Game.ctx.lineWidth = 2;
      Game.ctx.strokeRect(
        highlightStartX,
        highlightStartY,
        s + 2 * b,
        s + 2 * b,
      );
      Game.ctx.lineWidth = 1; // Reset line width
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
    Game.ctx.imageSmoothingEnabled = false;
    Game.ctx.imageSmoothingQuality = "low";
    const { x, y } = MouseCursor.getInstance().getPosition();
    const isInBounds = this.isPointInInventoryBounds(x, y).inBounds;
    const s = 18; // size of box
    const b = 2; // border
    const g = -2; // gap
    const hg = 1 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
    const invRows = Math.floor(this.rows + this._expansion);
    const ob = 1; // outer border
    const width = Math.floor(this.cols * (s + 2 * b + g) - g);
    const height = Math.floor(invRows * (s + 2 * b + g) - g);
    const mainBgX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) - ob;
    const mainBgY = Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height) - ob;

    // Draw coins and quickbar (these are always visible)
    this.drawCoins(delta);
    this.drawQuickbar(delta);
    this.updateEquipAnimAmount(delta);
    this.drawInventoryButton(delta);
    Menu.drawOpenMenuButton();
    XPCounter.draw(delta);

    const overlayAlpha = this.openAlpha();
    if (overlayAlpha > 0) {
      const offCtx = this.ensureOverlayCanvasCtx();
      if (!offCtx || !this.overlayCanvas) return;
      offCtx.save();
      offCtx.clearRect(
        0,
        0,
        this.overlayCanvas.width,
        this.overlayCanvas.height,
      );
      offCtx.imageSmoothingEnabled = false;

      const prevCtx = Game.ctx;
      Game.ctx = offCtx;
      Game.ctx.save();
      // Draw semi-transparent background for full inventory
      Game.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

      // Define dimensions and styling variables (similar to drawQuickbar)
      const s = 18; // size of box
      const b = 2; // border
      const g = -2; // gap
      const hg = Math.floor(
        1 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5),
      ); // highlighted growth
      const invRows = this.rows + this._expansion;
      const ob = 1; // outer border
      const width = Math.floor(this.cols * (s + 2 * b + g) - g);
      const height = Math.floor(invRows * (s + 2 * b + g) - g);

      // Draw main inventory background (similar to drawQuickbar)
      Game.ctx.fillStyle = FULL_OUTLINE;
      const mainBgX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) - ob;
      const mainBgY =
        Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height) - ob;
      Game.ctx.fillRect(mainBgX, mainBgY, width + 2 * ob, height + 2 * ob);

      // Draw highlighted background for selected item only if mouse is in bounds
      if (isInBounds || this.mostRecentInput === "keyboard") {
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
        for (let yIdx = 0; yIdx < this.rows + this._expansion; yIdx++) {
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
          const yOff = Math.round(s * (1 - this.equipAnimAmount[idx]));
          Game.ctx.fillRect(slotX + b, slotY + b + yOff, s, s - yOff);

          // Draw item icon if exists
          if (idx < this.items.length && this.items[idx] !== null) {
            const drawX = Math.round(
              0.5 * GameConstants.WIDTH -
                0.5 * width +
                xIdx * (s + 2 * b + g) +
                b +
                Math.floor(0.5 * s) -
                0.5 * GameConstants.TILESIZE,
            );
            const drawY = Math.round(
              0.5 * GameConstants.HEIGHT -
                0.5 * height +
                yIdx * (s + 2 * b + g) +
                b +
                Math.floor(0.5 * s) -
                0.5 * GameConstants.TILESIZE,
            );
            const drawXScaled = drawX / GameConstants.TILESIZE;
            const drawYScaled = drawY / GameConstants.TILESIZE;

            this.items[idx]?.drawIcon(delta, drawXScaled, drawYScaled);
          }
        }
      }

      // No size-scaling animation; draw selection immediately.
      {
        this.items.forEach((item, idx) => {
          if (item === null) return;
          const x = idx % this.cols;
          const y = Math.floor(idx / this.cols);

          const drawX = Math.round(
            0.5 * GameConstants.WIDTH -
              0.5 * width +
              x * (s + 2 * b + g) +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE,
          );
          const drawY = Math.round(
            0.5 * GameConstants.HEIGHT -
              0.5 * height +
              y * (s + 2 * b + g) +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE,
          );

          const drawXScaled = drawX / GameConstants.TILESIZE;
          const drawYScaled = drawY / GameConstants.TILESIZE;

          item.drawIcon(delta, drawXScaled, drawYScaled);
        });

        // Draw selection box and related elements only if mouse is in bounds
        if (isInBounds || this.mostRecentInput === "keyboard") {
          // Draw selection box
          Game.ctx.fillStyle = OUTLINE_COLOR;
          Game.ctx.fillRect(
            Math.round(
              0.5 * GameConstants.WIDTH -
                0.5 * width +
                this.selX * (s + 2 * b + g) -
                hg,
            ),
            Math.round(
              0.5 * GameConstants.HEIGHT -
                0.5 * height +
                this.selY * (s + 2 * b + g) -
                hg,
            ),
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
            const yOff = Math.round(
              (s + 2 * hg) * (1 - this.equipAnimAmount[idx]),
            );
            Game.ctx.fillRect(
              Math.round(
                0.5 * GameConstants.WIDTH -
                  0.5 * width +
                  this.selX * (s + 2 * b + g) +
                  b -
                  hg,
              ),
              Math.round(
                0.5 * GameConstants.HEIGHT -
                  0.5 * height +
                  this.selY * (s + 2 * b + g) +
                  b -
                  hg +
                  yOff,
              ),
              s + 2 * hg,
              s + 2 * hg - yOff,
            );

            // Redraw selected item icon (similar to drawQuickbar)
            const drawX = Math.round(
              0.5 * GameConstants.WIDTH -
                0.5 * width +
                this.selX * (s + 2 * b + g) +
                b +
                Math.floor(0.5 * s) -
                0.5 * GameConstants.TILESIZE,
            );
            const drawY = Math.round(
              0.5 * GameConstants.HEIGHT -
                0.5 * height +
                this.selY * (s + 2 * b + g) +
                b +
                Math.floor(0.5 * s) -
                0.5 * GameConstants.TILESIZE,
            );

            const drawXScaled = drawX / GameConstants.TILESIZE;
            const drawYScaled = drawY / GameConstants.TILESIZE;

            this.items[idx]?.drawIcon(delta, drawXScaled, drawYScaled);
          }

          // **Move drawUsingItem here, after the main selection box**
        }

        // **Ensure drawUsingItem is not called again here**
        // this.drawUsingItem(delta, mainBgX, mainBgY, s, b, g);
      }

      // **Ensure drawUsingItem is not called again here**
      // this.drawUsingItem(delta, mainBgX, mainBgY, s, b, g);
      // Draw item description and action text (unique to full inventory view)
      const selectedIdx = this.selX + this.selY * this.cols;

      if (
        !this.game.isMobile &&
        selectedIdx < this.items.length &&
        this.items[selectedIdx] !== null
      ) {
        const item = this.items[selectedIdx]!;
        Game.ctx.fillStyle = "white";

        // Determine action text
        let topPhrase = "";
        if (item instanceof Equippable) {
          topPhrase = item.equipped ? "[SPACE] to unequip" : "[SPACE] to equip";
        }
        if (item instanceof Usable) {
          topPhrase = "[SPACE] to use";
        }

        // Draw action text
        if (topPhrase !== "") {
          const actionTextWidth = Game.measureText(topPhrase).width;
          Game.fillText(
            topPhrase,
            Math.round(0.5 * (GameConstants.WIDTH - actionTextWidth)),
            5,
          );
        }

        // Draw item description
        const lines = item.getDescription().split("\n");
        const leftPadding = 6;
        const gutter = 8;
        const descX = leftPadding;
        const descMaxWidth = Math.max(0, mainBgX - descX - gutter);

        if (descMaxWidth > 0) {
          let nextY = Math.round(Math.max(18, mainBgY + leftPadding));
          lines.forEach((line) => {
            nextY = this.textWrap(line, descX, nextY, descMaxWidth);
          });
        }
      }
      // Overlay-only highlights + dragged item.
      this.drawUsingItem(delta, mainBgX + 1, mainBgY + 1, s, b, g);

      // Finish offscreen render and composite to the main canvas with a single alpha.
      Game.ctx.restore();
      Game.ctx = prevCtx;
      offCtx.restore();

      prevCtx.save();
      prevCtx.globalAlpha = prevCtx.globalAlpha * overlayAlpha;
      prevCtx.drawImage(this.overlayCanvas, 0, 0);
      prevCtx.restore();
    }

    // Always draw dragged item last, regardless of whether the full inventory overlay is open.
    // (Dragging can happen in quickbar-only mode too.)
    this.drawDraggedItem(delta);
  };

  isPointInInventoryBounds = (
    x: number,
    y: number,
  ): { inBounds: boolean; startX: number; startY: number } => {
    const s = 18;
    const b = 2; // border
    const g = -2; // gap
    const hg = 1 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
    const ob = 1; // outer border
    const width = this.cols * (s + 2 * b + g) - g;

    let startX: number;
    let startY: number;
    let height: number;

    if (this.isOpen) {
      // Full inventory bounds
      height = (this.rows + this._expansion) * (s + 2 * b + g) - g;
      startX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width);
      startY = Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height);
    } else {
      // Quickbar bounds
      height = s + 2 * b;
      startX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width);
      startY = Math.round(GameConstants.HEIGHT - height - 5);
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
    const s = 18;
    const b = 2; // border
    const g = -2; // gap
    const width = this.cols * (s + 2 * b + g) - g;
    const startX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width);
    const startY = Math.round(GameConstants.HEIGHT - (s + 2 * b) - 5);
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

  getInventorySlotIndexAtPoint = (x: number, y: number): number | null => {
    if (!this.isOpen) return null;
    const bounds = this.isPointInInventoryBounds(x, y);
    if (!bounds.inBounds) return null;
    const s = 18;
    const b = 2;
    const g = -2;
    const stride = s + 2 * b + g;
    const col = Math.floor((x - bounds.startX) / stride);
    const row = Math.floor((y - bounds.startY) / stride);
    if (col < 0 || col >= this.cols) return null;
    if (row < 0 || row >= this.rows + this._expansion) return null;
    const idx = col + row * this.cols;
    return idx >= 0 && idx < this.items.length ? idx : null;
  };

  getQuickbarSlotIndexAtPoint = (x: number, y: number): number | null => {
    const bounds = this.isPointInQuickbarBounds(x, y);
    if (!bounds.inBounds) return null;
    const s = 18;
    const b = 2;
    const g = -2;
    const stride = s + 2 * b + g;
    const col = Math.floor((x - bounds.startX) / stride);
    if (col < 0 || col >= this.cols) return null;
    const idx = col; // quickbar is row 0
    return idx >= 0 && idx < this.items.length ? idx : null;
  };

  isPointInInventoryButton = (x: number, y: number): boolean => {
    // Use the same rect math as `drawInventoryButton()` to avoid relying on
    // previous-frame state for hover/click hit tests.
    const r = this.getInventoryButtonRect();
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  };

  /**
   * Draws the inventory button to the canvas.
   * Added `ctx.save()` at the beginning and `ctx.restore()` at the end
   * to ensure canvas state is preserved.
   */
  drawInventoryButton = (delta: number) => {
    Game.ctx.save(); // Save the current canvas state
    this.buttonX = GameConstants.WIDTH / GameConstants.TILESIZE - 1.25;
    this.buttonY = GameConstants.HEIGHT / GameConstants.TILESIZE - 1.25;
    if (GameConstants.WIDTH < 145) {
      //this.buttonX -= 1;
      this.buttonY -= 1.25;
    }
    Game.drawFX(0, 0, 1, 1, this.buttonX, this.buttonY, 1, 1);

    Game.ctx.restore(); // Restore the canvas state
  };

  getInventoryButtonRect = (): {
    x: number;
    y: number;
    w: number;
    h: number;
  } => {
    // Mirror drawInventoryButton positioning logic
    let bx = GameConstants.WIDTH / GameConstants.TILESIZE - 1.25;
    let by = GameConstants.HEIGHT / GameConstants.TILESIZE - 1.25;
    if (GameConstants.WIDTH < 145) by -= 1.25;
    const x = Math.round(bx * GameConstants.TILESIZE);
    const y = Math.round(by * GameConstants.TILESIZE);
    const w = GameConstants.TILESIZE;
    const h = GameConstants.TILESIZE;
    return { x, y, w, h };
  };

  getQuickbarStartX = () => {
    const s = 18; // size of box
    const b = 2; // border
    const g = -2; // gap
    const width = Math.floor(this.cols * (s + 2 * b + g) - g);
    return Math.round(0.5 * GameConstants.WIDTH - 0.5 * width);
  };

  getQuickbarSlotRect = (
    slotIndex: number,
  ): { x: number; y: number; w: number; h: number } | null => {
    if (slotIndex < 0 || slotIndex >= this.cols) return null;
    const s = 18; // size of box
    const b = 2; // border
    const g = -2; // gap
    const width = Math.floor(this.cols * (s + 2 * b + g) - g);
    const startX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width);
    const height = s + 2 * b;
    const startY = Math.floor(GameConstants.HEIGHT - height - 2);

    const x = Math.floor(startX + slotIndex * (s + 2 * b + g) + b);
    const y = Math.floor(startY + b);
    const w = Math.floor(s);
    const h = Math.floor(s);
    return { x, y, w, h };
  };

  handleMouseDown = (x: number, y: number, button: number) => {
    if (
      this.player.menu.open ||
      this.player.bestiary?.isOpen ||
      this.player.contextMenu?.open
    )
      return;

    // Ignore if not left click
    if (button !== 0) return;

    // Determine slot under pointer and set selection immediately.
    const idx = this.isOpen
      ? this.getInventorySlotIndexAtPoint(x, y)
      : this.getQuickbarSlotIndexAtPoint(x, y);
    if (idx !== null) {
      this.selX = idx % this.cols;
      this.selY = Math.floor(idx / this.cols);
      const selectedItem = this.items[idx];
      if (selectedItem !== null) {
        this._dragStartItem = selectedItem;
        this._dragStartSlot = idx;
        this.dragStartMouseX = x;
        this.dragStartMouseY = y;
      }
    }
  };

  /**
   * Unified method to initiate dragging.
   */
  initiateDrag = () => {
    if (this._dragStartItem === null || this._isDragging) {
      return;
    }
    Input.holdCallbackFired = true;
    this._isDragging = true;
    this.grabbedItem = this._dragStartItem;

    // Remove item from original slot
    if (this._dragStartSlot !== null) {
      this.items[this._dragStartSlot] = null;
    }
  };

  /**
   * Handle hold detection for both mouse and touch.
   */
  onHoldDetected = () => {
    // On mobile, long-press is reserved for context menus.
    // Dragging is initiated via movement threshold in `mouseMove()`.
    if (this.player.game.isMobile) return;
    this.initiateDrag();
  };

  /**
   * Continuously check for mouse hold during tick.
   */
  checkForDragStart = () => {
    // On mobile, long-press is reserved for right-click/context menus and dragging
    // is initiated via movement threshold in `mouseMove()`.
    if (this.player.game.isMobile) return;

    if (Input.mouseDown && Input.isMouseHold) {
      this.initiateDrag();
    } else if (Input.isTapHold) {
      this.initiateDrag();
    }
  };

  handleMouseUp = (x: number, y: number, button: number) => {
    // Always clear drag-start tracking on release (even if a modal UI is open).
    // Otherwise long-press context menu can leave a stale drag candidate.
    this.dragStartMouseX = null;
    this.dragStartMouseY = null;

    if (
      this.player.menu.open ||
      this.player.bestiary?.isOpen ||
      this.player.contextMenu?.open
    ) {
      // If a context menu is open, cancel any drag to avoid losing items.
      this.cancelDragAndRestore();
      return;
    }

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
      this.dragEndTime = Date.now();
    }

    // Reset all drag/hold state
    this._isDragging = false;
    this._dragStartItem = null;
    this._dragStartSlot = null;
    this.grabbedItem = null;
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

    // Record move for replay
    try {
      const fromIdx = this._dragStartSlot ?? targetSlot;
      const toIdx = targetSlot;
      (this.game as any).replayManager?.recordAction({
        type: "InventoryMove",
        fromIndex: fromIdx,
        toIndex: toIdx,
      });
    } catch {}

    this.grabbedItem = null;
  };

  get expansion(): number {
    return this._expansion;
  }

  set expansion(value: number) {
    if (value !== this._expansion) {
      const oldTotalSlots = (this.rows + this._expansion) * this.cols;
      this._expansion = value;
      const newTotalSlots = (this.rows + this._expansion) * this.cols;

      // Resize items array
      if (newTotalSlots > oldTotalSlots) {
        this.items.push(...Array(newTotalSlots - oldTotalSlots).fill(null));
        this.equipAnimAmount.push(
          ...Array(newTotalSlots - oldTotalSlots).fill(0),
        );
      } else if (newTotalSlots < oldTotalSlots) {
        this.items.length = newTotalSlots;
        this.equipAnimAmount.length = newTotalSlots;
      }
    }
  }

  expandInventory(additionalRows: number) {
    this.expansion += additionalRows;
  }
}
