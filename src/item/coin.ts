import { Item } from "./item";
import { Game } from "../game";
import { Room } from "../room/room";
import { Sound } from "../sound/sound";

export class Coin extends Item {
  static itemName = "coin";
  //checked: boolean;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 19;
    this.tileY = 0;
    this.stackCount = 1;
    this.stackable = true;
    this.name = Coin.itemName;
  }
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

  pickupSound = () => {
    if (this.level === this.level.game.room) Sound.pickupCoin();
  };
}
