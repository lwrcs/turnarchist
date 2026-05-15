/**
 * Test bed populator — spawns one of every registered entity/item kind
 * into the current room, so __devRoundtrip() can test them all.
 *
 * Usage (browser console):
 *   __devPopulateTestRoom()      — fills player's current room
 *   __devPopulateTestRoom(true)  — clear existing entities/items first
 */

import type { Room } from "../../room/room";
import type { Game } from "../../game";

// ---- Entity constructors ----
import { Barrel } from "../../entity/object/barrel";
import { Bomb } from "../../entity/object/bomb";
import { Block } from "../../entity/object/block";
import { Bush } from "../../entity/object/bush";
import { Chest } from "../../entity/object/chest";
import { Crate } from "../../entity/object/crate";
import { DarkCrate } from "../../entity/object/darkCrate";
import { DecoBlock } from "../../entity/object/decoBlock";
import { CaveBlock } from "../../entity/object/caveBlock";
import { ObsidianBlock } from "../../entity/object/obsidianBlock";
import { Rubble } from "../../entity/object/rubble";
import { Pot } from "../../entity/object/pot";
import { DarkPot } from "../../entity/object/darkPot";
import { DarkVase } from "../../entity/object/darkVase";
import { Candelabra } from "../../entity/object/candelabra";
import { Pumpkin } from "../../entity/object/pumpkin";
import { TombStone } from "../../entity/object/tombStone";
import { Furnace } from "../../entity/object/furnace";
import { FishingSpot } from "../../entity/object/fishingSpot";
import { Mushrooms } from "../../entity/object/mushrooms";
import { Glowshrooms } from "../../entity/object/glowshrooms";
import { PottedPlant } from "../../entity/object/pottedPlant";
import { Sprout } from "../../entity/object/sprout";
import { LilyPlant } from "../../entity/object/lilyPlant";
import { Tree } from "../../entity/object/tree";
import { BigTree } from "../../entity/object/bigTree";
import { TallSucculent } from "../../entity/object/tallSucculent";
import { Succulent } from "../../entity/object/succulent";
import { SmallBush } from "../../entity/object/smallBush";
import { PawnStatue } from "../../entity/object/pawnStatue";
import { RookStatue } from "../../entity/object/rookStatue";
import { BishopStatue } from "../../entity/object/bishopStatue";
import { FallenPillar } from "../../entity/object/fallenPillar";
import { DarkPillar } from "../../entity/object/darkPillar";
import { VendingMachine } from "../../entity/object/vendingMachine";
import { Spawner } from "../../entity/enemy/spawner";
import { ArmoredSkullEnemy } from "../../entity/enemy/armoredSkullEnemy";
import { ArmoredzombieEnemy } from "../../entity/enemy/armoredzombieEnemy";
import { BeetleEnemy } from "../../entity/enemy/beetleEnemy";
import { BishopEnemy } from "../../entity/enemy/bishopEnemy";
import { BoltcasterEnemy } from "../../entity/enemy/boltcasterEnemy";
import { ChargeEnemy } from "../../entity/enemy/chargeEnemy";
import { CrabEnemy } from "../../entity/enemy/crabEnemy";
import { RatEnemy } from "../../entity/enemy/ratEnemy";
import { CrusherEnemy } from "../../entity/enemy/crusherEnemy";
import { FrogEnemy } from "../../entity/enemy/frogEnemy";
import { BigFrogEnemy } from "../../entity/enemy/bigFrogEnemy";
import { GlowBugEnemy } from "../../entity/enemy/glowBugEnemy";
import { KingEnemy } from "../../entity/enemy/kingEnemy";
import { KnightEnemy } from "../../entity/enemy/knightEnemy";
import { BigKnightEnemy } from "../../entity/enemy/bigKnightEnemy";
import { ChessKnightEnemy } from "../../entity/enemy/chessKnightEnemy";
import { GiantFrogEnemy } from "../../entity/enemy/giantFrogEnemy";
import { MummyEnemy } from "../../entity/enemy/mummyEnemy";
import { PawnEnemy } from "../../entity/enemy/pawnEnemy";
import { QueenEnemy } from "../../entity/enemy/queenEnemy";
import { RookEnemy } from "../../entity/enemy/rookEnemy";
import { SkullEnemy } from "../../entity/enemy/skullEnemy";
import { BigSkullEnemy } from "../../entity/enemy/bigSkullEnemy";
import { BigZombieEnemy } from "../../entity/enemy/bigZombieEnemy";
import { SpiderEnemy } from "../../entity/enemy/spiderEnemy";
import { WardenEnemy } from "../../entity/enemy/wardenEnemy";
import { FireWizardEnemy } from "../../entity/enemy/fireWizard";
import { EarthWizardEnemy } from "../../entity/enemy/earthWizard";
import { EnergyWizardEnemy } from "../../entity/enemy/energyWizard";
import { BigWizardEnemy } from "../../entity/enemy/bigWizardEnemy";
import { ZombieEnemy } from "../../entity/enemy/zombieEnemy";
import { OccultistEnemy } from "../../entity/enemy/occultistEnemy";
import { ExalterEnemy } from "../../entity/enemy/exalterEnemy";
import { CoalResource } from "../../entity/resource/coalResource";
import { GoldResource } from "../../entity/resource/goldResource";
import { IronResource } from "../../entity/resource/ironResource";
import { EmeraldResource } from "../../entity/resource/emeraldResource";
import { ZirconResource } from "../../entity/resource/zirconResource";
import { AmberResource } from "../../entity/resource/amberResource";
import { GarnetResource } from "../../entity/resource/garnetResource";
import { Rock } from "../../entity/resource/rockResource";
import { CaveRock } from "../../entity/resource/caveRockResource";
import { ObsidianResource } from "../../entity/resource/obsidianResource";

