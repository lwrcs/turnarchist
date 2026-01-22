export const SKILLS = [
  "melee",
  "magic",
  "ranged",
  "fishing",
  "mining",
  "smithing",
  "crafting",
  "woodcutting",
] as const;

export type Skill = (typeof SKILLS)[number];

export const SKILL_DISPLAY_NAME: Record<Skill, string> = {
  melee: "Melee",
  magic: "Magic",
  ranged: "Ranged",
  fishing: "Fishing",
  mining: "Mining",
  smithing: "Smithing",
  crafting: "Crafting",
  woodcutting: "Woodcutting",
};

export function isSkill(value: unknown): value is Skill {
  return (
    typeof value === "string" && (SKILLS as readonly string[]).includes(value)
  );
}

export function createEmptySkillsXp(): Record<Skill, number> {
  return {
    melee: 0,
    magic: 0,
    ranged: 0,
    fishing: 0,
    mining: 0,
    smithing: 0,
    crafting: 0,
    woodcutting: 0,
  };
}

export const MAX_SKILL_LEVEL = 99;

/**
 * RuneScape-inspired XP curve, tuned to be more aggressive at higher levels.
 *
 * - Level 1 requires 0 XP.
 * - XP thresholds are monotonically increasing.
 */
let xpTable: number[] | null = null;

const XP_CURVE = {
  /**
   * Higher => easier. Vanilla RS-like is ~7.
   * Lower => steeper curve at higher levels.
   */
  exponentDivisor: 6.3,
  /** Base growth term; vanilla RS-like is 300. */
  base: 360,
  /**
   * Higher => easier. Vanilla RS-like is 4.
   * Lower => more XP required for the same level.
   */
  divisor: 3,
  /** Small linear term to keep early levels smooth. */
  linearMultiplier: 1.1,
} as const;

function ensureXpTable(): number[] {
  if (xpTable) return xpTable;

  // xpTable[level] => total XP required to reach `level`
  const t = new Array<number>(MAX_SKILL_LEVEL + 2).fill(0);
  t[1] = 0;

  let points = 0;
  for (let level = 2; level <= MAX_SKILL_LEVEL + 1; level++) {
    const i = level - 1;
    points += Math.floor(
      XP_CURVE.linearMultiplier * i +
        XP_CURVE.base * Math.pow(2, i / XP_CURVE.exponentDivisor),
    );
    t[level] = Math.floor(points / XP_CURVE.divisor);
  }

  xpTable = t;
  return t;
}

export function xpForLevel(level: number): number {
  const t = ensureXpTable();
  const clamped = Math.max(1, Math.min(MAX_SKILL_LEVEL + 1, Math.floor(level)));
  return t[clamped] ?? 0;
}

export function levelForXp(xp: number): number {
  const t = ensureXpTable();
  const x = Math.max(0, Math.floor(xp));

  // Binary search over [1..MAX_SKILL_LEVEL+1]
  let lo = 1;
  let hi = MAX_SKILL_LEVEL + 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (t[mid] <= x) lo = mid;
    else hi = mid - 1;
  }

  // Map "reached threshold for L+1" to displayed level L
  const displayed = Math.min(MAX_SKILL_LEVEL, Math.max(1, lo));
  return displayed;
}

export function xpUntilNextLevel(xp: number): {
  level: number;
  nextLevel: number;
  xpIntoLevel: number;
  xpThisLevel: number;
  xpNextLevel: number;
  xpRemaining: number;
} {
  const level = levelForXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevel = Math.min(MAX_SKILL_LEVEL, level + 1);
  const nextLevelXp = xpForLevel(nextLevel);

  const x = Math.max(0, Math.floor(xp));
  const xpIntoLevel = Math.max(0, x - currentLevelXp);
  const xpThisLevel = Math.max(0, nextLevelXp - currentLevelXp);
  const xpRemaining = Math.max(0, nextLevelXp - x);

  return {
    level,
    nextLevel,
    xpIntoLevel,
    xpThisLevel,
    xpNextLevel: nextLevelXp,
    xpRemaining,
  };
}
