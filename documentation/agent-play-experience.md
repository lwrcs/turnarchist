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
- A non-hostile/fading crab warning was still tactically unsafe to step onto: the
  crab had just moved adjacent, and taking that step cost 0.5 health. Until warning
  phase semantics are made clearer, recently marked tiles should be treated as
  suspect even when the current observation labels the marker non-hostile.
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
- A cornered rat can stop fleeing and deal 0.5 damage without a hostile warning
  appearing in the restricted observation. Light makes pursuit safer, but it does
  not make stepping beside a rat safe when the rat has no escape tile.
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
  game HUD changed during the room traversal.
- Entering the floor ladder produced a `decision: "ladder"` state while
  `selectionChoices` remained null. Space still confirmed the visible Descend
  prompt and reached depth 1 successfully.
- Descending from depth 0 to depth 1 restored health from 1.5 to the full 2 without
  consuming the remaining fish. Floor-transition recovery should be represented
  explicitly if it is a stable rule rather than inferred from health deltas.
