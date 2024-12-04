import { Room } from "../room";
import { Game } from "../game";
import { Equippable } from "../item/equippable";
import { Player } from "../player";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Enemy } from "../entity/enemy/enemy";
import { Entity } from "../entity/entity";
import { GameConstants } from "../gameConstants";
import { Utils } from "../utils";

interface WeaponStatus {
  poison: boolean;
  blood: boolean;
}

export abstract class Weapon extends Equippable {
  game: Game;
  range: number;
  canMine: boolean;
  damage: number;
  status: WeaponStatus;
  constructor(level: Room, x: number, y: number, status?: WeaponStatus) {
    super(level, x, y);

    if (level) this.game = level.game;

    this.canMine = false;
    this.range = 1;
    this.damage = 1;
    this.status = status || { poison: false, blood: false };
  }

  break = () => {
    this.durability = 0;
    this.wielder.inventory.weapon = null;
    this.toggleEquip();
    this.wielder.inventory.removeItem(this);
    this.wielder = null;
  };

  coEquippable = (other: Equippable): boolean => {
    if (other instanceof Weapon) return false;
    return true;
  };

  applyStatus = (status: WeaponStatus) => {
    this.status = status;
  };

  statusEffect = (enemy: Entity) => {
    if (enemy instanceof Enemy) {
      if (this.status.poison) enemy.poison();
      if (this.status.blood) enemy.bleed();
    }
  };

  weaponMove = (newX: number, newY: number): boolean => {
    let flag = false;
    for (let e of this.game.rooms[this.wielder.levelID].entities) {
      if (e.destroyable && !e.pushable && e.pointIn(newX, newY)) {
        e.hurt(this.wielder, this.damage);
        this.statusEffect(e);

        flag = true;
      }
    }
    if (flag) {
      if (
        this.wielder.game.rooms[this.wielder.levelID] === this.wielder.game.room
      )
        Sound.hit();
      this.wielder.hitX = 0.5 * (this.wielder.x - newX);
      this.wielder.hitY = 0.5 * (this.wielder.y - newY);
      this.game.rooms[this.wielder.levelID].particles.push(
        new SlashParticle(newX, newY),
      );
      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.hitX, 10 * this.wielder.hitY);
      this.degrade();
      console.log(this.durability);
    }
    return !flag;
  };

  drawStatus = (x: number, y: number) => {
    if (this.status.poison || this.status.blood) {
      let tileX = 3;
      if (this.status.poison) {
        tileX = 4;
      }
      if (this.status.blood) {
        tileX = 3;
      }

      Game.drawFX(
        tileX,
        0,
        1,
        1,
        x - 1 / GameConstants.TILESIZE,
        y - 1 / GameConstants.TILESIZE,
        1,
        1,
      );
    }
  };

  getDescription = (): string => {
    return `${this.name}\nDamage ${this.damage}`;
  };

  tick = () => {};

  // returns true if nothing was hit, false if the player should move
}
