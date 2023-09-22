import { Item } from "./item";
import { Player } from "../player";
import { Game } from "../game";
import { Level } from "../level";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../gameConstants";
import { Sound } from "../sound";

export class Coin extends Item {
  stack: number;
  //checked: boolean;
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);

    this.tileX = 19;
    this.tileY = 0;
    this.stack = 1;
    this.stackable = true;
  }
  onDrop = () => {
    const coinList = []; //array to store coin objects
    for (const item of this.level.items) {
      if (item instanceof Coin) coinList.push(item);
    }
    console.log(coinList);
      for (const otherCoin of coinList) {
        if (
          this !== otherCoin &&
          this.x === otherCoin.x &&
          this.y === otherCoin.y
        ) {
          this.stack += otherCoin.stack;
          this.level.items = this.level.items.filter((x) => x !== otherCoin);
        }
        if (this.stack === 2) this.tileX = 20;
        else if (this.stack >= 3) this.tileX = 21;
      }
  };
  draw = (delta: number) => {
    if (!this.pickedUp) {
      this.drawableY = this.y;

      if (this.scaleFactor < 1) this.scaleFactor += 0.04;
      else this.scaleFactor = 1;

      Game.drawItem(0, 0, 1, 1, this.x, this.y, 1, 1);
      this.frame += (delta * (Math.PI * 2)) / 60;
      Game.drawItem(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x + this.w * (this.scaleFactor * -0.5 + 0.5),
        this.y +
          Math.sin(this.frame) * 0.07 -
          1 +
          this.offsetY +
          this.h * (this.scaleFactor * -0.5 + 0.5),
        this.w * this.scaleFactor,
        this.h * this.scaleFactor,
        this.level.shadeColor,
        this.shadeAmount()
      );
    }
  };
  pickupSound = () => {
    if (this.level === this.level.game.level) Sound.pickupCoin();
  };
}