// ---- Item constructors ----
import { Coin } from "../../item/coin";
import { MagicXpCrystal, MeleeXpCrystal, RangedXpCrystal } from "../../item/xpCrystal";
import { Key } from "../../item/key";
import { GoldenKey } from "../../item/goldenKey";
import { BluePotion } from "../../item/usable/bluePotion";
import { GreenPotion } from "../../item/usable/greenPotion";
import { Backpack } from "../../item/backpack";
import { Apple } from "../../item/usable/apple";
import { Fish } from "../../item/usable/fish";
import { Heart } from "../../item/usable/heart";
import { Hourglass } from "../../item/usable/hourglass";
import { Shrooms } from "../../item/usable/shrooms";
import { WeaponPoison } from "../../item/usable/weaponPoison";
import { WeaponBlood } from "../../item/usable/weaponBlood";
import { WeaponCurse } from "../../item/usable/weaponCurse";
import { Spellbook } from "../../item/weapon/spellbook";
import { Dagger } from "../../item/weapon/dagger";
import { Sword } from "../../item/weapon/sword";
import { Spear } from "../../item/weapon/spear";
import { DualDagger } from "../../item/weapon/dualdagger";
import { Greataxe } from "../../item/weapon/greataxe";
import { Warhammer } from "../../item/weapon/warhammer";
import { QuarterStaff } from "../../item/weapon/quarterStaff";
import { Scythe } from "../../item/weapon/scythe";
import { Crossbow } from "../../item/weapon/crossbow";
import { Shotgun } from "../../item/weapon/shotgun";
import { Slingshot } from "../../item/weapon/slingshot";
import { Pickaxe } from "../../item/tool/pickaxe";
import { DivingHelmet } from "../../item/divingHelmet";
import { GoldRing } from "../../item/jewelry/goldRing";
import { EmeraldRing } from "../../item/jewelry/emeraldRing";
import { ZirconRing } from "../../item/jewelry/zirconRing";
import { AmberRing } from "../../item/jewelry/amberRing";
import { GarnetRing } from "../../item/jewelry/garnetRing";
import { SpellbookPage } from "../../item/usable/spellbookPage";
import { WeaponFragments } from "../../item/usable/weaponFragments";
import { Coal } from "../../item/resource/coal";
import { Geode } from "../../item/resource/geode";
import { Stone } from "../../item/resource/stone";
import { BlueGem } from "../../item/resource/bluegem";
import { GreenGem } from "../../item/resource/greengem";
import { RedGem } from "../../item/resource/redgem";
import { OrangeGem } from "../../item/resource/orangegem";
import { GoldOre } from "../../item/resource/goldOre";
import { IronOre } from "../../item/resource/ironOre";
import { GoldBar } from "../../item/resource/goldBar";
import { IronBar } from "../../item/resource/ironBar";
import { Torch } from "../../item/light/torch";
import { Lantern } from "../../item/light/lantern";
import { Candle } from "../../item/light/candle";
import { GlowStick } from "../../item/light/glowStick";
import { GlowBugs } from "../../item/light/glowBugs";
import { ShroomLight } from "../../item/usable/shroomLight";
import { Armor } from "../../item/armor";
import { WoodenShield } from "../../item/woodenShield";
import { FishingRod } from "../../item/tool/fishingRod";
import { Hammer } from "../../item/tool/hammer";
import { Backplate } from "../../item/backplate";
import { Gauntlets } from "../../item/gauntlets";
import { ShoulderPlates } from "../../item/shoulderPlates";
import { ChestPlate } from "../../item/chestPlate";
import { CrossbowBolt } from "../../item/weapon/crossbowBolt";
import { GodStone } from "../../item/godStone";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type EntityCtor = new (room: Room, game: Game, x: number, y: number, ...rest: any[]) => any;
type ItemCtor = new (room: Room, x: number, y: number) => any;

