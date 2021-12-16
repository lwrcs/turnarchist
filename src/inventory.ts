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
import { Level } from "./level";
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

let OPEN_TIME = 100; // milliseconds
let FILL_COLOR = "#5a595b";
let OUTLINE_COLOR = "#292c36";
let EQUIP_COLOR = "#85a8e6";
let FULL_OUTLINE = "white";

export class Inventory {
  player: Player;
  items: Array<Item>;
  rows = 2;
  cols = 5;
  selX = 0;
  selY = 0;
  game: Game;
  isOpen: boolean;
  openTime: number;
  coins: number;
  equipAnimAmount: Array<number>;
  weapon: Weapon;

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

    let a = (i: Item) => {
      if (i instanceof Equippable) {
        i.setWielder(this.player);
      }
      if (i instanceof Weapon) {
        i.toggleEquip();
        this.weapon = i;
      }

      this.addItem(i);
    };

    a(new Dagger({ game: this.game } as Level, 0, 0));
    a(new Torch({ game: this.game } as Level, 0, 0));
    a(new Spellbook({ game: this.game } as Level, 0, 0));
    a(new Pickaxe({ game: this.game } as Level, 0, 0));
    a(new Backpack({ game: this.game } as Level, 0, 0));

  }

  clear = () => {
    this.items = [];
    for (let i = 0; i < this.rows * this.cols; i++) this.equipAnimAmount[i] = 0;
  }

  open = () => {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.openTime = Date.now();
  };

  close = () => {
    this.isOpen = false;
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
    if (this.selY > this.rows - 1) this.selY = this.rows - 1;
  };
  space = () => {
    let i = this.selX + this.selY * this.cols;

    if (this.items[i] instanceof Usable) {
      (this.items[i] as Usable).onUse(this.player);
      this.items.splice(i, 1);
    }

    if (this.items[i] instanceof Equippable) {
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
  drop = () => {
    let i = this.selX + this.selY * this.cols;
    if (i < this.items.length) {
      if (this.items[i] instanceof Equippable) (this.items[i] as Equippable).equipped = false;
      this.items[i].level = this.game.levels[this.player.levelID];
      this.items[i].x = this.player.x;
      this.items[i].y = this.player.y;
      this.items[i].pickedUp = false;
      this.equipAnimAmount[i] = 0;
      this.game.levels[this.player.levelID].items.push(this.items[i]);
      this.items.splice(i, 1);
    }
  };

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
      if (i.constructor === item.constructor && i.stackCount >= item.stackCount) return true;
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
    return this.items.length >= this.rows * this.cols;
  };

  addItem = (item: Item): boolean => {
    if (item instanceof Coin) {
      this.coins += 1;
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
      coinY * GameConstants.TILESIZE + countY, GameConstants.OUTLINE, "white"
    );
  };

  pointInside = (x: number, y: number): boolean => {
    let s = Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME); // size of box
    let b = 2; // border
    let g = -2; // gap
    let hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
    let ob = 1; // outer border
    let width = this.cols * (s + 2 * b + g) - g;
    let height = this.rows * (s + 2 * b + g) - g;

    return (x >= Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) - ob &&
      x <= Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) - ob + Math.round(width + 2 * ob) &&
      y >= Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height) - ob &&
      y <= Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height) - ob + Math.round(height + 2 * ob));
  }

  draw = (delta: number) => {
    this.drawCoins(delta);

    if (this.isOpen) {
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

      Game.ctx.fillStyle = "rgb(0, 0, 0, 0.8)";
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

      Game.ctx.globalAlpha = 1;

      let s = Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME); // size of box
      let b = 2; // border
      let g = -2; // gap
      let hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
      let ob = 1; // outer border
      let width = this.cols * (s + 2 * b + g) - g;
      let height = this.rows * (s + 2 * b + g) - g;

      Game.ctx.fillStyle = FULL_OUTLINE;
      Game.ctx.fillRect(
        Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) - ob,
        Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height) - ob,
        Math.round(width + 2 * ob),
        Math.round(height + 2 * ob)
      );
      Game.ctx.fillRect(
        Math.round(0.5 * GameConstants.WIDTH - 0.5 * width + this.selX * (s + 2 * b + g)) - hg - ob,
        Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height + this.selY * (s + 2 * b + g)) -
        hg -
        ob,
        Math.round(s + 2 * b + 2 * hg) + 2 * ob,
        Math.round(s + 2 * b + 2 * hg) + 2 * ob
      );

      for (let x = 0; x < this.cols; x++) {
        for (let y = 0; y < this.rows; y++) {
          Game.ctx.fillStyle = OUTLINE_COLOR;
          Game.ctx.fillRect(
            Math.round(0.5 * GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g)),
            Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height + y * (s + 2 * b + g)),
            Math.round(s + 2 * b),
            Math.round(s + 2 * b)
          );
          Game.ctx.fillStyle = FILL_COLOR;
          Game.ctx.fillRect(
            Math.round(0.5 * GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g) + b),
            Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height + y * (s + 2 * b + g) + b),
            Math.round(s),
            Math.round(s)
          );
          let i = x + y * this.cols;
          Game.ctx.fillStyle = EQUIP_COLOR;
          let yOff = s * (1 - this.equipAnimAmount[i]);
          Game.ctx.fillRect(
            Math.round(0.5 * GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g) + b),
            Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height + y * (s + 2 * b + g) + b + yOff),
            Math.round(s),
            Math.round(s - yOff)
          );
        }
      }
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

          //if (this.items[i] instanceof Equippable && (this.items[i] as Equippable).equipped) {
          //  Game.drawItem(0, 4, 2, 2, x - 0.5, y - 0.5, 2, 2);
          //}
        }
        Game.ctx.fillStyle = OUTLINE_COLOR;
        Game.ctx.fillRect(
          Math.round(0.5 * GameConstants.WIDTH - 0.5 * width + this.selX * (s + 2 * b + g)) - hg,
          Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height + this.selY * (s + 2 * b + g)) - hg,
          Math.round(s + 2 * b + 2 * hg),
          Math.round(s + 2 * b + 2 * hg)
        );
        Game.ctx.fillStyle = FILL_COLOR;
        Game.ctx.fillRect(
          Math.round(
            0.5 * GameConstants.WIDTH - 0.5 * width + this.selX * (s + 2 * b + g) + b - hg
          ),
          Math.round(
            0.5 * GameConstants.HEIGHT - 0.5 * height + this.selY * (s + 2 * b + g) + b - hg
          ),
          Math.round(s + 2 * hg),
          Math.round(s + 2 * hg)
        );
        let i = this.selX + this.selY * this.cols;
        Game.ctx.fillStyle = EQUIP_COLOR;
        let yOff = (s + 2 * hg) * (1 - this.equipAnimAmount[i]);
        Game.ctx.fillRect(
          Math.round(
            0.5 * GameConstants.WIDTH - 0.5 * width + this.selX * (s + 2 * b + g) + b - hg
          ),
          Math.round(
            0.5 * GameConstants.HEIGHT - 0.5 * height + this.selY * (s + 2 * b + g) + b - hg + yOff
          ),
          Math.round(s + 2 * hg),
          Math.round(s + 2 * hg - yOff)
        );

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

        if (i < this.items.length) this.items[i].drawIcon(delta, drawXScaled, drawYScaled);
      }

      let i = this.selX + this.selY * this.cols;

      if (i < this.items.length) {
        Game.ctx.fillStyle = "white";

        let topPhrase = "";
        if (this.items[i] instanceof Equippable) {
          let e = this.items[i] as Equippable;
          topPhrase = "[SPACE] to equip";
          if (e.equipped) topPhrase = "[SPACE] to unequip";
        }
        if (this.items[i] instanceof Usable) {
          topPhrase = "[SPACE] to use";
        }

        Game.ctx.fillStyle = "white";
        let w = Game.measureText(topPhrase).width;
        Game.fillText(topPhrase, 0.5 * (GameConstants.WIDTH - w), 5);

        let lines = this.items[i].getDescription().split("\n");
        let nextY = Math.round(
          0.5 * GameConstants.HEIGHT - 0.5 * height + this.rows * (s + 2 * b + g) + b + 5
        );
        for (let j = 0; j < lines.length; j++) {
          nextY = this.textWrap(lines[j], 5, nextY, GameConstants.WIDTH - 10);
        }
      }
    }
  };
}
