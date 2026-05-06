export const GAME_CONTEXT = `
[TURNARCHIST GAMEPLAY REFERENCE]

--- OVERVIEW ---
Turnarchist is a turn-based roguelike. The player acts, then every enemy in the room responds. Movement and attacks all cost one turn. The game ends on death — no mid-run saves except via the Save action (stored to browser). Floor depth increases as you descend ladders.

--- BIOMES / ENVIRONMENTS ---
Dungeon, Cave, Forest, Castle (side-path), Glacier, Dark Castle, Desert, Magma Cave, Dark Dungeon, Flooded Cave, Sewer, Tutorial. Each biome has thematic enemies and hazards.

--- PLAYER STATS ---
Health: tracked as integer hearts. MaxHealth increases via certain items.
Skills: Melee, Magic, Ranged, Fishing, Mining, Smithing, Crafting, Woodcutting. Each levels via a RuneScape-style XP curve (max level 99). Skill level affects weapon equip requirements and kill XP multipliers.

--- ENEMIES ---
zombie — slow, moves straight, basic attacker
beetle — moves on alternating-turn rhythm
frog — hops in bursts; landing tile is dangerous
big frog — hulking, wide reach on hops
big zombie — wide body, stubborn movement
rat — fast and erratic
crab — scuttles sideways, attacks at close range
glowbug — harmless; brightens rooms (useful for visibility)
crusher — does not fight; falls from above onto tiles (hazard)
mummy — close-range attacker, quiet steps
spider — hides until you are adjacent, then strikes
skeleton — forward-only attack; hits hard; regenerates HP after ~5 turns (kill fast or use burst damage)
armored skeleton — tougher version of skeleton with more HP
armored zombie — zombie with extra HP
bishop — attacks only on diagonals; safe to approach head-on
burrow knight — marches straight and hits very hard
warden — keeps distance; periodically summons crushers
earth wizard — encircles player with walls, then closes the gaps
energy wizard / wizard bomber — fires fast overlapping energy bursts
fire wizard — telegraphs flames on nearby tiles, then detonates them
charge knight — lines up straight then charges the full distance of the room
big knight — giant body; wide melee threat; short reach
big skeleton — wide swing covering adjacent tiles
big wizard — powerful ranged spell area attacks
king — hits hard; high HP; chess-piece movement rules
pawn — safe head-on; deadly on diagonals (chess-piece rules)
queen — threatens both straight and diagonal lines; very dangerous (chess-piece rules)
rook — controls straight lines; high range (chess-piece rules)
boltcaster — seeks a clear line of sight, then fires a piercing bolt
exalter — buffs adjacent enemies, making them hit harder; prioritize it
occultist — grants shields to allies, prolonging fights; prioritize it
reaper / spawner — stationary; continuously spawns additional enemies if ignored; kill it first

--- WEAPONS ---
dagger — basic 1-damage melee, 1-tile range
sword — hits tile ahead; on hit also strikes the two flanking tiles
spear — hits 1 and 2 tiles ahead in a straight line (piercing)
dual daggers — two separate hit attempts per turn
greataxe — high damage, slightly slower
warhammer — high damage; some knockback
scythe — requires scythe blade + scythe handle (crafted); wide arc sweep
quarter staff — basic staff melee
crossbow — ranged; requires crossbow stock + crossbow limb + crossbow bolt; uses bolt ammo
slingshot — short-range ranged, low damage
shotgun — loud short-range burst
spellbook — magic weapon that fires spell patterns using mana (cooldown-based)

Weapon modifiers (applied via consumables):
  weapon blood, weapon poison, weapon curse — apply status effects on hit

--- SPELLS (spellbook patterns) ---
Plus — cross shape (hits 4 cardinal tiles)
Cross — X shape (hits 4 diagonal tiles)
Point — single tile (precise)
Wave — expanding ring (hits all adjacent tiles)
Scrolls teach new spells. You can carry and switch spells mid-run.
Mana Potion restores 5 cooldown ticks across all equipped spellbooks.

--- ARMOR & SHIELDS ---
Occult shield — absorbs one hit, then recharges after 25 turns
Wooden shield — similar absorption mechanic, weaker
Chest plate, shoulder plates, backplate, gauntlets — body armor pieces; reduce or absorb damage
Diving helmet — required for Flooded Cave / underwater areas

--- RINGS ---
Gold ring — embed a gem to gain an enchantment
Emerald ring, Zircon ring (+1 magic damage), Amber ring, Garnet ring — gem-embedded variants

--- USABLE ITEMS ---
Apple — restores 1 HP (stackable)
Berries — minor food heal
Mushrooms — restores 0.5 HP (stackable)
Green potion — restores 1 HP
Health potion — restores 1 HP
Mana potion — reduces spellbook cooldown by 5 (stackable)
Hourglass — skips your turn without advancing enemies (30 charges; useful for spike trap timing)
Scrolls — teach new spells to spellbooks
Spellbook pages — expand spell capacity
Backpack — increases inventory capacity by 1 slot
Weapon blood / poison / curse — applies status modifier to held weapon
Weapon fragments — crafting material

--- TOOLS ---
Pickaxe — mines rock walls
Fishing rod — fish in pools
Hammer — breaks weapons into fragments

--- RESOURCES & CRAFTING ---
Gems: red gem, blue gem, green gem, orange gem, zircon gem
Ores/bars: iron ore, iron bar, gold ore, gold bar
Other: stone, coal, geode
Gem + Gold Ring → enchanted ring (passive bonus while equipped)

--- LIGHT SOURCES ---
Torch, candle, lantern — held light; increases vision radius
Glow stick — placed light source
Glowbugs (item) — mobile light source
Shroom light — ambient glow

--- HAZARD TILES ---
Spike — static; damages player on contact
Spike trap — alternates on/off every 4 turns; damages player when active (use Hourglass to skip a turn and let it cycle)
Pool — water tile; fishing spots; crossable without penalty
Magma pool — damages player on contact (magma biome)
Chasm — falling hazard; descends a floor
Down ladder / Up ladder — main-path floor transitions

--- GENERAL TIPS ---
- Enemies only move after you act — take time to plan each move.
- The exalter makes nearby enemies more dangerous; kill it first.
- The reaper (spawner) continuously produces enemies; kill it immediately.
- Skeletons regenerate; use burst damage or poison to kill them before they heal.
- The Flooded Cave requires a Diving Helmet to breathe.
- Rings with gems grant passive bonuses while equipped.
- Use the Hourglass to let spike traps cycle to their off state before crossing.
- Bishop enemies only attack diagonally — approach them head-on safely.
- Charge knight charges in a straight line — step to the side to avoid it.
- Line up shots carefully — many enemies (and the player with a spear/crossbow) attack only in a straight line.
` as const;
