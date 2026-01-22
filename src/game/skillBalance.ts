import type { Skill } from "./skills";

export const ENEMY_XP = {
  enemyHpMultiplier: 5,
  // Combat skill XP scales with depth so deeper floors are meaningfully better for training,
  // but keep the curve tame enough that weapon multipliers remain the primary "tier" lever.
  depthMultiplierBase: 1.3,
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
    rock: 5,
    coal: 25,
    iron: 100,
    gold: 250,
    obsidian: 75,
    emerald: 750,
    garnet: 1250,
    zircon: 750,
    amber: 750,
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
  quarterstaff: {
    requiredSkill: "melee",
    requiredLevel: 5,
    killXpMultiplier: 2,
    combatSkill: "melee",
  },
  sword: {
    requiredSkill: "melee",
    requiredLevel: 10,
    // "Training tier" weapon: big multiplier to make pushing toward higher melee gates feasible.
    killXpMultiplier: 4,
    combatSkill: "melee",
  },
  spear: {
    requiredSkill: "melee",
    requiredLevel: 15,
    killXpMultiplier: 3,
    combatSkill: "melee",
  },
  "dual daggers": {
    requiredSkill: "melee",
    requiredLevel: 18,
    killXpMultiplier: 3,
    combatSkill: "melee",
  },
  warhammer: {
    requiredSkill: "melee",
    requiredLevel: 22,
    killXpMultiplier: 4,
    combatSkill: "melee",
  },
  greataxe: {
    requiredSkill: "melee",
    requiredLevel: 25,
    killXpMultiplier: 4,
    combatSkill: "melee",
  },
  scythe: {
    requiredSkill: "melee",
    // High-tier melee gate.
    requiredLevel: 30,
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
