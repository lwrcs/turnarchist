import { Weapon } from "./weapon";
import { Room } from "../room/room";
import { Sound } from "../sound";
import { Direction } from "../game";
import { Entity } from "../entity/entity";

export class Greataxe extends Weapon {
  static itemName = "greataxe";
  hitDelay: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 24;
    this.tileY = 2;
    this.damage = 2;
    this.name = "greataxe";
    this.durability = 10;
    this.durabilityMax = 10;
    this.hitDelay = 225;
  }

  hitSound = () => {
    Sound.hit();
    Sound.playWarHammer();
  };

  adjustedDamage = () => {
    let hp = this.wielder?.health / this.wielder?.maxHealth;
    let damage = 1;

    if (hp <= 1) damage = 1;
    if (hp <= 0.75) damage = 2;
    if (hp <= 0.5) damage = 4;
    if (hp <= 0.25) damage = 8;
    return damage;
  };

  attack = (enemy: Entity) => {
    enemy.hurt(this.wielder, this.adjustedDamage());
    this.statusEffect(enemy);
  };

  shakeScreen = () => {
    this.wielder.beginSlowMotion();

    setTimeout(() => {
      this.wielder.endSlowMotion();
      //this.hitSound();
      switch (this.wielder.direction) {
        case Direction.DOWN:
          this.game.shakeScreen(0, -10 * this.adjustedDamage(), false);
          break;
        case Direction.UP:
          this.game.shakeScreen(0, -10 * this.adjustedDamage(), false);
          break;
        case Direction.LEFT:
          this.game.shakeScreen(-5, -10 * this.adjustedDamage(), false);
          break;
        case Direction.RIGHT:
          this.game.shakeScreen(5, -10 * this.adjustedDamage(), false);
          break;
      }
    }, this.hitDelay);
  };
}
