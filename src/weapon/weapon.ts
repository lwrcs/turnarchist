import { Room } from "../room";
import { Game } from "../game";
import { Equippable } from "../item/equippable";
import { Player } from "../player";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";

export abstract class Weapon extends Equippable {
  game: Game;
  range: number;
  canMine: boolean;
  damage: number;

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    if (level) this.game = level.game;

    this.canMine = false;
    this.range = 1;
    this.damage = 1;
  }

  coEquippable = (other: Equippable): boolean => {
    if (other instanceof Weapon) return false;
    return true;
  };

  weaponMove = (newX: number, newY: number): boolean => {
    let flag = false;
    for (let e of this.game.rooms[this.wielder.levelID].entities) {
      if (e.destroyable && !e.pushable && e.pointIn(newX, newY)) {
        e.hurt(this.wielder, this.damage);

        flag = true;
      }
    }
    if (flag) {
      if (
        this.wielder.game.rooms[this.wielder.levelID] === this.wielder.game.room
      )
        Sound.hit();
      this.wielder.drawX = 0.5 * (this.wielder.x - newX);
      this.wielder.drawY = 0.5 * (this.wielder.y - newY);
      this.game.rooms[this.wielder.levelID].particles.push(
        new SlashParticle(newX, newY)
      );
      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.drawX, 10 * this.wielder.drawY);
    }
    return !flag;
  };

  getDescription = (): string => {
    return `${this.name}\nDamage ${this.damage}`;
  };

  tick = () => {};

  // returns true if nothing was hit, false if the player should move
}