/** Collect all passable positions in the room, avoiding the 1-tile border. */
function floorPositions(room: Room): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  for (let x = room.roomX + 1; x < room.roomX + room.width - 1; x++) {
    for (let y = room.roomY + 1; y < room.roomY + room.height - 1; y++) {
      const tile = room.roomArray[x]?.[y];
      if (tile && !tile.isSolid()) {
        positions.push({ x, y });
      }
    }
  }
  return positions;
}

/** Try to place an entity; return true on success. */
function placeEntity(
  Ctor: EntityCtor,
  room: Room,
  game: Game,
  positions: Array<{ x: number; y: number }>,
  label: string,
): boolean {
  const pos = positions.shift();
  if (!pos) {
    console.warn(`[testBed] No floor space left for entity: ${label}`);
    return false;
  }
  try {
    const e = new Ctor(room, game, pos.x, pos.y);
    room.entities.push(e);
    return true;
  } catch (err) {
    console.warn(`[testBed] Failed to spawn entity ${label}:`, err);
    return false;
  }
}

/** Try to drop an item on the floor; return true on success. */
function placeItem(
  Ctor: ItemCtor,
  room: Room,
  positions: Array<{ x: number; y: number }>,
  label: string,
): boolean {
  const pos = positions.shift();
  if (!pos) {
    console.warn(`[testBed] No floor space left for item: ${label}`);
    return false;
  }
  try {
    const it = new Ctor(room, pos.x, pos.y);
    room.items.push(it);
    return true;
  } catch (err) {
    console.warn(`[testBed] Failed to drop item ${label}:`, err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function populateTestRoom(room: Room, game: Game, clearFirst = false): void {
  if (clearFirst) {
    room.entities = [];
    room.items = [];
  }

  const positions = floorPositions(room);
  console.log(`[testBed] ${positions.length} floor tiles available in room (${room.roomX},${room.roomY})`);

  // ---- Entities (objects + enemies + resources) ----
  // Objects
  const objectCtors: [EntityCtor, string][] = [
    [Barrel, "barrel"],
    [Bomb, "bomb"],
    [Block, "block"],
    [DecoBlock, "deco_block"],
    [CaveBlock, "cave_block"],
    [ObsidianBlock, "obsidian_block"],
    [Rubble, "rubble"],
    [Bush, "bush"],
    [SmallBush, "small_bush"],
    [Sprout, "sprout"],
    [LilyPlant, "lily_plant"],
    [Tree, "tree"],
    [BigTree, "big_tree"],
    [TallSucculent, "tall_succulent"],
    [Succulent, "succulent"],
    [DarkVase, "dark_vase"],
    [Candelabra, "candelabra"],
    [PawnStatue, "pawn_statue"],
    [RookStatue, "rook_statue"],
    [BishopStatue, "bishop_statue"],
    [FallenPillar, "fallen_pillar"],
    [DarkPillar, "dark_pillar"],
    [Chest, "chest"],
    [Crate, "crate"],
    [DarkCrate, "dark_crate"],
    [Pot, "pot"],
    [DarkPot, "dark_pot"],
    [Pumpkin, "pumpkin"],
    [TombStone, "tomb_stone"],
    [Furnace, "furnace"],
    [FishingSpot, "fishing_spot"],
    [Mushrooms, "mushrooms_prop"],
    [Glowshrooms, "glowshrooms_prop"],
    [PottedPlant, "potted_plant"],
    [Spawner, "spawner"],
  ];

  // VendingMachine needs an Item arg — supply a Coin as placeholder
  const vmPos = positions.shift();
  if (vmPos) {
    try {
      const vm = new VendingMachine(room, game, vmPos.x, vmPos.y, new Coin(room, vmPos.x, vmPos.y));
      room.entities.push(vm);
    } catch (err) {
      console.warn("[testBed] Failed to spawn vending_machine:", err);
    }
  }

  // Enemies
  const enemyCtors: [EntityCtor, string][] = [
    [ArmoredSkullEnemy, "armored_skull"],
    [ArmoredzombieEnemy, "armored_zombie"],
    [BeetleEnemy, "beetle"],
    [BishopEnemy, "bishop"],
    [BoltcasterEnemy, "boltcaster"],
    [ChargeEnemy, "charge"],
    [CrabEnemy, "crab"],
    [RatEnemy, "rat"],
    [CrusherEnemy, "crusher"],
    [FrogEnemy, "frog"],
    [BigFrogEnemy, "big_frog"],
    [GlowBugEnemy, "glow_bug"],
    [KingEnemy, "king"],
    [KnightEnemy, "knight"],
    [BigKnightEnemy, "big_knight"],
    [ChessKnightEnemy, "chess_knight"],
    [GiantFrogEnemy, "giant_frog"],
    [MummyEnemy, "mummy"],
    [PawnEnemy, "pawn"],
    [QueenEnemy, "queen"],
    [RookEnemy, "rook"],
    [SkullEnemy, "skull"],
    [BigSkullEnemy, "big_skull"],
    [BigZombieEnemy, "big_zombie"],
    [SpiderEnemy, "spider"],
    [WardenEnemy, "warden"],
    [FireWizardEnemy, "fire_wizard"],
    [EarthWizardEnemy, "earth_wizard"],
    [EnergyWizardEnemy, "energy_wizard"],
    [BigWizardEnemy, "big_wizard"],
    [ZombieEnemy, "zombie"],
    [OccultistEnemy, "occultist"],
    [ExalterEnemy, "exalter"],
  ];

  // Resources
  const resourceCtors: [EntityCtor, string][] = [
    [CoalResource, "coal_resource"],
    [GoldResource, "gold_resource"],
    [IronResource, "iron_resource"],
    [EmeraldResource, "emerald_resource"],
    [ZirconResource, "zircon_resource"],
    [AmberResource, "amber_resource"],
    [GarnetResource, "garnet_resource"],
    [Rock, "rock_resource"],
    [CaveRock, "cave_rock_resource"],
    [ObsidianResource, "obsidian_resource"],
  ];

  let entityCount = 0;
  for (const [Ctor, label] of [...objectCtors, ...enemyCtors, ...resourceCtors]) {
    if (placeEntity(Ctor, room, game, positions, label)) entityCount++;
  }

  // ---- Items ----
  const itemCtors: [ItemCtor, string][] = [
    [Coin, "coin"],
    [Key, "key"],
    [Hourglass, "hourglass"],
    [MeleeXpCrystal, "melee_xp_crystal"],
    [MagicXpCrystal, "magic_xp_crystal"],
    [RangedXpCrystal, "ranged_xp_crystal"],
    [GoldenKey, "golden_key"],
    [BluePotion, "blue_potion"],
    [GreenPotion, "green_potion"],
    [Backpack, "backpack"],
    [Apple, "apple"],
    [Fish, "fish"],
    [Heart, "health_potion"],
    [Shrooms, "mushrooms"],
    [WeaponPoison, "weapon_poison"],
    [WeaponBlood, "weapon_blood"],
    [WeaponCurse, "weapon_curse"],
    [SpellbookPage, "spellbook_page"],
    [WeaponFragments, "weapon_fragments"],
    [Coal, "coal"],
    [Geode, "geode"],
    [Stone, "stone"],
    [BlueGem, "blue_gem"],
    [GreenGem, "green_gem"],
    [RedGem, "red_gem"],
    [OrangeGem, "orange_gem"],
    [GoldOre, "gold_ore"],
    [IronOre, "iron_ore"],
    [GoldBar, "gold_bar"],
    [IronBar, "iron_bar"],
    [Torch, "torch"],
    [Lantern, "lantern"],
    [Candle, "candle"],
    [GlowStick, "glow_stick"],
    [GlowBugs, "glow_bugs"],
    [ShroomLight, "glowshrooms"],
    [Dagger, "dagger"],
    [Sword, "sword"],
    [Spear, "spear"],
    [DualDagger, "dual_daggers"],
    [Greataxe, "greataxe"],
    [Warhammer, "warhammer"],
    [QuarterStaff, "quarterstaff"],
    [Scythe, "scythe"],
    [Crossbow, "crossbow"],
    [Shotgun, "shotgun"],
    [Slingshot, "slingshot"],
    [Spellbook, "spellbook"],
    [Pickaxe, "pickaxe"],
    [FishingRod, "fishing_rod"],
    [Hammer, "hammer"],
    [Armor, "occult_shield"],
    [WoodenShield, "wooden_shield"],
    [DivingHelmet, "diving_helmet"],
    [Backplate, "backplate"],
    [Gauntlets, "gauntlets"],
    [ShoulderPlates, "shoulder_plates"],
    [ChestPlate, "chest_plate"],
    [CrossbowBolt, "crossbow_bolt"],
    [GodStone, "god_stone"],
    [GoldRing, "gold_ring"],
    [EmeraldRing, "emerald_ring"],
    [ZirconRing, "zircon_ring"],
    [AmberRing, "amber_ring"],
    [GarnetRing, "garnet_ring"],
  ];

  let itemCount = 0;
  for (const [Ctor, label] of itemCtors) {
    if (placeItem(Ctor, room, positions, label)) itemCount++;
  }

  console.log(
    `[testBed] Populated room (${room.roomX},${room.roomY}): ` +
    `${entityCount + 1} entities (incl. vending_machine), ${itemCount} items. ` +
    `${positions.length} floor positions remaining.`,
  );
}
