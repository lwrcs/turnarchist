import { Item } from "./item/item";
import { LevelConstants } from "./levelConstants";
import { Game } from "./game";
import { Key } from "./item/key";
import { Input } from "./input";
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
  items: Array<Item>;
  rows = 3;
  cols = 5;
  selX = 0;
  selY = 0;
  game: Game;
  isOpen: boolean;
  openTime: number;
  coins: number;
  equipAnimAmount: Array<number>;
  weapon: Weapon;
  expansion: number = 0;

  constructor(game: Game, player: Player) {
    this.game = game;
    this.player = player;
    this.items = new Array<Item>();
    this.equipAnimAmount = [];
    for (let i = 0; i < this.rows * this.cols; i++) {
      this.equipAnimAmount[i] = 0;
    }
    //Input.mouseLeftClickListeners.push(this.mouseLeftClickListener);
    this.coins = 0;
    this.openTime = Date.now();
    this.weapon = null;
    this.expansion = 0;

    let a = (i: Item) => {
      if (i instanceof Equippable) {
        i.setWielder(this.player);
      }
      if (i instanceof Weapon) {
        i.toggleEquip();
        this.weapon = i;
        //this.player.weapon = this.weapon;
      }

      this.addItem(i);
    };
    const startingInv = [
      Dagger,
      Candle,
      GodStone,
      Warhammer,
      Spear,
      DualDagger,
      Armor,
      Heart,
      Backpack,
    ];
    startingInv.forEach((item) => {
      a(new item({ game: this.game } as Room, 0, 0));
    });
  }

  clear = () => {
    this.items = [];
    for (let i = 0; i < (this.rows + this.expansion) * this.cols; i++)
      this.equipAnimAmount[i] = 0;
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
    this.selX--;
    if (this.selX < 0) this.selX = 0;
  };
  right = () => {
    this.selX++;
    if (this.selX > this.cols - 1) this.selX = this.cols - 1;
  };
  up = () => {
    this.selY--;
    if (this.selY < 0) this.selY = 0;
  };
  down = () => {
    this.selY++;
    if (this.selY > this.rows + this.expansion - 1)
      this.selY = this.rows + this.expansion - 1;
  };
  space = () => {
    this.itemUse();
  };

  itemUse = () => {
    let i = this.selX + this.selY * this.cols;

    if (this.items[i] instanceof Usable) {
      (this.items[i] as Usable).onUse(this.player);
      //this.items.splice(i, 0);
    } else if (this.items[i] instanceof Equippable) {
      //dont equip on the same tick as using an item
      let e = this.items[i] as Equippable;
      e.toggleEquip();
      if (e instanceof Weapon) {
        if (e.equipped) this.weapon = e;
        else this.weapon = null;
      }
      if (e.equipped) {
        for (const i of this.items) {
          if (i instanceof Equippable && i !== e && !e.coEquippable(i)) {
            i.equipped = false; // prevent user from equipping two not coEquippable items
          }
        }
      }
    }
  };

  mouseLeftClick = () => {
    const x = MouseCursor.getInstance().getPosition().x;
    const y = MouseCursor.getInstance().getPosition().y;

    if (this.isPointInInventoryBounds(x, y).inBounds) {
      this.itemUse();
    }
  };

  mouseRightClick = () => {
    const x = MouseCursor.getInstance().getPosition().x;
    const y = MouseCursor.getInstance().getPosition().y;

    if (this.isPointInInventoryBounds(x, y).inBounds) {
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

  mouseMove = () => {
    const x = MouseCursor.getInstance().getPosition().x;
    const y = MouseCursor.getInstance().getPosition().y;
    const bounds = this.isPointInInventoryBounds(x, y);

    if (bounds.inBounds) {
      let s = this.isOpen
        ? Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME)
        : 18;
      let b = 2;
      let g = -2;

      // Calculate and clamp values
      this.selX = Math.max(
        0,
        Math.min(
          Math.floor((x - bounds.startX) / (s + 2 * b + g)),
          this.cols - 1
        )
      );
      this.selY = this.isOpen
        ? Math.max(
            0,
            Math.min(
              Math.floor((y - bounds.startY) / (s + 2 * b + g)),
              this.rows + this.expansion - 1
            )
          )
        : 0;
    }
  };

  drop = () => {
    let i = this.selX + this.selY * this.cols;
    if (i < this.items.length) {
      this.items[i].dropFromInventory();
      this.items[i].level = this.game.rooms[this.player.levelID];
      this.items[i].x = this.player.x;
      this.items[i].y = this.player.y;
      this.items[i].pickedUp = false;
      this.equipAnimAmount[i] = 0;
      this.game.rooms[this.player.levelID].items.push(this.items[i]);
      this.items.splice(i, 1);
    }
  };

  dropFromInventory = () => {};

  hasItem = (itemType: any): Item => {
    // itemType is class of Item we're looking for
    for (const i of this.items) {
      if (i instanceof itemType) return i;
    }
    return null;
  };

  hasItemCount = (item: Item) => {
    if (item instanceof Coin) return this.coinCount() >= item.stackCount;
    for (const i of this.items) {
      if (i.constructor === item.constructor && i.stackCount >= item.stackCount)
        return true;
    }
    return false;
  };

  subtractItemCount = (item: Item) => {
    if (item instanceof Coin) {
      this.subtractCoins(item.stackCount);
      return;
    }
    for (const i of this.items) {
      if (i.constructor === item.constructor) {
        i.stackCount -= item.stackCount;
        if (i.stackCount <= 0) this.items.splice(this.items.indexOf(i), 1);
      }
    }
  };

  coinCount = (): number => {
    return this.coins;
  };

  subtractCoins = (n: number) => {
    this.coins -= n;
    if (this.coins < 0) this.coins = 0;
  };

  addCoins = (n: number) => {
    this.coins += n;
  };

  isFull = (): boolean => {
    return this.items.length >= (this.rows + this.expansion) * this.cols;
  };

  addItem = (item: Item): boolean => {
    if (item instanceof Coin) {
      this.coins += item.stack;
      return true;
    }
    if (item instanceof Equippable) {
      item.setWielder(this.player);
    }
    if (item.stackable) {
      for (let i of this.items) {
        if (i.constructor === item.constructor) {
          // we already have an item of the same type
          i.stackCount += item.stackCount;
          return true;
        }
      }
    }
    if (!this.isFull()) {
      // item is either not stackable, or it's stackable but we don't have one yet
      this.items.push(item);
      return true;
    }
    return false;
  };

  removeItem = (item: Item) => {
    let i = this.items.indexOf(item);
    if (i !== -1) {
      this.items.splice(i, 1);
    }
  };

  getArmor = (): Armor => {
    for (const i of this.items) {
      if (i instanceof Armor && i.equipped) return i;
    }
    return null;
  };

  hasWeapon = () => {
    return this.weapon !== null;
  };

  getWeapon = () => {
    return this.weapon;
  };

  tick = () => {
    for (const i of this.items) {
      i.tickInInventory();
    }
  };

  textWrap = (text: string, x: number, y: number, maxWidth: number): number => {
    // returns y value for next line
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
    if (line !== " ") {
      Game.fillText(line, x, y);
      y += 8;
    }
    return y;
  };

  drawCoins = (delta: number) => {
    let coinX = LevelConstants.SCREEN_W - 1;
    let coinY = LevelConstants.SCREEN_H - 1;

    Game.drawItem(19, 0, 1, 2, coinX, coinY - 1, 1, 2);

    let countText = "" + this.coins;
    let width = Game.measureText(countText).width;
    let countX = 4 - width;
    let countY = -1;

    Game.fillTextOutline(
      countText,
      coinX * GameConstants.TILESIZE + countX,
      coinY * GameConstants.TILESIZE + countY,
      GameConstants.OUTLINE,
      "white"
    );

    let turnCountText = this.player.turnCount.toString();
    Game.fillTextOutline(
      turnCountText,
      coinX * GameConstants.TILESIZE + countX,
      coinY * GameConstants.TILESIZE + countY - 15,
      GameConstants.OUTLINE,
      "white"
    );
  };

  pointInside = (x: number, y: number): boolean => {
    let s = Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME); // size of box
    let b = 2; // border
    let g = -2; // gap
    let hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
    let ob = 1; // outer border
    let width = this.cols * (s + 2 * b + g) - g;
    let height = (this.rows + this.expansion) * (s + 2 * b + g) - g;

    return (
      x >= Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) - ob &&
      x <=
        Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) -
          ob +
          Math.round(width + 2 * ob) &&
      y >= Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height) - ob &&
      y <=
        Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height) -
          ob +
          Math.round(height + 2 * ob)
    );
  };

  drawQuickbar = (delta: number) => {
    // Get current mouse position and check bounds
    const x = MouseCursor.getInstance().getPosition().x;
    const y = MouseCursor.getInstance().getPosition().y;
    const isInBounds = this.isPointInInventoryBounds(x, y).inBounds;

    // Define dimensions and styling variables
    let s = 18; // size of box
    let b = 2; // border
    let g = -2; // gap
    let hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
    let ob = 1; // outer border
    let width = this.cols * (s + 2 * b + g) - g;
    let height = s + 2 * b;
    let startX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width);
    let startY = GameConstants.HEIGHT - height - 5; // 5 pixels from bottom

    // Draw main background
    Game.ctx.fillStyle = FULL_OUTLINE;
    Game.ctx.fillRect(
      Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) - ob,
      startY - 1,
      width + 2,
      height + 2
    );

    // Draw highlighted background for selected item only if mouse is in bounds
    if (isInBounds) {
      Game.ctx.fillRect(
        Math.round(
          0.5 * GameConstants.WIDTH - 0.5 * width + this.selX * (s + 2 * b + g)
        ) -
          hg -
          ob,
        startY - hg - ob,
        Math.round(s + 2 * b + 2 * hg) + 2 * ob,
        Math.round(s + 2 * b + 2 * hg) + 2 * ob
      );
    }

    // Draw individual item slots
    for (let x = 0; x < this.cols; x++) {
      // Draw slot outline
      Game.ctx.fillStyle = OUTLINE_COLOR;
      Game.ctx.fillRect(
        startX + x * (s + 2 * b + g),
        startY,
        s + 2 * b,
        s + 2 * b
      );

      // Draw slot background
      Game.ctx.fillStyle = FILL_COLOR;
      Game.ctx.fillRect(startX + x * (s + 2 * b + g) + b, startY + b, s, s);

      // Draw equip animation (this should always show)
      let i = x;
      Game.ctx.fillStyle = EQUIP_COLOR;
      let yOff = s * (1 - this.equipAnimAmount[i]);
      Game.ctx.fillRect(
        startX + x * (s + 2 * b + g) + b,
        startY + b + yOff,
        s,
        s - yOff
      );

      // Draw item icon if exists
      if (i < this.items.length) {
        let drawX =
          startX +
          x * (s + 2 * b + g) +
          b +
          Math.floor(0.5 * s) -
          0.5 * GameConstants.TILESIZE;
        let drawY =
          startY + b + Math.floor(0.5 * s) - 0.5 * GameConstants.TILESIZE;
        let drawXScaled = drawX / GameConstants.TILESIZE;
        let drawYScaled = drawY / GameConstants.TILESIZE;
        this.items[i].drawIcon(delta, drawXScaled, drawYScaled);
      }
    }

    // Draw selection box only if mouse is in bounds
    if (isInBounds) {
      let selStartX = startX + this.selX * (s + 2 * b + g);
      let selStartY = startY;

      // Outer selection box (dark)
      Game.ctx.fillStyle = OUTLINE_COLOR;
      Game.ctx.fillRect(
        selStartX - hg,
        selStartY - hg,
        Math.round(s + 2 * b + 2 * hg),
        Math.round(s + 2 * b + 2 * hg)
      );

      // Inner selection box (light grey)
      Game.ctx.fillStyle = FILL_COLOR;
      Game.ctx.fillRect(
        selStartX + b - hg,
        selStartY + b - hg,
        Math.round(s + 2 * hg),
        Math.round(s + 2 * hg)
      );

      // Draw equip animation for selected slot with highlight
      let i = this.selX;
      Game.ctx.fillStyle = EQUIP_COLOR;
      let yOff = (s + 2 * hg) * (1 - this.equipAnimAmount[i]);
      Game.ctx.fillRect(
        Math.round(startX + this.selX * (s + 2 * b + g) + b - hg),
        Math.round(startY + b + yOff - hg),
        Math.round(s + 2 * hg),
        Math.round(s + 2 * hg - yOff)
      );

      // Redraw the selected item
      if (this.selX < this.items.length) {
        let drawX =
          selStartX + b + Math.floor(0.5 * s) - 0.5 * GameConstants.TILESIZE;
        let drawY =
          selStartY + b + Math.floor(0.5 * s) - 0.5 * GameConstants.TILESIZE;
        let drawXScaled = drawX / GameConstants.TILESIZE;
        let drawYScaled = drawY / GameConstants.TILESIZE;
        this.items[this.selX].drawIcon(delta, drawXScaled, drawYScaled);
      }
    }
  };

  updateEquipAnimAmount = () => {
    for (let i = 0; i < this.equipAnimAmount.length; i++) {
      if (this.items[i] instanceof Equippable) {
        if ((this.items[i] as Equippable).equipped) {
          this.equipAnimAmount[i] += 0.2 * (1 - this.equipAnimAmount[i]);
        } else {
          this.equipAnimAmount[i] += 0.2 * (0 - this.equipAnimAmount[i]);
        }
      } else {
        this.equipAnimAmount[i] = 0;
      }
    }
  };

  draw = (delta: number) => {
    // Get current mouse position and check bounds
    const x = MouseCursor.getInstance().getPosition().x;
    const y = MouseCursor.getInstance().getPosition().y;
    const isInBounds = this.isPointInInventoryBounds(x, y).inBounds;

    // Draw coins and quickbar (these are always visible)
    this.drawCoins(delta);
    this.drawQuickbar(delta);
    this.updateEquipAnimAmount();

    if (this.isOpen) {
      // Update equip animation

      // Draw semi-transparent background for full inventory
      Game.ctx.fillStyle = "rgb(0, 0, 0, 0.8)";
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

      Game.ctx.globalAlpha = 1;

      // Define dimensions and styling variables (similar to drawQuickbar)
      let s = Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME); // size of box
      let b = 2; // border
      let g = -2; // gap
      let hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
      let invRows = this.rows + this.expansion;
      let ob = 1; // outer border
      let width = this.cols * (s + 2 * b + g) - g;
      let height = invRows * (s + 2 * b + g) - g;

      // Draw main inventory background (similar to drawQuickbar)
      Game.ctx.fillStyle = FULL_OUTLINE;
      let mainBgX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) - ob;
      let mainBgY = Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height) - ob;
      Game.ctx.fillRect(
        mainBgX,
        mainBgY,
        Math.round(width + 2 * ob),
        Math.round(height + 2 * ob)
      );

      // Draw highlighted background for selected item only if mouse is in bounds
      if (isInBounds) {
        let highlightX =
          Math.round(
            0.5 * GameConstants.WIDTH -
              0.5 * width +
              this.selX * (s + 2 * b + g)
          ) -
          hg -
          ob;
        let highlightY =
          Math.round(
            0.5 * GameConstants.HEIGHT -
              0.5 * height +
              this.selY * (s + 2 * b + g)
          ) -
          hg -
          ob;

        Game.ctx.fillRect(
          highlightX,
          highlightY,
          Math.round(s + 2 * b + 2 * hg) + 2 * ob,
          Math.round(s + 2 * b + 2 * hg) + 2 * ob
        );
      }

      // Draw individual inventory slots (similar to drawQuickbar, but for all rows)
      for (let x = 0; x < this.cols; x++) {
        for (let y = 0; y < this.rows + this.expansion; y++) {
          // Draw slot outline
          let slotX = Math.round(
            0.5 * GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g)
          );
          let slotY = Math.round(
            0.5 * GameConstants.HEIGHT - 0.5 * height + y * (s + 2 * b + g)
          );
          Game.ctx.fillStyle = OUTLINE_COLOR;
          Game.ctx.fillRect(
            slotX,
            slotY,
            Math.round(s + 2 * b),
            Math.round(s + 2 * b)
          );

          // Draw slot background
          Game.ctx.fillStyle = FILL_COLOR;
          Game.ctx.fillRect(
            Math.round(
              0.5 * GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g) + b
            ),
            Math.round(
              0.5 * GameConstants.HEIGHT -
                0.5 * height +
                y * (s + 2 * b + g) +
                b
            ),
            Math.round(s),
            Math.round(s)
          );
          // Draw equip animation (unique to full inventory view)
          let i = x + y * this.cols;
          Game.ctx.fillStyle = EQUIP_COLOR;
          let yOff = s * (1 - this.equipAnimAmount[i]);
          Game.ctx.fillRect(
            Math.round(
              0.5 * GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g) + b
            ),
            Math.round(
              0.5 * GameConstants.HEIGHT -
                0.5 * height +
                y * (s + 2 * b + g) +
                b +
                yOff
            ),
            Math.round(s),
            Math.round(s - yOff)
          );
        }
      }

      // Draw item icons after animation delay (similar to drawQuickbar, but for all items)
      if (Date.now() - this.openTime >= OPEN_TIME) {
        for (let i = 0; i < this.items.length; i++) {
          let x = i % this.cols;
          let y = Math.floor(i / this.cols);

          let drawX = Math.round(
            0.5 * GameConstants.WIDTH -
              0.5 * width +
              x * (s + 2 * b + g) +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE
          );
          let drawY = Math.round(
            0.5 * GameConstants.HEIGHT -
              0.5 * height +
              y * (s + 2 * b + g) +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE
          );

          let drawXScaled = drawX / GameConstants.TILESIZE;
          let drawYScaled = drawY / GameConstants.TILESIZE;

          this.items[i].drawIcon(delta, drawXScaled, drawYScaled);
        }

        // Draw selection box and related elements only if mouse is in bounds
        if (isInBounds) {
          // Draw selection box
          Game.ctx.fillStyle = OUTLINE_COLOR;
          Game.ctx.fillRect(
            Math.round(
              0.5 * GameConstants.WIDTH -
                0.5 * width +
                this.selX * (s + 2 * b + g)
            ) - hg,
            Math.round(
              0.5 * GameConstants.HEIGHT -
                0.5 * height +
                this.selY * (s + 2 * b + g)
            ) - hg,
            Math.round(s + 2 * b + 2 * hg),
            Math.round(s + 2 * b + 2 * hg)
          );
          let slotX = Math.round(
            0.5 * GameConstants.WIDTH -
              0.5 * width +
              this.selX * (s + 2 * b + g) +
              b -
              hg
          );
          let slotY = Math.round(
            0.5 * GameConstants.HEIGHT -
              0.5 * height +
              this.selY * (s + 2 * b + g) +
              b -
              hg
          );
          Game.ctx.fillStyle = FILL_COLOR;
          Game.ctx.fillRect(
            slotX,
            slotY,
            Math.round(s + 2 * hg),
            Math.round(s + 2 * hg)
          );

          // Draw equip animation for selected item (unique to full inventory view)
          let i = this.selX + this.selY * this.cols;
          Game.ctx.fillStyle = EQUIP_COLOR;
          let yOff = (s + 2 * hg) * (1 - this.equipAnimAmount[i]);
          Game.ctx.fillRect(
            Math.round(
              0.5 * GameConstants.WIDTH -
                0.5 * width +
                this.selX * (s + 2 * b + g) +
                b -
                hg
            ),
            Math.round(
              0.5 * GameConstants.HEIGHT -
                0.5 * height +
                this.selY * (s + 2 * b + g) +
                b -
                hg +
                yOff
            ),
            Math.round(s + 2 * hg),
            Math.round(s + 2 * hg - yOff)
          );

          // Redraw selected item icon (similar to drawQuickbar)
          let drawX = Math.round(
            0.5 * GameConstants.WIDTH -
              0.5 * width +
              this.selX * (s + 2 * b + g) +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE
          );
          let drawY = Math.round(
            0.5 * GameConstants.HEIGHT -
              0.5 * height +
              this.selY * (s + 2 * b + g) +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE
          );

          let drawXScaled = drawX / GameConstants.TILESIZE;
          let drawYScaled = drawY / GameConstants.TILESIZE;

          if (i < this.items.length)
            this.items[i].drawIcon(delta, drawXScaled, drawYScaled);
        }
      }

      // Draw item description and action text (unique to full inventory view)
      let i = this.selX + this.selY * this.cols;

      if (i < this.items.length) {
        Game.ctx.fillStyle = "white";

        // Determine action text
        let topPhrase = "";
        if (this.items[i] instanceof Equippable) {
          let e = this.items[i] as Equippable;
          topPhrase = "[SPACE] to equip";
          if (e.equipped) topPhrase = "[SPACE] to unequip";
        }
        if (this.items[i] instanceof Usable) {
          topPhrase = "[SPACE] to use";
        }

        // Draw action text
        Game.ctx.fillStyle = "white";
        let w = Game.measureText(topPhrase).width;
        Game.fillText(topPhrase, 0.5 * (GameConstants.WIDTH - w), 5);

        // Draw item description
        let lines = this.items[i].getDescription().split("\n");
        let nextY = Math.round(
          0.5 * GameConstants.HEIGHT -
            0.5 * height +
            (this.rows + this.expansion) * (s + 2 * b + g) +
            b +
            5
        );
        for (let j = 0; j < lines.length; j++) {
          nextY = this.textWrap(lines[j], 5, nextY, GameConstants.WIDTH - 10);
        }
      }
    }
  };

  private isPointInInventoryBounds = (
    x: number,
    y: number
  ): { inBounds: boolean; startX: number; startY: number } => {
    let s = this.isOpen
      ? Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME)
      : 18;
    let b = 2;
    let g = -2;
    let width = this.cols * (s + 2 * b + g) - g;

    if (this.isOpen) {
      // Full inventory bounds
      let height = (this.rows + this.expansion) * (s + 2 * b + g) - g;
      let startX = 0.5 * GameConstants.WIDTH - 0.5 * width;
      let startY = 0.5 * GameConstants.HEIGHT - 0.5 * height;

      return {
        inBounds:
          x >= startX &&
          x <= startX + width &&
          y >= startY &&
          y <= startY + height,
        startX,
        startY,
      };
    } else {
      // Quickbar bounds
      return this.isPointInQuickbarBounds(x, y);
    }
  };

  isPointInQuickbarBounds = (
    x: number,
    y: number
  ): { inBounds: boolean; startX: number; startY: number } => {
    let s = this.isOpen
      ? Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME)
      : 18;
    let b = 2;
    let g = -2;
    let width = this.cols * (s + 2 * b + g) - g;
    let startX = 0.5 * GameConstants.WIDTH - 0.5 * width;
    let startY = GameConstants.HEIGHT - (s + 2 * b) - 5;
    let quickbarHeight = s + 2 * b;

    return {
      inBounds:
        x >= startX &&
        x <= startX + width &&
        y >= startY &&
        y <= startY + quickbarHeight,
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
}
