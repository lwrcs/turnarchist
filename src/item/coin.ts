import { Item } from "./item";
import { Room } from "../room/room";
import { Sound } from "../sound/sound";
import { GameConstants } from "../game/gameConstants";
import { Random } from "../utility/random";

export class Coin extends Item {
  static itemName = "coin";
  static examineText = "A coin. Shiny and spendable.";
  private chestRevealPickupTimeoutId: number | null = null;
  //checked: boolean;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 19;
    this.tileY = 0;
    this.stackCount = 1;
    this.stackable = true;
    this.name = Coin.itemName;
    //if (GameConstants.COIN_ANIMATION) this.animateToInventory = true;
  }

  queueAutoPickupAfterChestReveal = () => {
    // Items dropped from chests intentionally do NOT auto-pickup immediately (see Entity.dropLoot()).
    // For coins, we want: float-up reveal first, then animate-to-inventory pickup.
    if (this.chestRevealPickupTimeoutId !== null) return;

    // The chest "float up" reveal is purely visual and is driven by render delta.
    // Use a small wall-clock delay that matches the feel of the reveal animation.
    this.chestRevealPickupTimeoutId = window.setTimeout(() => {
      this.chestRevealPickupTimeoutId = null;
      if (this.pickedUp) return;
      if (this.level !== this.level.game.room) return;

      // Stop treating it as "in chest" so the pickup animation isn't offset strangely.
      this.inChest = false;
      this.autoPickup();
    }, 750);
  };
  onDrop = () => {
    const coinList = []; //array to store coin objects
    for (const item of this.level.items) {
      if (item instanceof Coin) coinList.push(item);
    }
    for (const otherCoin of coinList) {
      if (
        this !== otherCoin &&
        this.x === otherCoin.x &&
        this.y === otherCoin.y
      ) {
        this.stackCount += otherCoin.stackCount;
        this.level.items = this.level.items.filter((x) => x !== otherCoin);
      }
      if (this.stackCount >= 3) this.tileX = 20;
      if (this.stackCount >= 7) this.tileX = 21;
    }
  };
  get distanceToBottomRight() {
    return Math.sqrt(
      (this.x + this.w - window.innerWidth) ** 2 +
        (this.y + this.h - window.innerHeight) ** 2,
    );
  }

  autoPickup = () => {
    if (GameConstants.COIN_AUTO_PICKUP)
      this.onPickup(this.level.game.players[this.level.game.localPlayerID]);
  };

  pickupSound = () => {
    let delay = 0;
    if (GameConstants.COIN_ANIMATION)
      delay = Math.ceil(Random.rand() * 200 + 400);

    if (this.level === this.level.game.room)
      Sound.delayPlay(Sound.pickupCoin, delay);
  };
}
