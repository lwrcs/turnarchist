// Edit this file to add accurate strategy guidance.
// This is sent to Claude as context for every /ask query.
// Sections can be as long or short as needed — just keep it factual.

export const GAME_STRATEGY_GUIDE = `
[TURNARCHIST STRATEGY GUIDE]

--- CORE MECHANICS ---
(How turns work, damage, movement rules, etc.)


--- EARLY GAME ---
(What to prioritize in the first few floors, common mistakes, what to pick up)


--- ENEMIES: HOW TO FIGHT THEM ---

zombie: Moves every turn straight toward you. Forward-only attack, 1 HP. Easy alone, dangerous in groups as they'll surround you. Kill when isolated.

skeleton: Moves every turn, forward-only attack, 2 HP. At 1 HP it becomes unconscious and stops moving for ~5 turns before regenerating back to 2 HP. Finish it during the stun window or it resets. The unconscious body blocks other enemies' pathfinding — you can use this deliberately to create a roadblock.

armored skeleton: 3 HP. Never attack head-on — they'll survive and hit back. Always attack from the side unless you can kill them in one hit. At 1 HP it becomes unconscious and stops moving for ~5 turns before regenerating back to 2 HP. Finish it during the stun window or it resets.

armored zombie: Never attack head-on — they'll survive and hit back. Always attack from the side unless you can kill them in one hit.

big zombie: 2x2 footprint, 3 HP. Never attack head-on — it'll survive and hit back. Always attack from the side unless you can kill it in one hit. Can break objects in the room.

big skeleton: 2x2 footprint, 4 HP. Never attack head-on — it'll survive and hit back. Always attack from the side unless you can kill it in one hit. At 1 HP it becomes unconscious and stops moving for ~5 turns before regenerating. Finish it during the stun window or it resets. Can break objects in the room.

beetle: Moves every other turn, always jumps exactly 3 tiles. Can only attack by landing on you — if it can't find a 3-tile jump it stays put. Hit warnings show where it can land. Stay out of its 3-tile range or block the jump path with terrain.

rat: Moves every other turn, omnidirectional 1-tile attack. Step back on its active turn so it moves but doesn't reach you, then step forward to attack on its inactive turn. Repeat to kill without taking damage.

crab: Moves every other turn. Step back on its active turn so it moves but doesn't reach you, then step forward to attack on its inactive turn. Only deals half damage so less punishing if you mistime it.

frog: Moves every other turn, jumps exactly 2 tiles including diagonally. Get adjacent and they can only jump over you, making them harmless. At range they're dangerous — they can jump over enemies and objects to reach you.

big frog: 2x2 footprint, jumps exactly 2 tiles including diagonally. Get adjacent and it can only jump over you, making it harmless. At range it's dangerous — can jump over enemies and objects to reach you. Can crush enemies it lands on.

spider: Attacks every other turn, can move or attack 1 or 2 tiles orthogonally. Same step-back-then-forward rhythm works as with other every-other-turn enemies.

mummy: Moves every turn straight toward you, forward-only attack. Only deals half damage and has a small alert range, so easier to avoid or ignore than most enemies.

crusher: Spawned by the warden. Slams down every other turn, damages anything on the tile it lands on. Just get out of the way — hit warnings show where it will land. Cannot be killed directly — kill the warden to stop them.

glowbug: Harmless, just illuminates the room. Drops a glowbug light source when killed — implied you're catching it in a jar rather than killing it.

bishop: 2 HP, attacks diagonally only. Always approach and attack from a cardinal direction — it cannot hit you head-on.

burrow knight: 2 HP, hits for 2 damage. Moves every other turn — on its burrowed (inactive) turn it can't hit you. Attack it during that window, then attack again on the next burrowed turn to kill it without taking damage.

warden: 6 HP, 2 damage. Moves every other turn and spawns two crushers. Only attack during its inactive turn or you'll take 2 damage back. Takes multiple hits to kill, so stay disciplined with the timing. Killing the warden kills its crushers too.

earth wizard: 1 HP — dies in one hit, but teleports to stay 2–3 tiles away. Two-turn attack: first places a ring of projectiles at radius 2, then next turn fills in all 8 adjacent tiles. Step off any warnings before they detonate, or kill the wizard to stop the attack entirely.

fire wizard: 1 HP — dies in one hit, teleports to stay 2–3 tiles away. Two-turn attack: first fires on the 4 cardinal adjacent tiles, then next turn fires on the 4 diagonal tiles, together covering all 8 surrounding squares. Step off any warnings before they detonate, or kill the wizard to stop the attack.

energy wizard / wizard bomber: 1 HP — dies in one hit, teleports to stay 2–3 tiles away. Fires a cross pattern reaching 2 tiles in each cardinal direction all at once — a single burst rather than two waves. Step off warnings or kill it to stay safe.

charge knight: 1 HP. Only detects you if you're in a cardinal straight line within 3 tiles. When it spots you it alerts for one turn (shows a beam), then charges the next turn — moving up to 3 tiles and hitting anything in its path. Sidestep out of the line on the alert turn, or just kill it before it charges since it's only 1 HP.

big knight: 2×2 body, 4 HP. Moves every other turn — attack on its inactive turn. Immune to bleed.

big wizard: 2×2 body, 2 HP, teleports to stay 2–3 tiles away. Fires 2×2 explosions in a cross pattern at distances 2 and 4 in each cardinal direction in one burst. Step off warnings or kill it — takes two hits unlike the smaller wizards.

king: 2 HP, 2 damage, moves every other turn. Attacks in all 8 directions. When hurt it retreats on its next turn instead of advancing — so hitting it on its active turn won't get you hit back. Attack freely, just be ready to close the gap after each hit.

queen: 2 HP, moves every turn. Attacks in all 8 directions. When hurt it retreats instead of advancing — so hitting it prevents retaliation that turn. More relentless than most enemies since it never pauses, but you can always attack safely knowing it will back off.

rook: 1 HP, moves every turn, orthogonal attack only. Keep yourself off its cardinal lines and it won't be able to hit you as it closes in. If you find yourself lined up with it, stall by hitting an object or another enemy to buy time to reposition.

pawn: 1 HP, moves every turn orthogonally. Attacks diagonally only — safe to stand directly in front, behind, or to either side of it. Never stand diagonally adjacent or you'll take a hit. When hurt it retreats, so hitting it prevents retaliation that turn.

boltcaster: 2 HP. Maneuvers to find a clear cardinal line of sight, then spends one turn loading (shows a beam warning), then fires the next turn. The bolt hits the first entity or wall in its path. Step off the warning line before it fires, use another enemy or object to block the shot, or close to melee range to force it to retreat.

exalter: 6 HP, immune to bleed, can't be pushed. Buffs nearby enemies within range 6, making them hit harder. Teleports away every 2 hits (at 4 HP and 2 HP). Always kill it first — buffed enemies are more dangerous and the buff only ends when the exalter dies. Expect it to escape twice before going down.

occultist: 6 HP, immune to bleed, can't be pushed. Shields nearby enemies within range 6, absorbing hits for them. Teleports away every 2 hits (at 4 HP and 2 HP). Killing it removes all shields. Always kill it first — shields make already dangerous enemies much harder to deal with.

reaper / spawner: 4 HP, immune to bleed and poison, doesn't move or attack directly. Spawns a random enemy type every 4 turns adjacent to itself, telegraphed with a hit warning. The spawn itself deals 0.5 damage — step off any tile with an incoming spawn. Multiple reapers in the same room spawn more slowly. Kill it as fast as possible — every 4 turns it adds another enemy to the fight.


--- WEAPONS ---

dagger: 1 damage, 1-tile attack. The baseline weapon — no special mechanics, always reliable.

sword: 1 damage. Hits the tile ahead, and on hit also strikes the two flanking tiles beside the target. Good for groups. Doesn't degrade.

spear: 1 damage. Reaches 2 tiles forward, hitting both — penetrates through the first enemy to the second. Blocked by pushables. Doesn't degrade.

dual daggers: First hit freezes enemy turns — they won't act until you attack or move again. Use the pause to reposition or land a safe second hit, which then advances turns normally.

greataxe: 2-handed, 25 durability. Damage scales with missing HP — 1 at full health, 2 at 75%, 4 at 50%, 8 at 25%. Best used when already hurt.

warhammer: 2 damage, single tile, no degradation. Has a cooldown after each hit — can't spam it.

scythe: 1 damage, 2-handed. Hits the tile ahead and 4 additional tiles flanking both you and the target. Wide arc, no degradation.

quarter staff: 1 damage. Knocks enemies back 1 tile on hit. Pin an enemy against a wall to instantly kill them regardless of HP.

crossbow: 4 damage ranged. Load a bolt, cock it, then fire in a straight line hitting the first enemy. Two-turn setup, consumes bolt ammo.

slingshot: Fires in a straight line, 1 damage, hits the first enemy. No ammo required.

shotgun: Fires up to 3 tiles in a straight line — 1 damage at distance 1–2, 0.5 damage at distance 3. Has durability.

spellbook: Ranged, up to 4 tile range. Uses a mana/cooldown system and has durability. Casts the active spell — starts with Plus, can learn more from spellbook pages.


--- SPELLS ---

Plus: Hits the target tile and all 4 cardinal adjacent tiles simultaneously. 5-tile cross pattern. Good default for clustered enemies.

Cross: Hits the target tile and all 4 diagonal adjacent tiles simultaneously. 5-tile X pattern. Complements Plus — together they cover all 8 surrounding tiles.

Point: Hits only the target tile. Single precise shot, best for isolated targets or conserving mana.

Wave: Expanding shockwave — hits the target tile immediately, then the surrounding 8 tiles with a short delay, then an outer ring of 12 tiles (5×5 without corners) with another delay. Best for large groups or when you need area denial.


--- ITEMS & WHEN TO USE THEM ---

apple / berries / mushrooms / potions: Apple and green potion restore 1 HP. Berries and mushrooms restore 0.5 HP. Food only works when below max HP. Stackable. Use food to top off between fights, save potions for emergencies.

mana potion: Reduces spellbook cooldown by 5. Only useful if you have a spellbook. Stackable.

hourglass: Skips your turn — enemies act, you don't move. 30 uses. Useful for letting every-other-turn enemies advance their cycle so you can attack on their inactive turn safely.

backpack: Permanently adds 5 inventory slots. Use immediately, no reason to hold it.

weapon modifiers (blood / poison / curse): Applied to a weapon from inventory. Blood deals 0.5 damage per turn for 4 ticks (2 total damage). Poison deals 1 damage every 3 turns. Curse is currently a no-op. Blood is better for burst damage, poison for tankier enemies. Many enemies are immune to one or both.


--- ARMOR & SHIELDS ---

occult shield: Absorbs one hit of any size, then recharges after 25 turns. The go-to shield — let it eat a big hit you can't avoid.

wooden shield: Absorbs one hit then permanently breaks. Single-use safety net, good for emergencies but not sustainable.

body armor pieces: Each piece halves damage from a specific direction. Chest plate covers front-facing attacks, gauntlets cover side attacks (not diagonal), shoulder plates cover diagonal attacks, backplate covers attacks from behind. Stack them to cover more angles.

diving helmet: Stores 100 turns of air for underwater travel. Required for flooded cave areas — without it you'll drown.


--- RINGS ---

gold ring: A blank ring — embed a gem into it to create a gem ring. Does nothing on its own.

garnet ring: +1 damage but sets max health to 1 and immediately drops you to 1 HP. Extreme risk/reward — pairs well with the greataxe since low health maximizes its damage, or body armor to survive incoming hits.

zircon ring: +1 magic damage while worn. Best paired with a spellbook.

emerald ring / amber ring: Not yet implemented — placeholder items.


--- TOOLS ---

pickaxe: Lets you mine walls without equipping it — just having it in your inventory is enough. Not a weapon, can't be equipped.

fishing rod: Used to catch fish from water tiles. Can be disassembled into weapon fragments.

hammer: Used on other items from inventory. Disassembles weapons into fragments, cracks geodes open, smelts gold/iron ore into bars, and smiths bars into items. Using it directly heals 1 HP.


--- ENVIRONMENTS ---

Main path depths 0–2 are Dungeon. Depth 3 onward becomes Dark Dungeon — darker, harder enemies, more chess-piece enemies and armored undead.

Side paths branch off the main path via down ladders and have their own boss rooms:

Depth 0 side path: Sewer — rats and crabs, no boss, no further exits.
Depth 1 side path: Forest — frogs, glowbugs, nature enemies. Leads deeper to Castle (chess-piece enemies: knights, rooks, bishops, queens; exalter boss).
Depth 2 side path: Cave — crabs, spiders, armored undead, beetles. Leads deeper to Dark Castle (heavy chess-piece and armored enemies; warden boss).
Depth 3+ side path: Dark Castle — accessed from Dark Dungeon. Heavy chess-piece and armored enemies, warden boss.
Flooded Cave — requires diving helmet to explore. No enemies currently.

--- BIOMES & HAZARDS ---

spike traps: Fire every 4 turns, dealing 0.5 damage to you (1 damage to enemies). A hit warning appears one turn before they fire. Step off the highlighted tile before it goes off, or lure enemies onto them.

magma pools: Impassable terrain — blocks movement for both you and enemies. Use them as natural barriers.

chasm: Impassable terrain — blocks movement for both you and enemies.

flooded cave: Standing in water without a diving helmet causes drowning. First hit comes after 5 turns, then intervals shrink — 4, 3, 2, 1 turns between hits, each dealing 0.5 damage. The diving helmet stores 100 turns of air and recharges when you surface.


--- SKILLS ---

Skills level up by performing the relevant activity on a RuneScape-style XP curve up to level 99. XP crystals found in the dungeon grant a chunk of XP to a specific skill.

melee: Leveled by killing enemies with melee weapons. Each weapon tier requires a minimum melee level to equip — dagger (1), quarterstaff (5), sword (10), spear (13), dual daggers (15), warhammer (18), scythe (20), greataxe (25). Higher-tier weapons give more XP per kill, so always use the best weapon you can equip.

magic: Leveled by killing enemies with the spellbook.

ranged: Leveled by killing enemies with ranged weapons (slingshot, shotgun, crossbow).

fishing: Leveled by fishing with the fishing rod. Roughly 30% chance to catch per attempt.

mining: Leveled by mining ore nodes. XP scales with ore type — rock gives minimal XP, garnet gives the most. Deeper floors multiply XP gained.

smithing / crafting: Leveled by using the hammer to smelt ore into bars and smith or craft items. Crafting covers ring-making, gem embedding, and weapon assembly.

woodcutting: Leveled by cutting wood.


--- GENERAL TIPS ---

High-level play involves switching weapons to match the situation — a sword clears grouped enemies, a spear pierces through enemies to hit the one behind, dual daggers buy time to reposition, a spellbook handles targets across the room. Carrying two or three weapons and swapping between them is more effective than committing to one.

Food is your most important resource — collect it whenever you can. Health potions come from vending machines, fish from water pools (fishing rod required), apples from trees, berries from bushes, and mushrooms from mushroom patches. Stock up aggressively; healing opportunities are limited between floors.

` as const;
