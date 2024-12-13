import { Game } from "../game";
import { Weapon } from "./weapon";
import { Room } from "../room";
import { Sound } from "../sound";
import { PlayerFireball } from "../projectile/playerFireball";
import { Entity } from "../entity/entity";
import { Enemy } from "../entity/enemy/enemy";
import { Utils } from "../utils";
import { Direction } from "../game";
export class Spellbook extends Weapon {
  targets: Entity[];
  isTargeting: boolean;
  static itemName = "spear";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.range = 4;
    this.tileX = 25;
    this.tileY = 0;
    this.canMine = true;
    this.name = "Spellbook";
    this.isTargeting = false;
    this.durability = 5;
    this.durabilityMax = 10;
    this.description = "Hits multiple enemies within a range of 4 tiles.";
  }

  getTargets = () => {
    this.targets = [];
    let entities = this.game.rooms[this.wielder.levelID].entities;
    this.targets = entities.filter(
      (e) =>
        !e.pushable &&
        Utils.distance(this.wielder.x, this.wielder.y, e.x, e.y) <= this.range,
    );
    let enemies = this.targets.filter((e) => e instanceof Enemy);
    //console.log(enemies);
    if (enemies.length > 0) return enemies;
    else {
      //console.log(this.targets);
      return this.targets;
    }
  };

  weaponMove = (newX: number, newY: number): boolean => {
    this.getTargets();
    let direction = this.wielder.direction;
    let flag = false;
    let targets = this.targets;
    const isTargetInDirection = (e: Entity): boolean => {
      switch (direction) {
        case Direction.UP:
          return e.y <= newY;
        case Direction.RIGHT:
          return e.x >= newX;
        case Direction.DOWN:
          return e.y >= newY;
        case Direction.LEFT:
          return e.x <= newX;
        default:
          return false;
      }
    };
    if (targets.length > 0) {
      this.isTargeting = true;
    } else {
      this.isTargeting = false;
    }

    targets = targets.filter(isTargetInDirection);

    for (let e of targets) {
      if (
        !this.game.rooms[this.wielder.levelID].roomArray[e.x][e.y].isSolid()
      ) {
        e.hurt(this.wielder, 1);

        this.game.rooms[this.wielder.levelID].projectiles.push(
          new PlayerFireball(this.wielder, e.x, e.y),
        );

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

      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.hitX, 10 * this.wielder.hitY);
      Sound.playMagic();
      this.degrade();
      setTimeout(() => {
        this.isTargeting = false;
      }, 100);
    }
    return !flag;
  };
}
