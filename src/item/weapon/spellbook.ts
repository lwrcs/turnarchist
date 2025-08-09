import { Game } from "../../game";
import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";
import { PlayerFireball } from "../../projectile/playerFireball";
import type { Entity } from "../../entity/entity";
import { Utils } from "../../utility/utils";
import { Direction } from "../../game";
import { SpellbookPage } from "../usable/spellbookPage";
export class Spellbook extends Weapon {
  targets: Entity[];
  isTargeting: boolean;
  static itemName = "spellbook";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.range = 4;
    this.tileX = 25;
    this.tileY = 0;
    this.canMine = true;
    this.name = Spellbook.itemName;
    this.isTargeting = false;
    this.durability = 10;
    this.durabilityMax = 10;
    this.description = "Hits multiple enemies within a range of 4 tiles.";
    this.degradeable = false;
    this.cooldownMax = 25;
  }

  getTargets = () => {
    this.targets = [];
    const room = (this.wielder as any)?.getRoom
      ? (this.wielder as any).getRoom()
      : this.game.rooms[this.wielder.levelID];
    let entities = room.entities;
    this.targets = entities.filter(
      (e) =>
        !e.pushable &&
        Utils.distance(this.wielder.x, this.wielder.y, e.x, e.y) <=
          this.range &&
        e.destroyable,
    );
    let enemies = this.targets.filter((e) => e.isEnemy === true);
    //console.log(enemies);
    if (enemies.length > 0) return enemies;
    else {
      //console.log(this.targets);
      return this.targets;
    }
  };

  disassemble = () => {
    if (this.equipped) {
      this.game.pushMessage(
        "I should probably unequip this before I try to disassemble it...",
      );
      return;
    }
    this.game.pushMessage(
      `You tear the remaining pages out of your spellbook.`,
    );

    let inventory = this.wielder.inventory;
    let inventoryX = this.x;
    let inventoryY = this.y;
    let numFragments = Math.floor(this.durability);
    this.toggleEquip();
    //inventory.weapon = null;
    inventory.removeItem(this);
    inventory.addItem(
      new SpellbookPage(this.level, inventoryX, inventoryY, numFragments),
    );
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

    // Store only the targets that actually get hit
    const actuallyHitTargets: Entity[] = [];

    for (let e of targets) {
      const room = (this.wielder as any)?.getRoom
        ? (this.wielder as any).getRoom()
        : this.game.rooms[this.wielder.levelID];
      if (!room.roomArray[e.x][e.y].isSolid()) {
        e.hurt(this.wielder, 1);

        room.projectiles.push(new PlayerFireball(this.wielder, e.x, e.y));

        // Add to the list of actually hit targets
        actuallyHitTargets.push(e);
        flag = true;
      }
    }

    // Update this.targets to only contain targets that were actually hit
    this.targets = actuallyHitTargets;

    if (flag) {
      this.hitSound();
      this.wielder.setHitXY(newX, newY);

      const room = (this.wielder as any)?.getRoom
        ? (this.wielder as any).getRoom()
        : this.game.rooms[this.wielder.levelID];
      room.tick(this.wielder);
      this.shakeScreen(newX, newY);
      Sound.playMagic();
      //this.degrade();
      this.cooldown = this.cooldownMax;

      setTimeout(() => {
        this.isTargeting = false;
      }, 100);
    }
    return !flag;
  };

  drawBeams = (playerDrawX: number, playerDrawY: number, delta: number) => {
    // Clear existing beam effects each frame
    const room = (this.wielder as any)?.getRoom
      ? (this.wielder as any).getRoom()
      : this.game.rooms[this.wielder.levelID];
    room.beamEffects = [];

    if (this.isTargeting) {
      for (let target of this.targets) {
        // Create a new beam effect from the player to the enemy
        room.addBeamEffect(
          playerDrawX,
          playerDrawY,
          target.x - (target as any).drawX,
          target.y - (target as any).drawY,
          target,
        );

        // Retrieve the newly added beam effect
        const beam = room.beamEffects[room.beamEffects.length - 1];

        // Render the beam
        beam.render(
          playerDrawX,
          playerDrawY,
          target.x - (target as any).drawX,
          target.y - (target as any).drawY,
          "cyan",
          2,
          delta,
        );
      }
    }
  };
}
