import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { ArrowParticle } from "../../particle/arrowParticle";
import { GameplaySettings } from "../../game/gameplaySettings";
import { CrossbowBolt } from "./crossbowBolt";
import { SKILL_DISPLAY_NAME } from "../../game/skills";
import { statsTracker } from "../../game/stats";
import type { Player } from "../../player/player";
import type { RangedWeapon } from "./rangedTargetingSystem";

enum CrossbowState {
  EMPTY,
  LOADED,
  COCKED,
  FIRING,
}

export class Crossbow extends Weapon implements RangedWeapon {
  static itemName = "crossbow";
  static examineText = "A crossbow. Point, load, and regret.";
  lineIntercept = true;
  state: CrossbowState;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 23;
    this.tileY = 4;
    this.name = Crossbow.itemName;
    this.state = CrossbowState.EMPTY;
    this.disabled = true;
    this.damage = 2;
    this.description =
      "Uses bolts. Load and cock it, then fire in a straight line to hit the first enemy in sight.";
  }

  toggleEquip = () => {
    if (this.wielder && this.requiredSkill) {
      const lvl = statsTracker.getSkillLevel(this.requiredSkill);
      if (lvl < this.requiredLevel) {
        this.level.game.pushMessage(
          `Requires ${SKILL_DISPLAY_NAME[this.requiredSkill]} level ${this.requiredLevel}.`,
        );
        return;
      }
    }

    if (GameplaySettings.CROSSBOW_TARGETING_ENABLED) {
      if (this.state === CrossbowState.EMPTY) {
        this.level.game.pushMessage("Use a bolt on the crossbow to load it.");
      } else if (this.state === CrossbowState.LOADED) {
        this.cock();
        (this.wielder as unknown as Player)?.rangedTargeting?.start(this);
      } else if (this.state === CrossbowState.COCKED) {
        (this.wielder as unknown as Player)?.rangedTargeting?.start(this);
      } else if (this.cooldown > 0) {
        this.level.game.pushMessage("Cooldown: " + this.cooldown);
      }
      return;
    }

    // Legacy equip behavior
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
      this.disabled = false;

      if (GameplaySettings.CROSSBOW_TARGETING_ENABLED) {
        this.level.game.pushMessage("You cock the crossbow.");
      } else {
        this.level.game.pushMessage("You cock the crossbow back and equip it.");
        if (!this.equipped && this.wielder?.inventory?.weapon) {
          this.previousWeapon = this.wielder.inventory.weapon;
        }
        this.equipped = true;
      }
    }
  };

  fire = () => {
    if (
      this.state === CrossbowState.COCKED ||
      this.state === CrossbowState.FIRING
    ) {
      this.state = CrossbowState.EMPTY;
      this.tileX = 23;
      this.disabled = true;

      if (!GameplaySettings.CROSSBOW_TARGETING_ENABLED) {
        this.equipped = false;
        this.wielder.inventory.weapon = null;
        this.wielder.inventory.weapon = this.previousWeapon;
        this.previousWeapon.equipped = true;
        this.previousWeapon = null;
      }

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

  /** Fire to the exact target tile selected by the ranged targeting system. Returns true if bolt was launched. */
  fireAtTarget = (player: Player, tx: number, ty: number): boolean => {
    if (this.state !== CrossbowState.COCKED) return false;

    const room = player.getRoom();
    if (!room) return false;

    const fromX = player.x;
    const fromY = player.y;
    const dx = tx - fromX;
    const dy = ty - fromY;
    if (dx === 0 && dy === 0) return false;

    const z = (player as any).z ?? 0;

    // The targeting system already validated LOS; just check what is at the target tile.
    const entitiesAtTarget = room.entities.filter(
      (e: any) => e.pointIn(tx, ty) && (e?.z ?? 0) === z,
    );
    const hitTarget =
      entitiesAtTarget.find((e: any) => e.destroyable && !e.pushable) ?? null;

    this.state = CrossbowState.FIRING;

    if (hitTarget) {
      const savedWielder = this.wielder;
      if (!this.wielder) this.wielder = player;
      this.attack(hitTarget, this.damage + player.damageBonus);
      this.wielder = savedWielder;
      this.hitSound();
    }

    player.setHitXY(tx, ty);

    room.particles.push(
      new ArrowParticle(room, fromX + 0.5, fromY, tx + 0.5, ty),
    );

    room.tick(player);
    this.game.shakeScreen(Math.sign(dx) * 5, Math.sign(dy) * 5);
    this.fire();

    return true;
  };

  // Legacy weaponMove kept for non-targeting mode
  weaponMove = (newX: number, newY: number): boolean => {
    if (GameplaySettings.CROSSBOW_TARGETING_ENABLED) return true;
    if (this.state !== CrossbowState.COCKED) return true;

    const room = (this.wielder as any)?.getRoom
      ? (this.wielder as any).getRoom()
      : this.game.rooms[this.wielder.levelID];
    if (!room) return true;

    const dx = Math.sign(newX - this.wielder.x);
    const dy = Math.sign(newY - this.wielder.y);

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

      const blocked = entitiesHere.some((e: any) => {
        if (e.pushable || !e.destroyable) return true;
        if (step > 1 && e.destroyable && !e.isEnemy) return true;
        return false;
      });
      if (blocked) break;
    }

    if (!hitTarget) return true;

    this.state = CrossbowState.FIRING;
    this.attack(hitTarget, this.damage + this.wielder.damageBonus);
    this.hitSound();
    this.wielder.setHitXY(hitX, hitY);

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
    this.game.shakeScreen(dx * 5, dy * 5);
    this.fire();
    return false;
  };
}
