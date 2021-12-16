import { Item } from "./item";
import { Game } from "../game";
import { LevelConstants } from "../levelConstants";
import { Player } from "../player";
import { Level } from "../level";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../gameConstants";
import { Equippable } from "./equippable";
import { Inventory } from "../inventory";

export class Backpack extends Equippable {


  constructor(level: Level, x: number, y: number) {
    super(level, x, y);
    this.tileX = 4;
    this.tileY = 0;
  }

  coEquippable = (other: Equippable): boolean => {
    if (other instanceof Backpack) return false;
    return true;
  };

  getDescription = (): string => {
    return (
      "BACKPACK\nA normal looking backpack. Increases the amount you can carry. "
    );
  };
}
