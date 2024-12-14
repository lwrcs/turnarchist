import { Player } from "../../player";
import { Game } from "../../game";
import { Room } from "../../room";
import { Entity } from "../entity";
import { Item } from "../../item/item";
import { Key } from "../../item/key";
import { Coin } from "../../item/coin";
import { Coal } from "../../item/coal";
import { GreenGem } from "../../item/greengem";
import { GameConstants } from "../../gameConstants";
import { Shotgun } from "../../weapon/shotgun";
import { Dagger } from "../../weapon/dagger";
import { Armor } from "../../item/armor";
import { Heart } from "../../item/heart";
import { Spear } from "../../weapon/spear";
import { Gold } from "../../item/gold";
import { BlueGem } from "../../item/bluegem";
import { DualDagger } from "../../weapon/dualdagger";
import { Lantern } from "../../item/lantern";
import { RedGem } from "../../item/redgem";
import { EntityType } from "../entity";
import { Random } from "../../random";
import { Warhammer } from "../../weapon/warhammer";
import { Torch } from "../../item/torch";
import { Spellbook } from "../../weapon/spellbook";

let OPEN_TIME = 150;
let FILL_COLOR = "#5a595b";
let OUTLINE_COLOR = "#292c36";
let FULL_OUTLINE = "white";

export class VendingMachine extends Entity {
  playerOpened: Player;
  open = false;
  openTime = 0;
  costItems: Array<Item>;
  item: Item;
  isInf = false;
  quantity = 1;
  buyAnimAmount = 0;

  constructor(room: Room, game: Game, x: number, y: number, item: Item) {
    super(room, game, x, y);

    this.destroyable = false;
    this.pushable = false;
    this.chainPushable = false;
    this.interactable = true;

    this.costItems = [];

    this.item = item;
    this.name = "vending machine";
    if (this.item instanceof Shotgun) {
      let g = new BlueGem(room, 0, 0);
      g.stackCount = Game.randTable([7], Random.rand);
      this.costItems = [g];
    } else if (this.item instanceof Heart) {
      let c = new Coin(room, 0, 0);
      c.stackCount = 10;
      this.costItems = [c];
      this.quantity = 3;
    } else if (this.item instanceof Spear) {
      let g = new GreenGem(room, 0, 0);
      g.stackCount = Game.randTable([5], Random.rand);
      this.costItems = [g];
    } else if (this.item instanceof Armor) {
      let g = new GreenGem(room, 0, 0);
      g.stackCount = Game.randTable([5], Random.rand);
      this.costItems = [g];
    } else if (this.item instanceof DualDagger) {
      let g = new BlueGem(room, 0, 0);
      g.stackCount = Game.randTable([5], Random.rand);
      this.costItems = [g];
    } else if (this.item instanceof Lantern) {
      let c = new Coin(room, 0, 0);
      c.stackCount = Game.randTable([50], Random.rand);
      this.costItems = [c];
    } else if (this.item instanceof Warhammer) {
      let g = new RedGem(room, 0, 0);
      g.stackCount = Game.randTable([5], Random.rand);
      this.costItems = [g];
    } else if (this.item instanceof Spellbook) {
      let g = new RedGem(room, 0, 0);
      g.stackCount = Game.randTable([7], Random.rand);
      this.costItems = [g];
    } else if (this.item instanceof Torch) {
      let g = new RedGem(room, 0, 0);
      g.stackCount = Game.randTable([1], Random.rand);
      this.costItems = [g];
    }
  }

  isPointInVendingMachineBounds = (x: number, y: number): boolean => {
    // First check if this is the currently open vending machine
    if (!this.open || this !== this.playerOpened?.openVendingMachine)
      return false;

    const OPEN_TIME = 200; // Match the constant from drawTopLayer
    const s = Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME); // size of box
    const b = 2; // border
    const g = -2; // gap
    const ob = 1; // outer border

    // Calculate total width and height of the UI
    const width = (this.costItems.length + 2) * (s + 2 * b + g) - g;
    const height = s + 2 * b + g - g;

    // Calculate center position (matches drawTopLayer positioning)
    const cx = (this.x + 0.5) * GameConstants.TILESIZE;
    const cy = (this.y - 1.5) * GameConstants.TILESIZE;

    // Calculate bounds
    const left = Math.round(cx - 0.5 * width) - ob;
    const right =
      Math.round(cx - 0.5 * width) - ob + Math.round(width + 2 * ob);
    const top = Math.round(cy - 0.5 * height) - ob;
    const bottom =
      Math.round(cy - 0.5 * height) - ob + Math.round(height + 2 * ob);

