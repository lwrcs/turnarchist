import { Level } from "../level";
import { Game } from "../game";
import { Equippable } from "../item/equippable";
import { Player } from "../player";

export class Weapon extends Equippable {
  game: Game;
  canMine: boolean;

  constructor(level: Level, x: number, y: number) {
    super(level, x, y);

    if (level) this.game = level.game;

    this.canMine = false;
  }

  coEquippable = (other: Equippable): boolean => {
    if (other instanceof Weapon) return false;
    return true;
  };

  tick = () => { };

  // returns true if nothing was hit, false if the player should move
  weaponMove = (newX: number, newY: number): boolean => {
    return true;
  };
}
