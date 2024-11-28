import { Item } from "./item";
import { Game } from "../game";
import { LevelConstants } from "../levelConstants";
import { Player } from "../player";
import { Room } from "../room";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../gameConstants";
import { Equippable } from "./equippable";

export class Armor extends Equippable {
  health: number;
  rechargeTurnCounter: number;
  readonly RECHARGE_TURNS = 15;

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.health = 1;
    this.rechargeTurnCounter = -1;
    this.tileX = 5;
    this.tileY = 0;
  }

  coEquippable = (other: Equippable): boolean => {
    if (other instanceof Armor) return false;
    return true;
  };

  getDescription = (): string => {
    return (
      "ENCHANTED ARMOR\nA magic suit of armor. Absorbs one hit and regenerates after " +
      this.RECHARGE_TURNS +
      " turns."
    );
  };

  tickInInventory = () => {
    if (this.rechargeTurnCounter > 0) {
      this.rechargeTurnCounter--;
      if (this.rechargeTurnCounter === 0) {
        this.rechargeTurnCounter = -1;
        this.health = 1;
      }
    }
  };

  hurt = (damage: number) => {
    if (this.health <= 0) return;
    this.health -= damage;
    this.rechargeTurnCounter = this.RECHARGE_TURNS + 1;
  };

  drawGUI = (delta: number, playerHealth: number) => {
    if (this.rechargeTurnCounter === -1)
      Game.drawFX(5, 2, 1, 1, playerHealth, LevelConstants.SCREEN_H - 1, 1, 1);
    else {
      let rechargeProportion =
        1 - this.rechargeTurnCounter / this.RECHARGE_TURNS;

      if (rechargeProportion < 0.5)
        Game.drawFX(
          7,
          2,
          1,
          1,
          playerHealth,
          LevelConstants.SCREEN_H - 1,
          1,
          1,
        );
      else
        Game.drawFX(
          8,
          2,
          1,
          1,
          playerHealth,
          LevelConstants.SCREEN_H - 1,
          1,
          1,
        );
    }
  };
}
