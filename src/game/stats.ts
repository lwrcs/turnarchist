import { EnvType, getEnvTypeName } from "../constants/environmentTypes";
import { globalEventBus } from "../event/eventBus";
import { AppEvents, EventPayloads, EVENTS } from "../event/events";

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
  xp: number;
  level: number;
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
    this.stats.xp += payload.xp;
    this.stats.level = Math.floor(this.stats.xp / 100) + 1;
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
    this.stats = stats;
  }
}

export const statsTracker = new StatsTracker();
