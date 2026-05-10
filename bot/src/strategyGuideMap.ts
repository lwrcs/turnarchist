export interface SectionEntry {
  name: string;
  keywords: string[];
}

export const STRATEGY_GUIDE_MAP: SectionEntry[] = [
  {
    name: "CORE MECHANICS",
    keywords: [
      "turn", "turns", "action", "movement", "how does", "rules",
      "damage", "attack", "hit", "mechanic", "basics", "how to play",
    ],
  },
  {
    name: "EARLY GAME",
    keywords: [
      "start", "beginning", "first", "floor 1", "early", "mistake",
      "priority", "pick up", "new player", "beginner", "tips for beginners",
    ],
  },
  {
    name: "ENEMIES: HOW TO FIGHT THEM",
    keywords: [
      "zombie", "skeleton", "armored", "big zombie", "big skeleton",
      "beetle", "rat", "crab", "frog", "big frog", "spider", "mummy",
      "crusher", "glowbug", "bishop", "burrow knight", "warden",
      "earth wizard", "fire wizard", "energy wizard", "wizard bomber",
      "charge knight", "big knight", "big wizard", "king", "queen",
      "rook", "pawn", "boltcaster", "exalter", "occultist",
      "reaper", "spawner",
      "enemy", "enemies", "fight", "kill", "defeat", "how to beat",
      "avoid", "dodge", "attack pattern", "hp", "health",
      "stun", "regenerate", "regen", "unconscious",
    ],
  },
  {
    name: "WEAPONS",
    keywords: [
      "weapon", "dagger", "sword", "spear", "dual daggers",
      "greataxe", "warhammer", "scythe", "quarter staff", "quarterstaff",
      "crossbow", "slingshot", "shotgun", "spellbook",
      "melee", "ranged", "equip",
    ],
  },
  {
    name: "SPELLS",
    keywords: [
      "spell", "spellbook", "mana", "plus", "cross", "point", "wave",
      "magic", "cast", "pattern",
    ],
  },
  {
    name: "ITEMS & WHEN TO USE THEM",
    keywords: [
      "item", "apple", "berries", "mushroom", "potion", "health potion",
      "mana potion", "hourglass", "backpack", "modifier", "blood",
      "poison", "curse", "consumable", "use", "when to use", "heal",
      "restore", "inventory",
    ],
  },
  {
    name: "ARMOR & SHIELDS",
    keywords: [
      "armor", "shield", "occult shield", "wooden shield",
      "body armor", "diving helmet",
      "defense", "block", "protect",
    ],
  },
  {
    name: "RINGS",
    keywords: [
      "ring", "gem", "enchantment", "passive", "equip", "bonus",
    ],
  },
  {
    name: "TOOLS",
    keywords: [
      "tool", "pickaxe", "fishing rod", "hammer", "mine", "fish",
      "break", "wall", "rock",
    ],
  },
  {
    name: "BIOMES & HAZARDS",
    keywords: [
      "biome", "hazard", "spike", "spike trap", "magma", "chasm",
      "flooded", "cave", "dungeon", "forest", "castle", "glacier",
      "desert", "sewer", "trap", "pool", "water", "lava",
      "environment", "floor", "area", "zone", "underwater",
    ],
  },
  {
    name: "SKILLS",
    keywords: [
      "skill", "melee skill", "magic skill", "ranged skill", "fishing",
      "mining", "smithing", "crafting", "woodcutting", "xp", "level",
      "level up", "unlock",
    ],
  },
  {
    name: "GENERAL TIPS",
    keywords: [
      "tip", "advice", "strategy", "general", "trick", "recommend",
      "best", "should i", "what do i do", "mistake", "warning",
    ],
  },
];

export const buildGuideMapString = (): string => {
  return STRATEGY_GUIDE_MAP.map(
    (entry) => `[${entry.name}]: ${entry.keywords.join(", ")}`
  ).join("\n");
};
