/**
 * Central registry of RuneScape-style examine texts for Entities.
 *
 * Keyed by `constructor.name` (class name), so we don't need per-entity overrides.
 * Keep these concise, in-theme, and mechanically hint-y.
 */
export const ENTITY_EXAMINE_TEXT: Readonly<Record<string, string>> = {
  // Enemies
  CrabEnemy: "It scuttles sideways and snaps up close.",
  ZombieEnemy: "Slow, relentless, and always in your lane.",
  ArmoredzombieEnemy: "A zombie in armor. Takes a bit more work.",
  BigZombieEnemy: "A big zombie. Wide and stubborn.",

  FrogEnemy: "It hops in bursts. Don't stand where it lands.",
  BigFrogEnemy: "A hulking hopper. Big swings, big reach.",

  SpiderEnemy: "It hides, then strikes when you're close.",
  BeetleEnemy: "A beetle. It moves on a rhythm, not a rush.",

  SkullEnemy: "A skeleton. Hits hard, and doesn't stay down for long.",
  ArmoredSkullEnemy: "An armored skeleton. Tougher, still angry.",
  BigSkullEnemy: "A giant skeleton. Wide swings, wide body.",

  KnightEnemy: "A burrow knight. Marches straight and hits hard.",
  ChargeEnemy: "It lines you up, then charges in a straight line.",
  BoltcasterEnemy: "A boltcaster. It seeks a clear line, then fires.",

  PawnEnemy: "A pawn. Harmless head-on—deadly on the diagonals.",
  BishopEnemy: "A bishop. Only the diagonals are safe—sometimes.",
  RookEnemy: "A rook. Controls straight lines.",
  QueenEnemy: "A queen. Threatens straight and diagonal lines.",
  KingEnemy: "A king. Hits hard and won't die politely.",

  FireWizardEnemy: "A fire wizard. Telegraphs flames, then detonates.",
  EarthWizardEnemy: "An earth wizard. Rings you in, then crushes the gaps.",
  EnergyWizardEnemy: "An energy wizard. Fast bursts and nasty overlaps.",

  ExalterEnemy: "An exalter. Makes other enemies hit harder.",
  OccultistEnemy: "An occultist. Shields allies and drags out fights.",
  WardenEnemy: "A warden. Keeps its distance and calls in crushers.",
  CrusherEnemy: "A crusher. It doesn't fight— it falls.",
  Spawner: "A reaper. It spits out trouble if left alone.",

  GlowBugEnemy: "A glowbug. Harmless, but bright enough to matter.",

  // Props / interactables
  Chest: "A chest. Open it for loot.",
  VendingMachine: "A vending machine. Coins in, supplies out.",
  Crate: "A crate. Pushable cover with splinters.",
  DarkCrate: "A dark crate. Push it. Hide behind it.",
  Barrel: "A barrel. Rolls poorly, blocks well.",
  Pot: "A pot. Smashable, sometimes rewarding.",
  DarkPot: "A dark pot. Smashable, usually disappointing.",
  DarkVase: "A dark vase. Fragile on purpose.",
  Bomb: "A bomb. Light it and leave.",
  Block: "A heavy block. Solid, stubborn, and in the way.",
  Furnace: "A furnace. Hot enough to make bars.",
  FishingSpot: "A fishing spot. Bring a rod.",
  Tree: "A tree. Blocks sight and takes hits.",
  Bush: "A bush. Rustles when you hit it.",
  TombStone: "A tombstone. Someone didn't make it back.",
  TallSucculent: "A tall succulent. Spiky and stubborn.",

  // Resource-ish
  CaveBlock: "Cave rock. Mine it with a pickaxe.",
  ObsidianBlock: "Obsidian. Harder than it looks.",
  IronResource: "Iron ore vein. Needs a pickaxe.",
  GoldResource: "Gold ore vein. Shiny, heavy, valuable.",
  CoalResource: "Coal seam. Fuel for the furnace.",
  Rock: "A rock. Breakable with a pickaxe.",
  CaveRock: "Cave rock. Picks love it.",
  EmeraldResource: "An emerald vein. Bright and brittle.",
  AmberResource: "An amber vein. Warm glow, sharp edges.",
  GarnetResource: "A garnet vein. Red as a warning.",
  ZirconResource: "A zircon vein. Cold light, sharp cuts.",
  ObsidianResource: "Obsidian. Tough stone with a mean edge.",
};


