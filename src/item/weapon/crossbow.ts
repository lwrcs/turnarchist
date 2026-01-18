import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { GenericParticle } from "../../particle/genericParticle";
import { ArrowParticle } from "../../particle/arrowParticle";
import { GameplaySettings } from "../../game/gameplaySettings";
import { CrossbowBolt } from "./crossbowBolt";
import { SKILL_DISPLAY_NAME } from "../../game/skills";
import { statsTracker } from "../../game/stats";

enum CrossbowState {
  EMPTY,
  LOADED,
  COCKED,
  FIRING,
}

export class Crossbow extends Weapon {
  static itemName = "crossbow";
  static examineText = "A crossbow. Point, load, and regret.";
  state: CrossbowState;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 23;
    this.tileY = 4;
    this.name = Crossbow.itemName;
    this.state = CrossbowState.EMPTY;
    this.disabled = true;
    this.damage = 4;
  }

  toggleEquip = () => {
    // Skill requirement gate (crossbow has a custom state-machine equip flow).
    if (this.wielder && this.requiredSkill) {
      const lvl = statsTracker.getSkillLevel(this.requiredSkill);
      if (lvl < this.requiredLevel) {
        this.level.game.pushMessage(
          `Requires ${SKILL_DISPLAY_NAME[this.requiredSkill]} level ${this.requiredLevel}.`,
        );
        return;
      }
    }

    if (
      !this.broken &&
      this.cooldown <= 0 &&
      this.state === CrossbowState.COCKED
    ) {
      if (!this.equipped && this.wielder?.inventory?.weapon) {
        this.previousWeapon = this.wielder.inventory.weapon;
      }

      this.equipped = !this.equipped;

      if (this.equipped) {
        this.onEquip();
      } else {
        this.onUnequip();
      }

      if (GameplaySettings.EQUIP_USES_TURN && this.equipped === true)
        this.wielder?.stall();
    } else if (this.state === CrossbowState.EMPTY) {
      this.tileX = 23;
      //this.equipped = false;

      this.level.game.pushMessage("Use a bolt on the crossbow to load it.");
    } else if (this.state === CrossbowState.LOADED) {
      this.cock();
    } else if (this.cooldown > 0) {
      this.level.game.pushMessage("Cooldown: " + this.cooldown);
    }
  };

  addBolt = (silent: boolean = false) => {
    if (this.state === CrossbowState.EMPTY) {
      this.state = CrossbowState.LOADED;
      if (!silent) this.level.game.pushMessage("You load the crossbow.");
      this.tileX = 24;
      return true;
    } else if (!silent)
      this.level.game.pushMessage("You already have a bolt loaded.");
    return false;
  };

  cock = () => {
    if (this.state === CrossbowState.LOADED) {
      this.state = CrossbowState.COCKED;
      this.tileX = 25;
      this.level.game.pushMessage("You cock the crossbow back and equip it.");
      this.disabled = false;
      if (!this.equipped && this.wielder?.inventory?.weapon) {
        this.previousWeapon = this.wielder.inventory.weapon;
      }

      this.equipped = true;
    }
  };

  fire = () => {
    if (
      this.state === CrossbowState.COCKED ||
      this.state === CrossbowState.FIRING
    ) {
      this.state = CrossbowState.EMPTY;
      this.tileX = 23;
      this.equipped = false;
      this.wielder.inventory.weapon = null;
      this.wielder.inventory.weapon = this.previousWeapon;
      this.previousWeapon.equipped = true;

      this.previousWeapon = null;
      this.disabled = true;
      const bolt = this.wielder.inventory.hasItem(CrossbowBolt);
      if (bolt !== null) {
        bolt.stackCount--;
        if (bolt.stackCount <= 0) {
          this.wielder.inventory.removeItem(bolt);
        }
        this.addBolt(true);
      }
    }
  };

  weaponMove = (newX: number, newY: number): boolean => {
    // Must be cocked to fire
    if (this.state !== CrossbowState.COCKED) return true;

    const room = (this.wielder as any)?.getRoom
      ? (this.wielder as any).getRoom()
      : this.game.rooms[this.wielder.levelID];
    if (!room) return true;

    const dx = Math.sign(newX - this.wielder.x);
    const dy = Math.sign(newY - this.wielder.y);

    // Only allow cardinal directions
    const cardinal = (dx === 0) !== (dy === 0);
    if (!cardinal) return true;

    let cx = this.wielder.x;
    let cy = this.wielder.y;

    const maxSteps = 15;
    let hitTarget: any = null;
    let hitX = cx;
    let hitY = cy;

    for (let step = 1; step <= maxSteps; step++) {
      cx += dx;
      cy += dy;

      if (!room.tileInside(cx, cy)) break;
      if (room.isSolidAt(cx, cy, this.wielder?.z ?? 0)) break;

      const z = this.wielder?.z ?? 0;
      const entitiesHere = room.entities.filter(
        (e: any) => e.pointIn(cx, cy) && (e?.z ?? 0) === z,
      );

      // Distance-sensitive targeting:
      // - At step 1, any destroyable (non-pushable) is a valid target
      // - Beyond step 1, only enemies are valid targets
      const target = entitiesHere.find((e: any) => {
        if (!e.destroyable || e.pushable) return false;
        if (step === 1) return true;
        return e.isEnemy === true;
      });
      if (target) {
        hitTarget = target;
        hitX = cx;
        hitY = cy;
        break;
      }

      // Blocking rules:
      // - Pushables or non-destroyables always block
      // - Non-enemy destroyables block when step > 1
      const blocked = entitiesHere.some((e: any) => {
        if (e.pushable || !e.destroyable) return true;
        if (step > 1 && e.destroyable && !e.isEnemy) return true;
        return false;
      });
      if (blocked) break;
    }

    // No enemy found in line-of-sight: allow movement (no attack)
    if (!hitTarget) return true;

    // Begin firing sequence at the enemy only
    this.state = CrossbowState.FIRING;
    this.attack(hitTarget, this.damage + this.wielder.damageBonus);

    this.hitSound();
    this.wielder.setHitXY(hitX, hitY);

    // Arrow visual: small square traveling from player to impact
    room.particles.push(
      new ArrowParticle(
        room,
        this.wielder.x + 0.5,
        this.wielder.y,
        hitX + 0.5,
        hitY,
      ),
    );

    room.tick(this.wielder);
    // Shake in shot direction with magnitude 1
    this.game.shakeScreen(dx * 5, dy * 5);

    // Consume the bolt and unequip appropriately
    this.fire();
    return false;
  };
}
