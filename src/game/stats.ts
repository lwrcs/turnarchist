import { EnvType, getEnvTypeName } from "../constants/environmentTypes";
import { globalEventBus } from "../event/eventBus";
import { AppEvents, EventPayloads, EVENTS } from "../event/events";
import { createEmptySkillsXp, levelForXp, type Skill, SKILLS } from "./skills";

export interface Stats {
  enemiesKilled: number;
  damageDone: number;
  damageTaken: number;
  turnsPassed: number;
  coinsCollected: number;
  itemsCollected: number;
  enemies: string[];
  weaponChoice: string | null;
  sidePathsEntered: Array<{ depth: number; sidePath: string }>;
  /**
   * Total XP across all skills (derived and persisted for compatibility/analytics).
   */
  xp: number;
  /**
   * Overall level derived from total XP (not tied to any single skill).
   */
  level: number;
  /**
   * Per-skill XP.
   */
  skillsXp: Record<Skill, number>;
  /**
   * Version stamp for future migrations.
   */
  skillsVersion: 1;
}

export class StatsTracker {
  private stats: Stats = StatsTracker.initialStats();

  constructor() {
    this.initializeListeners();
  }

  private static initialStats(): Stats {
    return {
      enemiesKilled: 0,
      damageDone: 0,
      damageTaken: 0,
      turnsPassed: 0,
      coinsCollected: 0,
      itemsCollected: 0,
      enemies: [],
      weaponChoice: null,
      sidePathsEntered: [],
      xp: 0,
      level: 1,
      skillsXp: createEmptySkillsXp(),
      skillsVersion: 1,
    };
  }

  private initializeListeners(): void {
    globalEventBus.on(EVENTS.ENEMY_KILLED, this.handleEnemyKilled);
    globalEventBus.on(EVENTS.DAMAGE_DONE, this.handleDamageDone);
    globalEventBus.on(EVENTS.DAMAGE_TAKEN, this.handleDamageTaken);
    globalEventBus.on(EVENTS.TURN_PASSED, this.handleTurnPassed);
    globalEventBus.on(EVENTS.COIN_COLLECTED, this.handleCoinCollected);
    globalEventBus.on(EVENTS.ITEM_COLLECTED, this.handleItemCollected);
  }

  private handleEnemyKilled = (
    payload: EventPayloads[typeof EVENTS.ENEMY_KILLED],
  ): void => {
    this.stats.enemiesKilled += 1;
    this.stats.enemies.push(payload.enemyId);
    this.awardSkillXp(payload.skill, payload.xp);
    //console.log(`Enemy killed: ${payload.enemyId}`);
  };

  private handleDamageDone = (
    payload: EventPayloads[typeof EVENTS.DAMAGE_DONE],
  ): void => {
    this.stats.damageDone += payload.amount;
    //console.log(`Damage done: ${payload.amount}`);
  };

  private handleDamageTaken = (
    payload: EventPayloads[typeof EVENTS.DAMAGE_TAKEN],
  ): void => {
    this.stats.damageTaken += payload.amount;
    //console.log(`Damage taken: ${payload.amount}`);
  };

  private handleTurnPassed = (): void => {
    this.stats.turnsPassed += 1;
    //console.log(`Turn passed: ${this.stats.turnsPassed}`);
  };

  private handleCoinCollected = (
    payload: EventPayloads[typeof EVENTS.COIN_COLLECTED],
  ): void => {
    this.stats.coinsCollected += payload.amount;
    //console.log(`Coins collected: ${payload.amount}`);
  };

  private handleItemCollected = (
    payload: EventPayloads[typeof EVENTS.ITEM_COLLECTED],
  ): void => {
    this.stats.itemsCollected += 1;
    //console.log(`Item collected: ${payload.itemId}`);
  };

  public getStats(): Stats {
    return this.stats;
  }

  public getXp(): number {
    return this.stats.xp;
  }

  /**
   * Award XP to a specific skill (central entry point).
   */
  awardSkillXp(skill: Skill, xp: number) {
    const amount = Math.max(0, Math.floor(xp));
    if (amount <= 0) return;

    // Ensure skillsXp exists (migration safety)
    if (!this.stats.skillsXp) {
      this.stats.skillsXp = createEmptySkillsXp();
      this.stats.skillsVersion = 1;
    }

    this.stats.skillsXp[skill] = (this.stats.skillsXp[skill] ?? 0) + amount;
    this.recomputeTotals();
  }

  /**
   * Back-compat wrapper: award to melee.
   */
  increaseXp(xp: number) {
    this.awardSkillXp("melee", xp);
  }

  public getSkillXp(skill: Skill): number {
    return this.stats.skillsXp?.[skill] ?? 0;
  }

  public getSkillLevel(skill: Skill): number {
    return levelForXp(this.getSkillXp(skill));
  }

  public getAllSkillsXp(): Record<Skill, number> {
    // Return a stable shape for callers.
    const out = createEmptySkillsXp();
    for (const s of SKILLS) out[s] = this.getSkillXp(s);
    return out;
  }

  public recordWeaponChoice(weaponChoice: string) {
    this.stats.weaponChoice = weaponChoice;
  }

  public recordSidePathEntered({
    depth,
    sidePath,
  }: {
    depth: number;
    sidePath: EnvType;
  }) {
    this.stats.sidePathsEntered.push({
      depth,
      sidePath: getEnvTypeName(sidePath),
    });
  }

  public resetStats(): void {
    this.stats = StatsTracker.initialStats();
    //console.log("Stats have been reset.");
  }

  public setStats(stats: Stats) {
    // Migration: older saves may not have skillsXp/skillsVersion.
    const incoming = stats as unknown as Partial<Stats>;
    const migrated: Stats = {
      ...StatsTracker.initialStats(),
      ...incoming,
      skillsXp: incoming.skillsXp ?? createEmptySkillsXp(),
      skillsVersion: 1,
    };

    // If old save had total XP but no skill breakdown, preserve progress as melee XP.
    if (
      (!incoming.skillsXp ||
        Object.keys(incoming.skillsXp as Record<string, unknown>).length ===
          0) &&
      typeof incoming.xp === "number" &&
      incoming.xp > 0
    ) {
      migrated.skillsXp.melee = Math.max(0, Math.floor(incoming.xp));
    }

    this.stats = migrated;
    this.recomputeTotals();
  }

  private recomputeTotals() {
    // Keep total XP + overall level in sync.
    const skillsXp = this.stats.skillsXp ?? createEmptySkillsXp();
    let total = 0;
    for (const s of SKILLS) total += skillsXp[s] ?? 0;
    this.stats.xp = total;
    this.stats.level = levelForXp(total);
  }
}

export const statsTracker = new StatsTracker();
