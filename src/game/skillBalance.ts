import type { Skill } from "./skills";

export const ENEMY_XP = {
  enemyHpMultiplier: 5,
  depthMultiplierBase: 1.5,
} as const;

export function computeEnemyKillBaseXp(args: {
  maxHealth: number;
  depth: number;
}): number {
  const depthMultiplier = Math.pow(ENEMY_XP.depthMultiplierBase, args.depth);
  return Math.ceil(
    args.maxHealth * ENEMY_XP.enemyHpMultiplier * depthMultiplier,
  );
}

export const GATHERING_XP = {
  fishing: {
    baseMin: 100,
    baseMax: 150,
    chanceToCatch: 0.3,
  },
  miningByNodeName: {
    rock: 60,
    coal: 70,
    iron: 85,
    gold: 110,
    obsidian: 95,
    emerald: 140,
    garnet: 140,
    zircon: 140,
    amber: 140,
  } as Record<string, number>,
  woodcutting: {
    base: 80,
  },
  depthMultiplierBase: 1.5,
} as const;

export function depthXpMultiplier(depth: number): number {
  return Math.pow(GATHERING_XP.depthMultiplierBase, depth);
}

export function computeMiningXp(args: {
  nodeName: string;
  depth: number;
}): number {
  const base = GATHERING_XP.miningByNodeName[args.nodeName.toLowerCase()] ?? 60;
  return Math.ceil(base * depthXpMultiplier(args.depth));
}

export function computeWoodcuttingXp(args: { depth: number }): number {
  return Math.ceil(
    GATHERING_XP.woodcutting.base * depthXpMultiplier(args.depth),
  );
}

export const CRAFTING_XP = {
  smithingPerBar: 90,
  goldRing: 120,
  ringGemEmbed: 80,
  scytheAssemble: 220,
} as const;

export type WeaponSkillRule = {
  requiredSkill: Skill;
  requiredLevel: number;
  /**
   * Multiplies skill XP awarded for kills made with this weapon.
   * Intended to strongly encourage progressing through tiers.
   */
  killXpMultiplier: number;
  combatSkill: Skill;
};

/**
 * Keyed by weapon static `itemName` (lowercase).
 * Keep all tuning here so it’s easy to iterate without hunting through weapon classes.
 */
export const WEAPON_SKILL_RULES: Record<string, WeaponSkillRule> = {
  dagger: {
    requiredSkill: "melee",
    requiredLevel: 1,
    killXpMultiplier: 1,
    combatSkill: "melee",
  },
  sword: {
    requiredSkill: "melee",
    requiredLevel: 5,
    killXpMultiplier: 3,
    combatSkill: "melee",
  },
  scythe: {
    requiredSkill: "melee",
    requiredLevel: 10,
    killXpMultiplier: 6,
    combatSkill: "melee",
  },
  spellbook: {
    requiredSkill: "magic",
    requiredLevel: 1,
    killXpMultiplier: 2,
    combatSkill: "magic",
  },
  slingshot: {
    requiredSkill: "ranged",
    requiredLevel: 1,
    killXpMultiplier: 2,
    combatSkill: "ranged",
  },
  shotgun: {
    requiredSkill: "ranged",
    requiredLevel: 1,
    killXpMultiplier: 2,
    combatSkill: "ranged",
  },
  crossbow: {
    requiredSkill: "ranged",
    requiredLevel: 1,
    killXpMultiplier: 2,
    combatSkill: "ranged",
  },
};
