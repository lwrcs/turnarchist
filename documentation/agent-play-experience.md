# Agent play experience notes

These notes record behavior and strategy learned through hands-on play with the
teaching interface. They intentionally exclude facts learned only by reading or
editing the game's code.

## Session log

### Seed 123 — Sol medium

- Run started from the teaching page in normal Game view, with decisions made
  primarily from the restricted structured observation.
- Pushing a barrel repeatedly through a one-tile corridor can chain-push and
  eventually crush a two-health skeleton without entering melee range. The useful
  tactic emerged from controlling the sequence, not merely knowing that the barrel
  and skeleton were chain-pushable.
- A room that looked like the route forward required destroying a mushroom patch
  behind a pushed crate. The patch dropped food onto the newly opened path, so
  clearing route obstructions can also provide recovery resources.
- A fading crab warning appeared ambiguous in structured state even though its
  visual fade direction is clear to a player. The intended rule is: a warning is
  dangerous as soon as it fades in and safe as soon as it begins fading out.
- Equipping a candle at zero turn cost was useful immediately after entering a dark
  room: contacts became identifiable without advancing nearby enemies. The room
  turned out to be a true dead end, but clearing it yielded a second wall candle.
  This is a concrete example where completing a dead end still pays for exploration.
- Against a forward-only one-health zombie, the reliable sequence was to step out
  of its warned lane, let it advance, move alongside it while it spent a turn
  changing direction, then kill it from the side. The timing was much easier to
  understand from successive live observations than from static traits alone.
- The first boss room was a skeleton spawner with substantial clutter and several
  ordinary enemies already active. Equipping the emerald ring before advancing
  cost no turn and felt clearly preferable to waiting for a crisis mid-fight.
- After the boss spawner and visible enemies disappeared, crossing the former
  spawn area still dealt lethal damage. The emerald ring revived the player and
  returned them to the starting room. An apparently clear entity/warning list is
  therefore not enough to establish that a recently active spawn tile is safe.
- Fast repeated movement during combat can outlive the situation it was intended
  for. One queued direction finished an enemy and a later queued direction moved
  into the newly empty tile. Combat demonstrations should wait for the resulting
  state after each input even though ordinary empty-room travel can be batched.
- The descent into the sewer changed the rendered scene before the structured
  inspector changed rooms. Decisions immediately after a transition should wait
  for the observation's room id and depth to update.
- Rats flee from an equipped light source and can be herded against cave walls.
  Once cornered, two rats briefly occupied adjacent escape tiles; killing the
  nearer one let the other move into its square for a safe follow-up strike.
- A cornered rat dealt 0.5 damage on a tile that its warnings represented as safe.
  This is unintended rat behavior rather than a strategy to learn; its flee path
  must never route through the player as an attack.
- Fishing requires carrying a fishing rod and clicking a visible FishingSpot; the
  rod does not have to be selected or equipped. Each accepted cast advances the
  world, nearby enemies continue moving, and rapid clicks can be ignored while a
  cast is resolving.
- A caught fish restored one full health at zero turn cost, although the current
  structured item observation reported `healingAmount: null`. The live result is
  strategically important and exposes a missing item trait for the agent.
- Destroying reward chests did not itself advance the world; the observed turn
  increments came when a later input stepped into the cleared chest tile. This
  makes opening every chest before leaving cheap, and the room yielded weapon
  fragments, a mana potion, and a torch in this run.
- The restricted observation did not expose the visible coin count, so automatic
  coin rewards could not be verified from structured state even though the normal
  game HUD changed during the room traversal. This is an observation omission.
- Entering the floor ladder produced a `decision: "ladder"` state while
  `selectionChoices` remained null. Space still confirmed the visible Descend
  prompt and reached depth 1 successfully.
- Health changed from 1.5 to 2 while confirming the depth transition, but floor
  transitions are not intended to heal. The leading explanation is that the Space
  confirmation leaked into the quickbar and consumed food; treat this as a possible
  teaching-input defect until the recorded action sequence proves the cause.

### Seed 2732920491 — Sol medium keyboard demonstration

- The visible teaching game can be driven entirely from a focused board with
  arrow keys; this keeps the game view on screen while the restricted inspector
  supplies the state between turns.
- Equipping the emerald ring from inventory slot 3 used zero world turns. At one
  health it was the correct preparation before crossing a crowded room, and the
  ring was later consumed by its emergency recovery effect.
- A cluster of one-health forward-only zombies can be untangled by retreating up
  the room, then killing an adjacent zombie while its forward warning covers the
  player's current tile. Killing the warning source before the enemy phase made
  the otherwise dangerous attack survivable.
- Door traversal is directional and may require a second keypress after stepping
  onto the door tile. The room id and player coordinates are the reliable signal
  that the transition has completed.
- A procedurally generated route reached a boss room at one health. The room held
  a three-health BigZombieEnemy alongside ordinary zombies, skulls, and a crab;
  treating the giant as a distinct multi-hit threat is necessary even when the
  smaller enemies can be removed with one strike.
- After the ring's recovery, the demonstration returned to the start room while
  preserving the recorded action history. A run that appears to continue after a
  lethal mistake may therefore be a post-death reset rather than uninterrupted
  progress.

## Unintended behavior to fix or verify

- Rat flee pathfinding can damage the player on a tile its warning state says is safe.
- Warning observations need the same fade-in-dangerous/fade-out-safe distinction a
  visual player receives.
- Coin count is absent from the player observation.
- Fish heals one health, but its exported `healingAmount` is null.
- Ladder confirmation may leak a Space input into the selected quickbar item; audit
  the recorded transition before treating the health change as a game rule.

## Current-run observations, grouped by model and effort

### Sol medium

#### Seed 123

- The observations in the first session-log entry were captured while playing with
  Sol at medium effort. That run reached depth 1 and established the baseline
  notes above about warning phases, fishing, room transitions, and item effects.

#### Seed 2732920491

- The keyboard demonstration observations above were captured with Sol at medium
  effort. In particular, the emergency-ring return should be read as a recovery
  mechanic, not as evidence that the uninterrupted run survived the lethal
  position.

### Terra medium

#### Seed 1139981005 — active recorded run

- Normal two-health skeletons were handled reliably by moving out of their
  projected tile, taking the exposed side after their advance, striking once to
  make them headless, then striking again while they produced no dangerous
  warning. This sequence preserved full health in two separate encounters.
- A boss room containing a four-health spawner continuously added one-health
  zombies and crabs. The initial attempt prioritized reaching the spawner but
  allowed two zombies to threaten the same player tile. Their simultaneous hits
  removed one full health, confirming that stacked warning sources must be
  counted as separate damage events rather than as a single binary threat.
- The emerald ring prevented that otherwise lethal boss-room collapse. It was
  consumed and returned the player to the start room with one health, six coins,
  and the recorded run still active. The return did not erase previously cleared
  rooms or the action history.
- Mushroom patches require two distinct steps: strike the patch to clear it, then
  step onto the cleared tile to collect the dropped mushrooms. The latter adds a
  zero-turn, 0.5-health food item to the next inventory slot.
- At two health, a better response to a two-enemy overlap near the spawner is to
  kill one adjacent one-health zombie first, then deliberately accept the single
  remaining point of damage while continuing the spawner assault. This was a
  player-provided tactical correction and remains to be validated in a fresh
  replay.
- Spawn particles must be handled as tile hazards distinct from spawned enemies:
  remaining on one costs 0.5 health on each turn. The restricted observation did
  not surface an explicit particle list in this run, so the live visual state and
  subsequent health change were needed to notice the hazard.
