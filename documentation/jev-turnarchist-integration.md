# Jev / Turnarchist integration sketch

## Working conclusion

Jev is promising for Turnarchist, but it should not replace the game engine,
A* planner, immediate-damage preview, or learned policy.  It is a fast
structured decision model: given a state and a closed question, it returns a
choice or score with probabilities and confidence.  That makes it a strong
candidate for *judging a small set of already-valid alternatives*, labeling
interesting training moments, and escalating uncertainty to a human.

The useful architecture is therefore hybrid:

```text
game state -> deterministic feature/action builder -> compact decision packet
                                                   -> Jev atomic judgments
legal action / path / damage <-------------------- code combines results
                                                   -> action, teacher label,
                                                      human request, or log
```

The game remains authoritative.  Every proposed action still goes through the
existing legality checks, the tactical preview, and the normal action processor.
Jev never receives a capability to mutate game state directly.

This is materially different from asking a general chat model to narrate a run.
Jev's design is for typed Choices, Scores, and yes/no probabilities evaluated
against the same state in parallel.  Its confidence is specifically intended to
gate whether software should act or route for review.

Sources: [Introduction](https://docs.typesafe.ai/introduction),
[Choice](https://docs.typesafe.ai/primitives/choice), and
[confidence-gated routing](https://docs.typesafe.ai/patterns/confidence-routing).

## Why this matches the current training problem

The current dungeon policy is a small four-direction model, assisted by a
programmed baseline, a safety shield, and restricted-perception navigation.
The recent bounded fit learned useful local patterns but did not produce a
floor-two breakthrough.  Its protected four-seed evaluation reached 4–9 rooms,
with one death and no depth gain.  The immediate bottleneck is not raw GPU
capacity; it is deciding which examples and which tactical choices actually
teach recovery, progression, and combat flow.

Jev can add semantic supervision where the existing code already supplies the
facts it cannot reliably derive itself:

- Code can enumerate legal actions, apply A*, count threats, calculate incoming
  damage, recognize a room transition, and identify progress conditions.
- Jev can classify *which safe action best serves the immediate goal*, whether a
  state is a good demonstration candidate, and whether a disagreement deserves
  a human correction.
- Human play remains the gold-standard source for hard boss encounters,
  inventory use, and genuinely strategic decisions.

This also respects Jev's documented limits: it is literal, has weaker numeric
reasoning, can lose accuracy in large irrelevant state, and is not a text
generation or multi-step planning model.  Those limitations rule out passing it
the current large numeric observation tensor or asking it to calculate routes
or damage.

Source: [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13).

## Candidate uses, in priority order

## Decision hierarchy: semantic scaffolding over action selection

The most useful Jev questions are not only “which cardinal direction?” They are
the semantic decisions a capable player makes before selecting a tile.  We can
make those decisions explicit, version them, and then let deterministic code and
the learned policy handle their concrete realization.

For each meaningful state, run a small, parallel set of questions against the
same compact packet:

| Layer | Jev question | Code owns | What is recorded |
| --- | --- | --- | --- |
| Motivation | Is the broad purpose `explore`, `progress`, or `prepare`? | Known frontiers, progression routes, room rules, and useful resources | Motivation probabilities and confidence |
| Engagement | Under that motivation, should the agent `fight`, `retreat`, `evade`, or remain out of combat? | Immediate threat and consequence facts | Engagement probabilities and confidence |
| Objective | What should be prioritized: a named enemy, spawner, door, resource, escape tile, or equipment change? | Candidate targets, distances, reachability, and threat facts | Target ID/type and confidence |
| Tactic | What one-turn purpose is best: eliminate threat, dodge, advance safely, create space, collect, heal, or reposition? | Immediate consequences and turn costs | Tactic label and confidence |
| Target priority | If fighting, which named enemy or spawner should be handled first? | Visible actionable target IDs and code-derived combat facts | Target ID and confidence |
| Room intent | Should the agent stay or leave, and what selected motivation justifies leaving? | Room completion, resources, threats, and route availability | Stay/leave choice and confidence |
| Action | Which supplied legal action best realizes that tactic? | Action enumeration, pathfinding, simulation preview, and final validation | Proposed action, executor action, and override reason |
| Think | Is the packet sufficient, should Jev ask a short question chain, or should a stronger reasoner assess the state? | Danger and uncertainty thresholds plus final execution gating | Reasoning depth, confidence, and escalation reason |

This lets Jev say “we are retreating from the giant skeleton; the immediate
objective is the safe south tile; the one-turn tactic is dodge” without needing
to calculate the path or move the player itself.  A learned policy can later be
trained to predict the same mode/objective/tactic labels as auxiliary targets,
or use them as input features in an explicitly assisted policy.

The taxonomy should be treated as a first draft, not a permanent ontology.
Every label must have a written boundary and an `other/uncertain` escape hatch.
For example, `explore` means “reveal an unvisited accessible area without an
identified nearer progression objective,” while `progress` means “move toward
or traverse a known route that advances the current depth or required quest
path.”  A state can support more than one worthwhile goal; the primary-mode
Choice should express which one matters *this turn*, and low confidence should
preserve that ambiguity rather than manufacture a crisp label.

### Weapon selection

Weapon choice is an especially good zero-turn decision to scaffold.  Code can
filter inventory to equippable, usable weapons and describe each candidate in
plain terms: damage, range, pattern, turn cost, first/second-hit combo state,
available effects, whether it can hit the prioritized target, and the immediate
known retaliation after using it.  Jev then chooses among the supplied
weapons—or `keep-current`—for the stated objective.

Do this only at genuine equipment decision points.  Do not ask every turn, do
not let Jev perform arithmetic from raw stats, and require the normal equipment
action to remain legal.  The dual daggers are a useful test case because their
zero-turn first hit and follow-up cost are a gameplay rule that code can state
directly rather than ask the model to infer.

### Enemy priority

Enemy priority should be a Choice over visible, actionable target IDs, not a
free-form name.  Each option should include the enemy's role and code-derived
facts: health, current threat, whether killing/disabling it removes damage this
turn, forward-only behavior, spawn risk, and the first available attack route.

This supports distinctions that matter in Turnarchist:

- kill the enemy whose removal eliminates the largest immediate threat;
- dodge a durable forward-only enemy that cannot be neutralized this turn;
- target a spawner before it overwhelms the room while controlling spawned
  enemies;
- deprioritize a headless skeleton that cannot currently attack, while still
  tracking its recovery deadline in code;
- choose a giant enemy's vulnerable/side-facing interaction rather than treating
  its four-tile footprint as four unrelated targets.

The output is an advisory target preference.  The action builder still decides
whether that target can safely be attacked, approached, pushed into, or should
be temporarily avoided.

### 1. Tactical DAgger referee — best first experiment

At a state where the learned policy, programmed baseline, and/or human
demonstration disagree, build a small candidate set of legal actions.  The
candidate set should normally contain 2–6 actions, not all imagined plans.
For each candidate, code supplies its known immediate consequence:

- action and turn cost;
- whether it is recorded by the action processor;
- immediate known and unknown incoming damage;
- enemies killed, disabled, pushed, or left threatening the player;
- whether it moves through a door, reaches an objective, opens a chest, or
  creates/reduces a spawn risk;
- path distance to the selected deterministic objective when relevant.

Ask several independent questions in one Jev request:

1. **Motivation and engagement** — choose `explore`, `progress`, or `prepare`,
   then choose `fight`, `retreat`, `evade`, or `not-in-combat` beneath it.
2. **Objective and room intent** — choose the named target or destination, then
   decide whether staying or leaving serves the selected motivation. Leaving a
   room requires an explicit supported reason.
3. **Immediate tactic and target priority** — choose the one-turn purpose and,
   during combat, the named enemy or spawner to handle first.
4. **Action choice** — choose the best supplied candidate for that one turn.
5. **Weapon choice** — choose an explicitly supplied weapon or `keep-current`;
   record this as a zero-turn equipment label without executing it.
6. **Think** — act directly, ask a short Jev question chain, or escalate to a
   stronger reasoner when danger or uncertainty makes the atomic packet
   insufficient. Any Think outcome blocks automatic execution.
7. **Baseline adequacy** — whether the programmed-baseline action is acceptable
   for the stated immediate priority.
8. **Human teaching value** — score whether this state should request or retain
   a human demonstration because automated choices are unclear.

Use action choice only when its confidence clears a deliberately high threshold
and code verifies the answer remains legal/safe.  Otherwise, continue with the
baseline or request human intervention.  Store Jev's full probability vector,
confidence, prompt/schema version, candidate descriptions, and final executor
choice with the trajectory.

This is the most direct way to turn Jev into a source of high-value correction
examples without asking it to solve a whole dungeon in one call.

### 2. Demonstration triage and weighting

Human and agent runs contain many routine corridor moves mixed with rare,
valuable events.  Jev can label a bounded subset of recorded decision packets:

- Is this a tactical decision with a meaningful alternative?
- Is the recorded human action an example of threat removal, spacing, safe
  progression, resource preparation, or recovery?
- Is this state ambiguous enough that a training label should be down-weighted
  or manually reviewed?

The result should be *metadata*, not a silent deletion rule.  A short or losing
run can still contain an excellent local decision.  Initial uses should only
rank training samples and create review queues; they should not rewrite actions
or discard raw demonstrations.

### 3. Policy critic and intervention router

For a candidate learned action, code first applies the safety shield.  Jev can
then decide whether the visible situation looks like a low-risk routine state,
a tactical state that needs the programmed baseline, or a state that deserves a
human.  This can drive the existing teaching UI's intervention indicator.

The policy should not be asked “what should I do?” from a raw room dump.  It
should receive a code-filtered choice set and a single, precise question such
as: “Given the listed immediate consequences, which action best prevents damage
this turn while keeping progress toward the unlocked exit?”

### 4. Offline evaluation annotations

For a fixed held-out seed suite, Jev can create interpretable diagnoses:

- whether a death came from an avoidable immediate tactical mistake, an
  unsupported mechanic, or insufficient preparation;
- whether a room entry was reasonable given health, resources, clutter, and
  known threats;
- which category of training scenario would have addressed the failure.

These annotations are useful for selecting the next curriculum slice.  They are
not a substitute for the hard outcome metrics: depth, rooms, health lost,
deaths, legal-action rate, and progress.

### 5. A constrained playable controller — later, not the first milestone

Jev may be able to play early rooms when it is given an explicit symbolic state,
short candidate lists, code-produced A* routes, and deterministic previews.  A
call per meaningful decision would be slow and paid, and it has no automatic
long-term memory or planning loop.  Treat this as an occasional teacher/data
collector or an interactive demonstration mode, not the production agent.

It becomes worthwhile only after the offline referee pilot shows agreement with
human decisions and a meaningful reduction in failure cases.

## Decision packet design

The state passed to Jev should be a small JSON object whose field names carry
the semantics.  Do not pass the 159k-element spatial observation or raw class
names as the primary interface.  Keep the dynamic facts and the question
separate, as the TypeSafe documentation recommends.

Illustrative shape:

```json
{
  "player": {
    "health": "1.0 of 2.0",
    "position": "(8, 11)",
    "equipped_weapon": { "damage": "1", "range": "adjacent" },
    "zero_turn_healing_available": true
  },
  "room_goal": "reach the unlocked east door after preventing immediate damage",
  "threat_summary": [
    "armored zombie A is adjacent, facing the player, has 2 health",
    "zombie B is one tile away and will threaten the player after advancing"
  ],
  "environment": [
    "a pushable barrel is west of the player",
    "the south tile is a safe walkable tile",
    "no other room facts are needed for this decision"
  ],
  "candidates": {
    "move_south": {
      "legal": true,
      "turn_cost": 1,
      "known_damage_this_turn": "0",
      "immediate_effect": "moves out of the armored zombie's forward attack",
      "next_position": "(8, 12)"
    },
    "attack_north": {
      "legal": true,
      "turn_cost": 1,
      "known_damage_this_turn": "1",
      "immediate_effect": "damages armored zombie A but does not remove its threat"
    }
  }
}
```

Numbers used for rules must be calculated and named by code.  For example,
provide `known_damage_this_turn: "1"` and `safe: false`; do not ask Jev to
derive damage from HP, facing, range, and armor.  Likewise, let code choose the
frontier/door objective and provide A* distance; do not ask Jev to infer a route
from the full tile map.

Questions and option descriptions may themselves be structured JSON.  That is
useful for defining boundaries such as “immediate threat neutralized” versus
“damage merely delayed.”  The wording needs regression tests because Jev is
documented to follow literal conditions closely.

Sources: [State](https://docs.typesafe.ai/concepts/state) and
[structured questions](https://docs.typesafe.ai/primitives/advanced).

## Guardrails and non-goals

- Keep the API key on the desktop training service or a loopback-only backend.
  Do not place it in `play.html`, `teach.html`, browser-local storage, exported
  teaching data, or a replay.
- Never let Jev bypass `window.agent.step`, existing action validation, or the
  consequence preview.  Treat every response as an untrusted proposed label or
  action.
- Continue to use deterministic code for counts, damage, reachability, turn
  costs, collision, door rules, and floor-transition confirmation.
- Do not treat a high confidence response as a proof of correctness.  Calibrate
  thresholds on held-out human-labeled states and log all rejected/overridden
  answers.
- Do not mix Jev-assisted labels into player-like evaluation without a distinct
  source label.  Report raw learned policy, programmed baseline, human, and
  Jev-assisted outcomes separately.
- Keep questions atomic.  “Win this room safely while gathering loot and making
  progress” is too compound; split survival, tactical priority, and action
  choice, then combine them in code.
- Avoid a call for every empty safe corridor move.  A* and the programmed
  navigator are cheaper, deterministic, and better suited to that job.

## Proposed proof-of-value pilot

The first integration should be offline and read-only.  It should not alter
play, training, or checkpoints.

1. Export 100–200 decision packets from existing human and programmed runs:
   roughly equal groups of calm navigation, immediate-threat combat, and
   ambiguous/failed states.  Split by seed before sampling.
2. Have a human label a smaller held-out set with the primary mode, objective,
   one-turn tactic, and preferred action among the supplied legal candidates.
3. Run Jev on the training split using a versioned packet schema and six
   atomic questions in a single request.
4. Measure agreement with held-out human labels at each layer, legal-action rate after
   validation, immediate known-damage avoided, confidence calibration, and cost
   per retained example.  Compare it with the programmed baseline and current
   learned policy, not with an imagined ideal player.
5. Inspect every high-confidence disagreement.  Improve packet fields or option
   boundaries before changing thresholds.
6. Only if the referee improves triage or matches humans reliably, add a
   confidence-gated teaching-UI intervention cue.  Only after that should it
   influence DAgger sample weights or propose actions online.

Success for this pilot is not “Jev beats the game.”  Success is a reproducible,
auditable decision source that finds high-value examples or agrees with human
local tactical judgments more often than the existing automatic alternatives.

## Open questions before implementation

- Which TypeSafe account/API key and usage limits should the desktop service
  use?  We should record model name and API pricing/usage at run time rather
  than bake assumptions into the project.
- Should the initial target be early-floor combat only, or include room-entry,
  sewer/fishing, vending, and inventory decisions?  Combat-only gives cleaner
  candidate schemas and faster calibration.
- What confidence/abstention thresholds are acceptable after measurement?  They
  should be learned from the held-out review set, not copied from a generic
  documentation example.
- What is the allowed latency and cost budget per human teaching session and per
  overnight collection job?
- Which observations are legitimately available in the intended mode:
  player-visible, the current full-room diagnostic view, or the privileged
  training inspection mode?  Every packet needs to declare this explicitly.

## Recommendation

Run the offline tactical-referee pilot first.  It has the smallest surface area,
uses Jev where its structured confidence can help, preserves the current game
and training contracts, and gives us an empirical answer before we spend time
building Jev into a live controller.
