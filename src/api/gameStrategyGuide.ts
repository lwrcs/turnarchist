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

dagger:

sword:

spear:

dual daggers:

greataxe:

warhammer:

scythe:

quarter staff:

crossbow:

slingshot:

shotgun:

spellbook:


--- SPELLS ---

Plus:

Cross:

Point:

Wave:


--- ITEMS & WHEN TO USE THEM ---

apple / berries / mushrooms / potions:

mana potion:

hourglass:

backpack:

weapon modifiers (blood / poison / curse):


--- ARMOR & SHIELDS ---

occult shield:

wooden shield:

body armor pieces:

diving helmet:


--- RINGS ---


--- TOOLS ---

pickaxe:

fishing rod:

hammer:


--- BIOMES & HAZARDS ---

spike traps:

magma pools:

chasm:

flooded cave:

(other biome-specific notes)


--- SKILLS ---
(What each skill does, how to level it, what it unlocks)


--- GENERAL TIPS ---

` as const;
