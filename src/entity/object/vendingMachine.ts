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
      g.stackCount = Game.randTable([5, 5, 6, 7], Random.rand);
      this.costItems = [g];
    } else if (this.item instanceof Heart) {
      let c = new Coin(room, 0, 0);
      c.stackCount = 10;
      this.costItems = [c];
      this.isInf = true;
    } else if (this.item instanceof Spear) {
      let g = new GreenGem(room, 0, 0);
      g.stackCount = Game.randTable([5, 5, 6, 7], Random.rand);
      this.costItems = [g];
    } else if (this.item instanceof Armor) {
      let g = new Gold(room, 0, 0);
      g.stackCount = Game.randTable([5, 5, 6, 7], Random.rand);
      this.costItems = [g];
    } else if (this.item instanceof DualDagger) {
      let g = new RedGem(room, 0, 0);
      g.stackCount = Game.randTable([5, 5, 6, 7], Random.rand);
      this.costItems = [g];
    } else if (this.item instanceof Lantern) {
      let g = new Coal(room, 0, 0);
      g.stackCount = Game.randTable([25, 26, 27, 28], Random.rand);
      this.costItems = [g];
    }
  }

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
        if (!this.playerOpened.inventory.hasItemCount(i)) return;
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
      this.room.items.push(newItem);

      if (!this.isInf) {
        this.quantity--;
        if (this.quantity <= 0) this.close();
      }

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
      this.shadeAmount()
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
        Math.round(height + 2 * ob)
      );
      for (let x = 0; x < this.costItems.length + 2; x++) {
        Game.ctx.fillStyle = OUTLINE_COLOR;
        Game.ctx.fillRect(
          Math.round(cx - 0.5 * width + x * (s + 2 * b + g)),
          Math.round(cy - 0.5 * height),
          Math.round(s + 2 * b),
          Math.round(s + 2 * b)
        );
        if (x !== this.costItems.length) {
          Game.ctx.fillStyle = FILL_COLOR;
          Game.ctx.fillRect(
            Math.round(cx - 0.5 * width + x * (s + 2 * b + g) + b),
            Math.round(cy - 0.5 * height + b),
            Math.round(s),
            Math.round(s)
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
              0.5 * GameConstants.TILESIZE
          );
          let drawY = Math.round(
            cy -
              0.5 * height +
              b +
              Math.floor(0.5 * s) -
              0.5 * GameConstants.TILESIZE
          );

          let drawXScaled = drawX / GameConstants.TILESIZE;
          let drawYScaled = drawY / GameConstants.TILESIZE;

          if (i < this.costItems.length) {
            let a = 1;
            if (!this.playerOpened.inventory.hasItemCount(this.costItems[i]))
              a = 0.15;
            this.costItems[i].drawIcon(delta, drawXScaled, drawYScaled, a);
          } else if (i === this.costItems.length) {
            Game.drawFX(0, 1, 1, 1, drawXScaled, drawYScaled, 1, 1);
          } else if (i === this.costItems.length + 1) {
            this.item.drawIcon(delta, drawXScaled, drawYScaled);
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
        Math.round(height + 2 * ob)
      );
      Game.ctx.globalAlpha = 1.0;
    }
  };
}
