export type BestiaryEnemySprite = {
  label?: string;
  tileX: number;
  tileY: number;
  frames?: number;
  frameStride?: number;
  frameMs?: number;
  w?: number;
  h?: number;
  /**
   * Which spritesheet to use when drawing.
   * - "mob": `Game.drawMob` (default)
   * - "obj": `Game.drawObj` (used by some entities like Crusher)
   */
  sheet?: "mob" | "obj";
  /**
   * Offsets applied to the sprite's drawn position (tile-units) in the bestiary UI.
   */
  offsetX?: number;
  offsetY?: number;
  /**
   * When true, apply the same 2-frame 1px rumble used by enemies like the Crab.
   */
  rumbling?: boolean;
};

export type BestiaryEnemyInfo = {
  typeName: string; // constructor.name (e.g. "CrabEnemy")
  displayName: string; // human-readable (e.g. "Crab")
  description: string;
  sprites: BestiaryEnemySprite[];
};

// NOTE: These are intentionally hand-authored so every enemy has a meaningful description and correct sprite tiles.
// If you add a new enemy, add it here so the bestiary remains complete and high-quality.
export const BESTIARY_ENEMIES: Record<string, BestiaryEnemyInfo> = {
  CrabEnemy: {
    typeName: "CrabEnemy",
    displayName: "Crab",
    description:
      "A skittering crustacean that advances every other turn. Weak, but will still chip you down if you ignore it.",
    sprites: [
      { label: "Idle", tileX: 8, tileY: 4, w: 1, h: 1 },
      { label: "Armed", tileX: 9, tileY: 4, w: 1, h: 1, rumbling: true },
    ],
  },

  FrogEnemy: {
    typeName: "FrogEnemy",
    displayName: "Frog",
    description:
      "A quick jumper that can threaten both orthogonal and diagonal lines. Watch for sudden leaps.",
    sprites: [
      {
        label: "Idle",
        tileX: 1,
        tileY: 16,
        w: 1,
        h: 2,
        frames: 4,
        frameMs: 130,
      },
      { label: "Armed", tileX: 3, tileY: 16, w: 1, h: 2, rumbling: true },
    ],
  },

  ZombieEnemy: {
    typeName: "ZombieEnemy",
    displayName: "Zombie",
    description:
      "A shambling corpse with a forward-only attack pattern. Manage spacing and facing.",
    sprites: [{ tileX: 17, tileY: 8, w: 1, h: 2, frames: 4 }],
  },

  SkullEnemy: {
    typeName: "SkullEnemy",
    displayName: "Skeleton",
    description:
      "A brittle undead that hits forward. More dangerous than it looks if you let it close.",
    sprites: [
      { label: "2 HP", tileX: 5, tileY: 8, w: 1, h: 2, frames: 4 },
      { label: "1 HP", tileX: 3, tileY: 0, w: 1, h: 2 },
    ],
  },

  EnergyWizardEnemy: {
    typeName: "EnergyWizardEnemy",
    displayName: "Wizard Bomber",
    description:
      "A volatile caster that attacks from range. Expect sudden bursts of damage.",
    sprites: [{ label: "Idle", tileX: 6, tileY: 0, w: 1, h: 2 }],
  },

  FireWizardEnemy: {
    typeName: "FireWizardEnemy",
    displayName: "Fire Wizard",
    description:
      "A ranged caster that pressures you with fire. Don’t stand still in open lanes.",
    sprites: [{ label: "Idle", tileX: 35, tileY: 8, w: 1, h: 2 }],
  },

  EarthWizardEnemy: {
    typeName: "EarthWizardEnemy",
    displayName: "Earth Wizard",
    description:
      "A ranged caster that punishes predictable movement. Keep your approach flexible.",
    // Note: EarthWizard constructor sets tileX=35,tileY=8 (even though static differs).
    sprites: [{ label: "Idle", tileX: 35, tileY: 8, w: 1, h: 2 }],
  },

  ChargeEnemy: {
    typeName: "ChargeEnemy",
    displayName: "Charge Knight",
    description:
      "Builds up and then charges in a straight line. Avoid being caught in corridors.",
    sprites: [
      { label: "Idle", tileX: 13, tileY: 8, w: 1, h: 2, frames: 4 },
      { label: "Armed", tileX: 13, tileY: 8, w: 1, h: 2, rumbling: true },
    ],
  },

  RookEnemy: {
    typeName: "RookEnemy",
    displayName: "Rook",
    description:
      "A heavy chess-piece enemy that attacks orthogonally. Respect its straight-line threats.",
    sprites: [{ label: "Idle", tileX: 51, tileY: 8, w: 1, h: 2, frames: 4 }],
  },

  BishopEnemy: {
    typeName: "BishopEnemy",
    displayName: "Bishop",
    description:
      "A chess-piece enemy that attacks diagonally. It will punish diagonal approaches.",
    sprites: [
      { label: "2 HP", tileX: 31, tileY: 8, w: 1, h: 2, frames: 4 },
      { label: "1 HP", tileX: 31, tileY: 10, w: 1, h: 2, frames: 4 },
    ],
  },

  ArmoredzombieEnemy: {
    typeName: "ArmoredzombieEnemy",
    displayName: "Armored Zombie",
    description:
      "A tougher zombie that can soak hits. Don’t waste turns trading blows in bad positions.",
    sprites: [
      { label: "2 HP", tileX: 27, tileY: 8, w: 1, h: 2, frames: 4 },
      { label: "1 HP", tileX: 17, tileY: 8, w: 1, h: 2, frames: 4 },
    ],
  },

  BigSkullEnemy: {
    typeName: "BigSkullEnemy",
    displayName: "Giant Skeleton",
    description:
      "A massive undead that occupies multiple tiles. Its body blocks space and its hits hurt.",
    // BigSkull uses 2x2 sprite at (33,12)
    sprites: [
      { label: "4 HP", tileX: 33, tileY: 12, w: 2, h: 3 },
      { label: "1 HP", tileX: 35, tileY: 12, w: 2, h: 3 },
    ],
  },

  QueenEnemy: {
    typeName: "QueenEnemy",
    displayName: "Queen",
    description:
      "A regal chess-piece enemy that can threaten many angles. Be careful approaching it.",
    // Queen constructor sets tileX=23,tileY=10
    sprites: [
      { label: "2 HP", tileX: 23, tileY: 8, w: 1, h: 2, frames: 4 },
      { label: "1 HP", tileX: 23, tileY: 10, w: 1, h: 2, frames: 4 },
    ],
  },

  KnightEnemy: {
    typeName: "KnightEnemy",
    displayName: "Burrow Knight",
    description:
      "An aggressive melee enemy that can set up nasty engages. Don’t get flanked.",
    sprites: [
      { label: "Idle", tileX: 9, tileY: 8, w: 1, h: 2 },
      {
        label: "Armed",
        tileX: 9,
        tileY: 8,
        w: 1,
        h: 2,
        frames: 4,
        rumbling: true,
      },
    ],
  },

  BigKnightEnemy: {
    typeName: "BigKnightEnemy",
    displayName: "Giant Knight",
    description:
      "A towering knight that dominates space. Plan your pathing before it pins you.",
    sprites: [
      { label: "Idle", tileX: 29, tileY: 5, w: 2, h: 3 },
      { label: "Armed", tileX: 29, tileY: 1, w: 2, h: 3, rumbling: true },
    ],
  },

  ArmoredSkullEnemy: {
    typeName: "ArmoredSkullEnemy",
    displayName: "Armored Skeleton",
    description:
      "A reinforced skeleton that can take more punishment. Treat it as a real frontline threat.",
    // ArmoredSkull uses (17,16) in constructor
    sprites: [
      { label: "3 HP", tileX: 27, tileY: 16, w: 1, h: 2, frames: 4 },
      { label: "2 HP", tileX: 5, tileY: 8, w: 1, h: 2, frames: 4 },
      { label: "1 HP", tileX: 3, tileY: 0, w: 1, h: 2 },
    ],
  },

  MummyEnemy: {
    typeName: "MummyEnemy",
    displayName: "Mummy",
    description:
      "A cursed undead with unusual resistances. Don’t rely on status effects alone.",
    sprites: [{ label: "", tileX: 17, tileY: 16, w: 1, h: 2, frames: 4 }],
  },

  SpiderEnemy: {
    typeName: "SpiderEnemy",
    displayName: "Spider",
    description:
      "A skittish ambusher that can hide and reposition. Track its reveals and don’t overextend.",
    sprites: [
      { label: "Idle", tileX: 11, tileY: 4, w: 2, h: 2 },
      { label: "Armed", tileX: 11, tileY: 4, w: 2, h: 2, rumbling: true },
    ],
  },

  PawnEnemy: {
    typeName: "PawnEnemy",
    displayName: "Pawn",
    description:
      "A chess-piece enemy that threatens diagonals. Don’t step into its diagonal lanes.",
    sprites: [{ label: "Idle", tileX: 23, tileY: 12, w: 1, h: 2, frames: 4 }],
  },

  BigFrogEnemy: {
    typeName: "BigFrogEnemy",
    displayName: "Big Frog",
    description:
      "A huge leaper that can crush space. Expect wide coverage and heavy hits.",
    sprites: [
      {
        label: "Idle",
        tileX: 37,
        tileY: 24,
        w: 2,
        h: 3,
        frames: 4,
        frameMs: 130,
      },
      { label: "Armed", tileX: 41, tileY: 24, w: 2, h: 3, rumbling: true },
    ],
  },

  BeetleEnemy: {
    typeName: "BeetleEnemy",
    displayName: "Beetle",
    description:
      "A tough little bug that commits to lanes. Watch its approach and don’t get cornered.",
    sprites: [
      { label: "Idle", tileX: 13, tileY: 4, w: 2, h: 2 },
      { label: "Armed", tileX: 13, tileY: 4, w: 2, h: 2, rumbling: true },
    ],
  },

  KingEnemy: {
    typeName: "KingEnemy",
    displayName: "King",
    description:
      "A powerful chess-piece enemy. It’s dangerous up close and hard to bully.",
    sprites: [
      { label: "2 HP", tileX: 51, tileY: 12, w: 1, h: 3, frames: 4 },
      { label: "1 HP", tileX: 51, tileY: 15, w: 1, h: 3, frames: 4 },
    ],
  },

  BoltcasterEnemy: {
    typeName: "BoltcasterEnemy",
    displayName: "Boltcaster",
    description:
      "A ranged attacker that looks for clear lines. Break line-of-sight and avoid straight corridors.",
    sprites: [{ label: "Idle", tileX: 43, tileY: 8, w: 1, h: 2 }],
  },

  BigZombieEnemy: {
    typeName: "BigZombieEnemy",
    displayName: "Big Zombie",
    description:
      "A huge undead that takes up space and hits hard. Treat its footprint like terrain.",
    sprites: [{ label: "Idle", tileX: 31, tileY: 12, w: 2, h: 3 }],
  },

  OccultistEnemy: {
    typeName: "OccultistEnemy",
    displayName: "Occultist",
    description:
      "A support caster that shields nearby enemies. If left alive, fights get much longer.",
    sprites: [{ label: "Idle", tileX: 55, tileY: 8, w: 1, h: 2, frames: 4 }],
  },

  ExalterEnemy: {
    typeName: "ExalterEnemy",
    displayName: "Exalter",
    description:
      "A support caster that buffs nearby enemies. The longer it lives, the more lethal the room becomes.",
    sprites: [{ label: "Idle", tileX: 59, tileY: 8, w: 1, h: 2, frames: 4 }],
  },

  WardenEnemy: {
    typeName: "WardenEnemy",
    displayName: "Warden",
    description:
      "A dangerous boss that commands crushers with chained beams. Respect its tempo and clear space.",
    sprites: [
      {
        label: "Idle",
        tileX: 43,
        tileY: 10,
        w: 2,
        h: 2,
        frames: 4,
        // Frame stepping is `frameStride * w` in drawIdleSprite.
        frameStride: 1,
      },
    ],
  },

  CrusherEnemy: {
    typeName: "CrusherEnemy",
    displayName: "Crusher",
    description:
      "A chained crusher block commanded by the Warden. It slams and threatens its tile aggressively.",
    sprites: [
      {
        label: "Idle",
        tileX: 3,
        tileY: 4,
        w: 2,
        h: 2,
        sheet: "obj",
        // Lower down
        offsetY: 0.18,
      },
      {
        label: "Armed",
        tileX: 3,
        tileY: 4,
        w: 2,
        h: 2,
        sheet: "obj",
        // Higher up + rumble
        offsetY: -1,
        rumbling: true,
      },
    ],
  },

  Spawner: {
    typeName: "Spawner",
    displayName: "Reaper",
    description:
      "A reaper idol that spawns enemies over time. If you don't destroy it, the room will snowball.",
    sprites: [{ label: "Idle", tileX: 6, tileY: 4, w: 1, h: 2 }],
  },

  GlowBugEnemy: {
    typeName: "GlowBugEnemy",
    displayName: "Glowbugs",
    description:
      "A drifting light swarm. Mostly harmless, but it can clutter rooms and affect visibility.",
    sprites: [{ label: "Idle", tileX: 8, tileY: 0, w: 1, h: 1, frames: 4 }],
  },
};
