import { Weapon } from "./weapon";
import { Room } from "../../room/room";

export class Dagger extends Weapon {
  static itemName = "dagger";
  static examineText = "A simple dagger. Close and quick.";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 22;
    this.tileY = 0;
    this.name = "dagger";
    this.description = "A basic but dependable weapon.";
  }

  /** executeAttack advances the room once when a hit resolves. */
  getSuccessfulAttackTurnCost = (): number => 1;

  weaponMove = (newX: number, newY: number): boolean => {
    if (this.checkForPushables(newX, newY)) return true;

    const hitSomething = this.executeAttack(
      newX,
      newY,
      true,
      this.damage + this.wielder.damageBonus,
    );

    return !hitSomething;
  };

  private readonly standardDaggerMove = this.weaponMove;

  /** A lower bound for this immediate single-tile attack, not a simulated outcome. */
  getAgentAttackTraits = () => {
    if (!this.wielder || this.weaponMove !== this.standardDaggerMove ||
      !this.usesStandardAttackPipeline() || this.manaCost > 0) return null;
    const minimumDamage = this.damage + this.wielder.damageBonus;
    return Number.isFinite(minimumDamage) && minimumDamage > 0
      ? {pattern: "adjacent-cardinal", minimumDamage} : null;
  };

  degrade = () => {};
}