    // Check if point is within bounds
    return x >= left && x <= right && y >= top && y <= bottom;
  };

  get type() {
    return EntityType.PROP;
  }

  interact = (player: Player) => {
    if (this.isInf || this.quantity > 0) {
      if (this.open) this.playerOpened.openVendingMachine = null;
      this.open = true;
      this.playerOpened = player;
      this.openTime = Date.now();
      if (
        this.playerOpened.openVendingMachine &&
        this.playerOpened.openVendingMachine !== this
      )
        this.playerOpened.openVendingMachine.close();
      this.playerOpened.openVendingMachine = this;
    }
  };

  close = () => {
    this.open = false;
    this.playerOpened.openVendingMachine = null;
  };

  space = () => {
    if (this.open) {
      // check if player can pay
      for (const i of this.costItems) {
        if (!this.playerOpened.inventory.hasItemCount(i)) {
          let numOfItem = 0;
          this.playerOpened.inventory.items.forEach((item) => {
            if (item instanceof i.constructor) numOfItem++;
          });
          const difference = this.costItems[0].stackCount - numOfItem;
          const pluralLetter = this.costItems[0].stackCount > 1 ? "s" : "";

          this.game.pushMessage(
            `You need ${difference} more ${(this.costItems[0].constructor as any).itemName}${pluralLetter} to buy that. `,
          );
          return;
        }
      }

      for (const i of this.costItems) {
        this.playerOpened.inventory.subtractItemCount(i);
      }

      let x, y;
      do {
        x = Game.rand(this.x - 1, this.x + 1, Random.rand);
        y = Game.rand(this.y - 1, this.y + 1, Random.rand);
      } while (
        (x === this.x && y === this.y) ||
        this.room.roomArray[x][y].isSolid() ||
        this.room.entities.some((e) => e.x === x && e.y === y)
      );

      let newItem = new (this.item.constructor as { new (): Item })();
      newItem = newItem.constructor(this.room, x, y);
      newItem.onPickup(this.playerOpened);
      const cost = this.costItems[0].stackCount;
      const pluralLetter = cost > 1 ? "s" : "";

      if (!this.isInf) {
        this.quantity--;
        if (this.quantity <= 0) this.close();
      }
      this.game.pushMessage(
        `Purchased ${(newItem.constructor as any).itemName} for ${cost} ${(this.costItems[0].constructor as any).itemName}${pluralLetter}`,
      );
      this.game.pushMessage(`${this.quantity} available to buy.`);

      this.buyAnimAmount = 0.99;
      if (this.playerOpened === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(0, 4);
    }
  };

  draw = (delta: number) => {
    let tileX = 19;
    if (!this.isInf && this.quantity === 0) tileX = 20;
    Game.drawObj(
      tileX,
      0,
      1,
      2,
      this.x,
      this.y - 1,
      1,
      2,
      this.room.shadeColor,
      this.shadeAmount(),
    );
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;

    if (
      this.open &&
      this.playerOpened === this.game.players[this.game.localPlayerID]
    ) {
      let s = Math.min(18, (18 * (Date.now() - this.openTime)) / OPEN_TIME); // size of box
      let b = 2; // border
      let g = -2; // gap
      let hg = 3; // highlighted growth
      let ob = 1; // outer border
      let width = (this.costItems.length + 2) * (s + 2 * b + g) - g;
      let height = s + 2 * b + g - g;

      let cx = (this.x + 0.5) * GameConstants.TILESIZE;
      let cy = (this.y - 1.5) * GameConstants.TILESIZE;

      Game.ctx.fillStyle = FULL_OUTLINE;
      Game.ctx.fillRect(
        Math.round(cx - 0.5 * width) - ob,
        Math.round(cy - 0.5 * height) - ob,
        Math.round(width + 2 * ob),
        Math.round(height + 2 * ob),
      );
      for (let x = 0; x < this.costItems.length + 2; x++) {
        Game.ctx.fillStyle = OUTLINE_COLOR;
        Game.ctx.fillRect(
          Math.round(cx - 0.5 * width + x * (s + 2 * b + g)),
          Math.round(cy - 0.5 * height),
          Math.round(s + 2 * b),
          Math.round(s + 2 * b),
        );
        if (x !== this.costItems.length) {
          Game.ctx.fillStyle = FILL_COLOR;
          Game.ctx.fillRect(
            Math.round(cx - 0.5 * width + x * (s + 2 * b + g) + b),
            Math.round(cy - 0.5 * height + b),
            Math.round(s),
            Math.round(s),
          );
        }
      }

      if (Date.now() - this.openTime >= OPEN_TIME) {
        for (let i = 0; i < this.costItems.length + 2; i++) {
          let drawX = Math.round(
            cx -
              0.5 * width +
              i * (s + 2 * b + g) +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE,
          );
          let drawY = Math.round(
            cy -
              0.5 * height +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE,
          );

          let drawXScaled = drawX / GameConstants.TILESIZE;
          let drawYScaled = drawY / GameConstants.TILESIZE;

          if (i < this.costItems.length) {
            let a = 1;
            if (!this.playerOpened.inventory.hasItemCount(this.costItems[i]))
              a = 0.15;
            this.costItems[i].drawIcon(delta, drawXScaled, drawYScaled, a);
          } else if (i === this.costItems.length) {
            Game.drawFX(2, 0, 1, 1, drawXScaled, drawYScaled, 1, 1);
          } else if (i === this.costItems.length + 1) {
            this.item.drawIcon(
              delta,
              drawXScaled,
              drawYScaled,
              1,
              this.quantity,
            );
          }
        }
      }
      this.buyAnimAmount *= this.buyAnimAmount;
      if (GameConstants.ALPHA_ENABLED)
        Game.ctx.globalAlpha = this.buyAnimAmount;
      Game.ctx.fillStyle = FULL_OUTLINE;
      Game.ctx.fillRect(
        Math.round(cx - 0.5 * width) - ob,
        Math.round(cy - 0.5 * height) - ob,
        Math.round(width + 2 * ob),
        Math.round(height + 2 * ob),
      );
      Game.ctx.globalAlpha = 1.0;
    }
  };
}
