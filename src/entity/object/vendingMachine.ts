import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { Entity } from "../entity";
import { Item } from "../../item/item";
import { Key } from "../../item/key";
import { Coin } from "../../item/coin";
import { Coal } from "../../item/resource/coal";
import { GreenGem } from "../../item/resource/greengem";
import { GameConstants } from "../../game/gameConstants";
import { Shotgun } from "../../item/weapon/shotgun";
import { Dagger } from "../../item/weapon/dagger";
import { Armor } from "../../item/armor";
import { Heart } from "../../item/usable/heart";
import { Spear } from "../../item/weapon/spear";
import { Gold } from "../../item/resource/gold";
import { BlueGem } from "../../item/resource/bluegem";
import { DualDagger } from "../../item/weapon/dualdagger";
import { Lantern } from "../../item/light/lantern";
import { RedGem } from "../../item/resource/redgem";
import { EntityType } from "../entity";
import { Random } from "../../utility/random";
import { Warhammer } from "../../item/weapon/warhammer";
import { Torch } from "../../item/light/torch";
import { Spellbook } from "../../item/weapon/spellbook";
import { Candle } from "../../item/light/candle";
import { Pickaxe } from "../../item/tool/pickaxe";
import { Utils } from "../../utility/utils";

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
      this.setCost(3);
    } else if (this.item instanceof Heart) {
      this.setCost(1, [new Coin(room, 0, 0)], [9, 10, 11], 3); // Uses default random cost
    } else if (this.item instanceof Spear) {
      this.setCost(2); // Uses default random cost
    } else if (this.item instanceof Armor) {
      this.setCost(3); // Uses default random cost
    } else if (this.item instanceof DualDagger) {
      this.setCost(3); // Uses default random cost
    } else if (this.item instanceof Lantern) {
      this.setCost(2); // Uses default random cost
    } else if (this.item instanceof Warhammer) {
      this.setCost(2); // Uses default random cost
    } else if (this.item instanceof Spellbook) {
      this.setCost(3); // Uses default random cost
    } else if (this.item instanceof Torch) {
      this.setCost(2); // Uses default random cost
    } else if (this.item instanceof Candle) {
      this.setCost(1, [new Coin(room, 0, 0)], [9, 10, 11], 2);
    } else if (this.item instanceof Pickaxe) {
      this.setCost(1, [new Coin(room, 0, 0)], [Utils.randomNormalInt(15, 25)]);
    }
  }

  setCost = (
    value: number = 1,
    costItems?: Item[],
    counts?: number[],
    quantity: number = 1,
  ) => {
    //value is arbitrary multiplies the stackcount to adapt to the item
    if (!costItems || !counts) {
      // Default behavior: randomly choose between gems and coins
      const possibleItems = [
        new BlueGem(this.room, 0, 0),
        new GreenGem(this.room, 0, 0),
        new RedGem(this.room, 0, 0),
        new Coin(this.room, 0, 0),
      ];
      const costItem = Game.randTable(possibleItems, Random.rand);

      if (costItem instanceof Coin) {
        costItem.stackCount = Game.randTable([20, 25, 30], Random.rand);
      } else {
        costItem.stackCount = Game.randTable([1, 2, 3], Random.rand);
      }
      costItem.stackCount *= value;

      this.costItems = [costItem];
    } else {
      // Original behavior for custom costs
      const randCount = Game.randTable(counts, Random.rand);
      const costItem = Game.randTable(costItems, Random.rand);
      costItem.stackCount = randCount;
      //if (costItem instanceof Coin) {
      //costItem.stackCount *= Game.randTable([9, 10, 11], Random.rand);
      //}
      this.costItems = [costItem];
    }

    this.quantity = quantity;
  };

  static isPointInVendingMachineBounds = (
    x: number,
    y: number,
    shop: VendingMachine,
  ): boolean => {
    // First check if this is the currently open vending machine
    if (!shop.open || shop !== shop.playerOpened?.openVendingMachine)
      return false;

    // Get screen center coordinates
    const screenCenterX = GameConstants.WIDTH / 2;
    const screenCenterY = GameConstants.HEIGHT / 2;

    // Calculate the offset between player and shop in tile coordinates
    const offsetX = (shop.x - shop.playerOpened.x) * GameConstants.TILESIZE;
    const offsetY = (shop.y - shop.playerOpened.y) * GameConstants.TILESIZE;

    // Calculate shop's position on screen relative to the centered player
    const shopScreenX = screenCenterX + offsetX;
    const shopScreenY = screenCenterY + offsetY;

    // Use the same calculations as in drawTopLayer to determine bounds
    let s = 18; // size of box
    let b = 2; // border
    let g = -2; // gap
    let width = (shop.costItems.length + 2) * (s + 2 * b + g) - g;
    let height = s + 2 * b + g - g;

    // Calculate the center of the vending machine interface
    // Note: The -1.5 adjustment for Y matches what's in drawTopLayer
    let cx = shopScreenX;
    let cy = shopScreenY - 1.5 * GameConstants.TILESIZE;

    const leftBound = Math.round(cx - 0.5 * width);
    const rightBound = leftBound + Math.round(width);
    const topBound = Math.round(cy - 0.5 * height);
    const bottomBound = topBound + Math.round(height);

    // Check if the point is within the bounds of the vending machine UI
    return (
      x >= leftBound && x <= rightBound && y >= topBound && y <= bottomBound
    );
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
      // Check if player can pay
      for (const i of this.costItems) {
        if (!this.playerOpened.inventory.hasItemCount(i)) {
          let numOfItem = 0;

          if (i instanceof Coin) {
            numOfItem = this.playerOpened.inventory.coinCount();
          } else {
            this.playerOpened.inventory.items.forEach((item) => {
              if (item instanceof i.constructor) {
                numOfItem += item.stackCount;
              }
            });
          }

          const difference = this.costItems[0].stackCount - numOfItem;

          const pluralLetter = this.costItems[0].stackCount > 1 ? "s" : "";

          this.game.pushMessage(
            `You need ${difference} more ${(this.costItems[0].constructor as any).itemName}${pluralLetter} to buy that. `,
          );
          return;
        }
      }

      // Create the new item instance
      let newItem = new (this.item.constructor as any)(
        this.room,
        this.x,
        this.y,
      );
      //     newItem = newItem.constructor(this.room, this.x, this.y);

      // **Attempt to add the item directly to the player's inventory**
      const addedSuccessfully = this.playerOpened.inventory.addItem(newItem);

      if (!addedSuccessfully) {
        // If adding the item failed, refund the cost items
        //for (const i of this.costItems) {
        //this.playerOpened.inventory.addItem(i);
        //}
        this.game.pushMessage(
          "Your inventory is full. Cannot purchase the item.",
        );
        return;
      }

      // Subtract the cost items from player's inventory
      for (const i of this.costItems) {
        this.playerOpened.inventory.subtractItemCount(i);
      }

      const cost = this.costItems[0].stackCount;
      const pluralLetter = cost > 1 ? "s" : "";

      // Decrement the quantity of items available in the vending machine, if not infinite
      if (!this.isInf) {
        this.quantity--;
        if (this.quantity <= 0) this.close();
      }

      // Notify the player of the successful purchase
      this.game.pushMessage(
        `Purchased ${(newItem.constructor as any).itemName} for ${cost} ${(this.costItems[0].constructor as any).itemName}${pluralLetter}`,
      );
      this.game.pushMessage(`${this.quantity} available to buy.`);

      // Handle visual feedback and screen shake
      this.buyAnimAmount = 0.99;
      if (this.playerOpened === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(0, 4);
    }
  };

  draw = (delta: number) => {
    let tileX = 19;
    if (!this.isInf && this.quantity === 0) tileX = 20;
    if (this.hasShadow) this.drawShadow(delta);

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
    if (this.open && this.playerOpened.inventory.isOpen) {
      this.close();
      return;
    }
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
