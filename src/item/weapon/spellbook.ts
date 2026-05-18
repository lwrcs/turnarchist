import { Game } from "../../game";
import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";
import { PlayerFireball } from "../../projectile/playerFireball";
import type { Entity } from "../../entity/entity";
import { Utils } from "../../utility/utils";
import { Direction } from "../../game";
import { SpellbookPage } from "../usable/spellbookPage";
import { GameplaySettings } from "../../game/gameplaySettings";
import type { RangedWeapon } from "./rangedTargetingSystem";
import type { Player } from "../../player/player";
import { PlusSpell, type Spell } from "./spell";
import { SpellBeam } from "../../projectile/spellBeam";

export class Spellbook extends Weapon implements RangedWeapon {
  targets: Entity[];
  isTargeting: boolean;
  targetingMaxRange = 4;
  spells: Spell[];
  activeSpell: Spell;
  pendingSpell: Spell | null;
  static itemName = "spellbook";
  static examineText = "A spellbook. Arcane pages and dangerous ideas.";
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
    this.degradeable = true;
    // Spellbook uses cooldown; player "mana" UI is derived from this cooldown.
    this.manaCost = 0;
    this.cooldownMax = 10;
    this.spells = [new PlusSpell()];
    this.activeSpell = this.spells[0];
    this.pendingSpell = null;
  }

  getPatternOffsets = (): Array<{ dx: number; dy: number }> => {
    return (this.pendingSpell ?? this.activeSpell).getPattern().offsets;
  };

  addSpell = (spell: Spell): void => {
    if (this.spells.some((s) => s.id === spell.id)) return;
    this.spells.push(spell);
  };

  toggleEquip = () => {
    if (GameplaySettings.SPELLBOOK_TARGETING_ENABLED) {
      const rt = (this.wielder as unknown as Player)?.rangedTargeting;
      if (rt?.active) {
        rt.stop();
        return;
      }
      if (this.broken) {
        this.level.game.pushMessage("Your spellbook is broken.");
        return;
      }
      if (this.cooldown > 0) {
        this.level.game.pushMessage("Not enough mana.");
        return;
      }
      rt?.start(this);
      return;
    }
    super.toggleEquip();
  };

  fireAtTarget = (player: Player, tx: number, ty: number): boolean => {
    if (this.broken || this.cooldown > 0) return false;
    const room = player.getRoom();
    if (!room) return false;
    const z = (player as any).z ?? 0;

    const spell = this.pendingSpell ?? this.activeSpell;
    this.pendingSpell = null;
    const damage = this.damage + player.magicDamageBonus;

    // Set cooldown immediately so the UI reflects "casting" and prevents double-fire.
    this.cooldown = this.cooldownMax + 1;
    for (const item of player.inventory.items) {
      if (item instanceof Spellbook) item.cooldown = item.cooldownMax + 1;
    }
    player.syncManaFromSpellbookCooldowns();

    // SpellBeam animates to the target; actual damage + turn advance fires on arrival.
    const beam = new SpellBeam(room, player, tx, ty, () => {
      const { offsets, delays } = spell.getPattern();
      let anyFired = false;
      for (let i = 0; i < offsets.length; i++) {
        const px = tx + offsets[i].dx;
        const py = ty + offsets[i].dy;
        if (room.isSolidAt(px, py, z)) continue;
        room.projectiles.push(new PlayerFireball(player, px, py, delays[i]));
        for (const e of room.entities) {
          if (e.pointIn(px, py) && e.destroyable && !e.pushable && (e.z ?? 0) === z) {
            e.hurt(player, damage);
          }
        }
        anyFired = true;
      }
      if (anyFired) {
        player.setHitXY(tx, ty);
        room.tick(player);
        this.hitSound();
        Sound.playMagic();
        this.degrade();
      }
    });
    room.projectiles.push(beam);

    return true;
  };

  getTargets = () => {
    this.targets = [];
    const room = (this.wielder as any)?.getRoom
      ? (this.wielder as any).getRoom()
      : this.game.rooms[this.wielder.levelID];
    let entities = room.entities;
    const z = this.wielder?.z ?? 0;
    this.targets = entities.filter(
      (e) =>
        !e.pushable &&
        Utils.distance(this.wielder.x, this.wielder.y, e.x, e.y) <=
          this.range &&
        e.destroyable &&
        (e?.z ?? 0) === z,
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
    if (GameplaySettings.SPELLBOOK_TARGETING_ENABLED) return true;
    //if (!this.checkForCollidables(newX, newY)) return true;
    // If we're on cooldown, treat as "out of mana" (mana bar is synced to cooldown).
    if (this.cooldown > 0) {
      this.level.game.pushMessage("Not enough mana.");
      return true;
    }

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
      if (!room.isSolidAt(e.x, e.y, this.wielder?.z ?? 0)) {
        e.hurt(this.wielder, this.damage + this.wielder.magicDamageBonus); //don't apply damage bonus for magic weapons

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

      const room = this.wielder.getRoom();
      room.tick(this.wielder);
      this.shakeScreen(newX, newY);
      Sound.playMagic();
      this.degrade();
      // Put spellbooks on cooldown; player mana UI reflects this.
      // Important: set to cooldownMax+1 so the end-of-turn cooldown tick doesn't immediately
      // "recharge" mana on the same turn as casting.
      this.cooldown = this.cooldownMax + 1;
      for (let item of this.wielder.inventory.items) {
        if (item instanceof Spellbook) {
          item.cooldown = item.cooldownMax + 1;
        }
      }
      this.wielder.syncManaFromSpellbookCooldowns();

      setTimeout(() => {
        this.isTargeting = false;
      }, 100);
    }
    return !flag;
  };

  // Spellbook can hit targets in any direction within a radius; for UI range checks,
  // match the same distance test used by `getTargets()`.
  isTargetInRange = (targetX: number, targetY: number): boolean => {
    if (!this.wielder) return false;
    return (
      Utils.distance(this.wielder.x, this.wielder.y, targetX, targetY) <=
      this.range
    );
  };

  // Spellbook uses the clicked tile as its aim point.
  getAttackInputTileForTarget = (
    targetX: number,
    targetY: number,
  ): { x: number; y: number } | null => {
    return { x: targetX, y: targetY };
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
