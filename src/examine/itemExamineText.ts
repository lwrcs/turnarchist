/**
 * Central registry of RuneScape-style examine texts for Items.
 *
 * Keyed by `constructor.name` (class name), so we don't need per-item overrides.
 * Keep these concise, in-theme, and mechanically hint-y.
 */
export const ITEM_EXAMINE_TEXT: Readonly<Record<string, string>> = {
  BestiaryBook: "A worn bestiary. It remembers what you've survived.",
  BombItem: "A bomb. Keep your fingers.",
  Coin: "A coin. Shiny and spendable.",
  Key: "A key. It probably fits one lock.",

  // Weapons
  Dagger: "A simple dagger. Close and quick.",
  Sword: "A balanced sword. Reliable steel.",
  Spear: "A long spear. Keeps trouble at arm's length.",
  Warhammer: "A brutal warhammer. Subtlety not included.",
  Greataxe: "A great axe. It wants to bite.",
  DualDagger: "Two daggers. Twice the confidence.",
  QuarterStaff: "A sturdy staff. Better than bare hands.",
  Scythe: "A reaper's tool. Sweeps wide.",
  Spellbook: "A spellbook. Arcane pages and dangerous ideas.",

  // Crossbow parts / ammo
  Crossbow: "A crossbow. Point, load, and regret.",
  CrossbowBolt: "A crossbow bolt. Pointy on purpose.",
  CrossbowStock: "A crossbow stock. A weapon in pieces.",
  CrossbowLimb: "A crossbow limb. Springy and sharp.",

  // Other weapons
  Slingshot: "A slingshot. Childish, until it isn't.",
  Shotgun: "A shotgun. Loud, short-range certainty.",

  // Equipment
  ChestPlate: "A chest plate. Solid where it counts.",
  ShoulderPlates: "Shoulder plates. No more cheap shots.",
  Backplate: "A backplate. Watch your back—literally.",
  Gauntlets: "Gauntlets. Better knuckles, fewer regrets.",

  // Fragments / coatings
  ShieldLeftFragment: "A broken shield half. Find its partner.",
  ShieldRightFragment: "A broken shield half. Find its partner.",
  ScytheBlade: "A scythe blade. Very convincing.",
  ScytheHandle: "A scythe handle. Needs a blade.",
  WeaponFragments: "Weapon scraps. Good for cobbling.",
  WeaponPoison: "A vial of poison. Paint it on steel.",
  WeaponBlood: "A vial of cursed blood. It stains the light.",
};
