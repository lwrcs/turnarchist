import { Game } from "../game";
import { LevelConstants } from "../level/levelConstants";
import { Room } from "../room/room";
import { Equippable } from "./equippable";
import { GameConstants } from "../game/gameConstants";

export class Armor extends Equippable {
  health: number;
  rechargeTurnCounter: number;
  readonly RECHARGE_TURNS = 25;
  static itemName = "armor";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.health = 1;
    this.rechargeTurnCounter = -1;
    this.tileX = 5;
    this.tileY = 0;
    this.name = "armor";
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
    this.health -= Math.max(damage, 1);
    this.rechargeTurnCounter = this.RECHARGE_TURNS + 1;
  };

  drawGUI = (
    delta: number,
    playerMaxHealth: number,
    quickbarStartX: number,
  ) => {
    // Get the quickbar's left edge position (same as in playerRenderer)
    // Convert to tile coordinates
    const heartStartX = (quickbarStartX - 7) / GameConstants.TILESIZE;
    // Position after the hearts

    const shieldX = Math.max(heartStartX, -0.2) + playerMaxHealth / 1.5 + 0.5;
    let offsetY = GameConstants.WIDTH > 175 ? 0 : -1.25;

    if (this.rechargeTurnCounter === -1)
      Game.drawFX(
        5,
        2,
        0.75,
        0.75,
        shieldX,
        GameConstants.HEIGHT / GameConstants.TILESIZE - 1 + offsetY,
        0.75,
        0.75,
      );
    else {
      let rechargeProportion =
        1 - this.rechargeTurnCounter / this.RECHARGE_TURNS;

      if (rechargeProportion < 0.5)
        Game.drawFX(
          7,
          2,
          0.75,
          0.75,
          shieldX,
          GameConstants.HEIGHT / GameConstants.TILESIZE - 1 + offsetY,
          0.75,
          0.75,
        );
      else
        Game.drawFX(
          8,
          2,
          0.75,
          0.75,
          shieldX,
          GameConstants.HEIGHT / GameConstants.TILESIZE - 1 + offsetY,
          0.75,
          0.75,
        );
    }
  };
}
