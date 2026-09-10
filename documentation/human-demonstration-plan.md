# Human demonstrations and agent takeover — implementation plan

Status: initial implementation delivered in `teach.html`. See
[teaching-workflow.md](teaching-workflow.md) for usage, validation, and current
limits. The sections below retain the broader design; a human pilot, dataset
curation, training and evaluation follow the implementation.

## Outcome

Let the player record ordinary demonstrations, watch a clearly identified policy,
and teach a short recovery sequence when help is useful. The interface must always
answer: who has control, whether inputs are accepted, why the run paused, and
whether the latest actions were saved.

## Existing boundaries

- `agent.html` keeps controls below the game, which must remain comfortable in a
  narrow side panel. Current diagnostic controls overwhelm the primary workflow.
- `agent-lab.js` exposes API actions and programmed baseline batches; it does not
  load a trained PPO checkpoint. Do not present baseline playback as learned play.
- `src/game/agentMode.ts` blocks DOM input in the agent iframe. Simply removing
  this guard could introduce concurrent actions and unrecorded manual behavior.
- `AgentEnvironment.step()` serializes actions and waits for animation settling.
  Training actions must continue through this boundary.
- `agent-batch.js` retains only a short trace and invalidates resume after external
  actions. Interactive teaching needs its own session controller and durable log.
- The learner consumes four directions and restricted perception with two-frame
  history and navigation memory. Game action capabilities are broader than the
  current policy. The existing Python encoder is the compatibility reference.

## Primary layout

Keep the game first. Immediately below it, use a compact sticky control strip
that remains visible while scrolling the controls. Mirror its control-owner text
in a small noninteractive badge inside the game boundary so focus is obvious.
Do not cover the player or warning tiles.

The strip contains a plain-language state, keyboard-focus status, recording
status, and one prominent context-dependent action. Use text and icons alongside
color, a visible focus ring, and a screen-reader live status region.

Below it:

1. Session choice: **Record my play** or **Watch and teach**.
2. Primary controls: pause, single agent step, playback speed, takeover/return,
   finish and save. Show policy name/version in Watch and teach.
3. A contextual help card only when needed, with the reason and last few actions.
4. Human controls while enabled: direction pad and supported inventory/interaction
   controls. Show selected item, effect and known turn cost before use.
5. Collapsed session details: seed, scenario, labels, recorded decisions, game
   turns, save/export, and model identity.
6. Collapsed Diagnostics: lighting, raw JSON, batch testing and smoke checks.
   Mutating diagnostics cannot run during a teaching session.

Example status: **Your turn · keyboard active · recording demonstration**.
Example request: **Help requested: crossed the same doorway repeatedly** with
**Take control**, **Let agent continue**, and **Finish session**.
Example focus loss: **Paused · click the game to activate controls**.

## Control states and handoff

| State | Human game input | Agent actions | Primary action |
|---|---|---|---|
| Ready | Disabled | Disabled | Start demonstration / Start agent |
| Agent playing | Disabled | One at a time | Take control |
| Handoff pending | Disabled | Finish current action only | Taking control… |
| Help requested | Disabled | Paused | Take control |
| Human demonstration | Enabled when focused | Disabled | Pause / Finish |
| Human intervention | Enabled when focused | Disabled | Return to agent |
| Paused / focus lost | Disabled | Disabled | Resume explicitly |
| Finished / error | Disabled | Disabled | Review and export |

A request for help does not silently enable keyboard input. Takeover stops
scheduling new agent actions, waits for any in-flight action to settle, commits
its observation and recording, then enables human input. Returning to the agent
waits for the human action to settle and the recording to save before requesting
a fresh prediction. Explicit acknowledgement is the default; the optional armed
automatic-return mode below must still display and serialize the handoff.

Use one session controller for every action producer: human, policy and helper.
Reject stale predictions using session and decision sequence identifiers. Keep
at most one action in flight; initially ignore key repeat and additional movement
presses during that action. Never replay buffered key presses after a handoff.
Pause on window blur/hidden tab; do not auto-resume on focus return. Typing in a
form must not move the player. Space pauses and Escape closes an active menu or
pauses according to a visible, consistent binding; do not overload Escape to
silently return control to the agent.

Helpers run only under the declared agent-control policy. During human control,
food, equipment, ladders and menus await the human. No forced Wait or arbitrary
limit on actions within one world turn. Keep world turns and action counts
separate. Successful attacks may not move the player; legitimate zero-turn
actions must not be classified as stalls.

## When to ask for help

Manual takeover is always available. Offer **Automatic help: stuck or unable to
act** by default; make **Also ask on uncertain choices** optional.

- Repeated failed actions with unchanged observable state: pause with a concrete
  explanation, not a claim that the level is impossible.
- Repeated doorway cycles or short position cycles without other progress:
  request review. Account for combat, damage, inventory changes and successful
  interactions; ordinary retreat and one return trip are not failures.
- Unsupported choice, invalid/stale prediction, lost inference connection or
  recording failure: pause before further actions with a recovery option.
- Learned-policy probabilities: optional low-confidence cue after calibration,
  displaying “choices are close” rather than “unsafe.” A programmed baseline has
  no learned confidence and must not receive a fabricated confidence percentage.

Use persistence thresholds, a cooldown and dismissal scoped to the current
situation to avoid interrupting every decision. Log detector version, evidence
and request reason. Thresholds are initial test settings, not measures of truth.
Do not infer that every hit warning requires intervention: attacking can remove
the threat before it acts. Policy uncertainty also does not detect every mistake.

## Demonstration experience

Starting Record my play enables human control after reset and focus acknowledgement.
Default to a training seed and a standard floor. The game should feel familiar:
navigation, attacks, inventory, equipment, food and supported menus use normal
game semantics, routed through the serialized API. Avoid making the player type
action JSON to demonstrate a normal run.

Initially implement human UI adapters for all supported public API actions needed
for first-floor play. Audit gaps before calling this a full-play recorder. For
unsupported controls, visibly explain the limitation instead of letting raw game
input bypass recording. Normal `play.html` remains independently regression-tested.

During Watch and teach, takeover lasts until explicitly returned; there is no
fixed five- or thirty-action restriction. Optional labels such as Navigation,
Combat, Recovery, or Other default from the request and can be edited afterward.
Mark or exclude a mistaken teaching segment without rewriting the original log.
Record entire runs, including failures, and retain the preceding agent history.
Death or completion ends a session and presents saved status plus export/restart.

## Recording and training contract

Use append-only, versioned records with session ID and monotonic decision IDs.
For each action retain restricted pre/post observations, action request/result,
controller source, recorded flag, actual world-turn delta, terminal state and
intervention boundaries. Preserve the replay separately for reproduction.

Session metadata includes seed/scenario, game/build/action/perception/encoder
versions, vision settings, checkpoint hash or baseline version, human/control
mode, helper configuration and timestamps. Preserve unsuccessful attempts for
diagnosis; do not automatically treat them as expert labels.

Keep human-only UI/diagnostic information out of model inputs. Show the gameplay
view using the agent's perception restrictions where feasible. If the human can
see more than the agent (for example zoomed-out distant tiles), flag that segment
as privileged-context data and exclude it from ordinary imitation by default.
If a player supplies reasoning labels, they remain annotation, not hidden input.

Persist locally in IndexedDB in small acknowledged transactions. Track recording
on/off separately from input ownership. A failed save pauses before another
action; allow export of the retained buffer or an explicit stop-recording choice.
Do not promise crash-safe recording of a step before its save acknowledgement.
After reload recover saved data for review/export; do not claim a live game can
resume until deterministic reconstruction and history checks succeed.

Start with local export/import. Database ingestion is a later adapter using an
explicit session upload control, schema validation, size limits and duplicate-safe
IDs. Never reuse ordinary player-stat uploads implicitly for training recordings.

The Python importer validates and reconstructs the same history, rotation and
memory used by the policy. Test exact encoder parity on recorded fixtures before
training. Record all supported game actions, but only compatible human decisions
become four-direction labels initially. Preserve zero-turn interactions in the
history; they can change the correct next movement. Do not silently map unsupported
actions to directions or drop history needed for a label.

Reserve evaluation seeds at session creation and again at import. Arbitrary human
seeds get a registered training designation and collision checks against actual
generated evaluation seeds. An intervened evaluation run is labeled assisted and
cannot contribute to unassisted scores. Split whole runs/episodes for validation;
nearby frames or interventions from the same run must not leak across that split.

## Learned-policy connection

Introduce a policy adapter shared by baseline and learned playback. Prefer a
local CPU inference service for the small current model, using the existing Python
encoder rather than a second handwritten browser encoder. The Mac hosts the UI;
confirm its isolated Python runtime before implementation. Desktop inference via
the existing SSH connection is a fallback, not a prerequisite for recording.

The service loads an explicitly selected compatible checkpoint and handles only
restricted observations plus required action history. It returns directions,
probabilities and matching decision IDs. It never owns the game loop. Feed it
human/helper transitions too so state is correct after takeover. Test feature
history boundaries against training before enabling trained playback. A connection
failure pauses; do not silently substitute the baseline. Bind locally and restrict
accepted origins/session requests. Display the active policy identity at all times.

## Delivery and acceptance

1. Build session state/input arbitration, clear UI, manual demonstration mode and
   local recording/export. Verify narrow panel, focus, handoff and save failures.
2. Add watched baseline playback, manual interventions and concrete stall requests.
   Label the baseline clearly; validate capture with a short real human session.
3. Add compatible learned playback and Python importer parity. Test delayed/stale
   inference, human-history synchronization, rotation and train/evaluation isolation.
4. Run a small demonstration/intervention pilot. Inspect labels and coverage,
   train a preserved candidate with original navigation/combat rehearsal, then
   evaluate unassisted gameplay and combat retention before any promotion.

Acceptance tests must cover double input, takeover during an in-flight step,
blur/refocus, held keys, inventory focus, zero-turn sequences, attack-without-move,
giant enemies, death, reset, disconnected inference, quota failure and reload.
Verify no movement occurs merely by enabling or disabling control. Verify local
exports reproduce observation/action order and do not lose human/helper provenance.
UI verification includes a roughly 360px side panel, keyboard-only use, legible
status without color, and all primary controls below the game. Check ordinary
play and batch evaluation separately. No need to ask the user for dozens of runs
before this pipeline has passed a short end-to-end recording/import test.

## Human play protocol and curriculum constraints

Offer two named presets and store the chosen protocol in each session:

| Preset | Human guidance | Immediate training use |
|---|---|---|
| Starter skills | Starting dagger and starting loadout; ordinary food/potions allowed; normal exploration and retreat | Compatible movement/combat examples, with non-directional actions retained as context |
| Normal first-floor run | Play normally, including sensible upgrades, resource gathering, retreat and optional routes | Full recording; import only supported observation/action subsets until richer policy support exists |

Starter skills is a controlled curriculum, not a restriction on all future
training. In normal play, do not pass up a useful weapon merely to preserve the
dataset. Likewise do not deliberately starve or avoid food: resource management
and choosing to heal can make otherwise similar situations call for different
actions. The present learner cannot yet learn inventory choices directly.

For exploration, ask the player to aim to clear the floor sustainably: search
when equipment/health/resources justify it, retreat when warranted, and proceed
when prepared. No required percentage of explored tiles or rooms, no mandatory
exhaustive sweep, and no boss speedrun requirement. Include some direct clears
and some deliberate preparation/recovery runs with declared intent. Do not
require intentionally bad decisions or successful outcomes on every seed.
Fishing or repeated resource gathering remains valid play, but label extended
preparation segments and cap their sampling contribution so they do not dominate
the movement dataset. Sampling caps must never become in-game action limits.

Start with a small end-to-end pilot (a few runs in each preset), inspect data
quality and scenario coverage, then decide where more human time is useful.
Dozens of runs are not a prerequisite and do not guarantee success. Capture good
early segments from deaths as well as completed floors; completion alone is not
proof every action is a suitable imitation label.

Concrete current encoding limitation: `combat_pilot.encode()` supplies health,
minimum weapon damage, an adjacent-cardinal pattern indicator and one turn-cost
scalar alongside its tile/entity/warning grid. It does not encode every weapon,
armor, shield, inventory, hunger or combo property exposed by the game. A false
adjacent-cardinal flag is not a full representation of an alternative pattern.
Do not claim that merely recording a weapon means the present policy can use it.

Record effective equipment/status and full restricted observations, derive an
encoder-coverage classification, and exclude or quarantine labels whose required
mechanics are absent. Preserve those records for a future versioned encoder/action
space. History after manual healing/equipping must still be reconstructed before
using later compatible actions. A teacher's intent label is for curation unless
the learner is explicitly given a corresponding input; avoid silently mixing
incompatible goals at observationally indistinguishable states.

During corrections, aim for the shortest *sufficient* sequence, not an arbitrary
number of moves. One dodge can be enough; crafting/healing/repositioning can require
many actions. Record whether success depended on unsupported human capabilities.
Do not score that as autonomous use of those capabilities.

## Multiple game agents and intervention queue

This means concurrent game-policy sessions, not additional coding assistants.
Implement independent session workers behind the same policy/session interface.
Start with two active runs and expose up to four only after profiling the target
machine. Do not equate the desktop's eight headless training workers with eight
responsive browser views. Limit concurrency and rendering separately.

Keep one focused game at playable size. Below its status strip, show compact
agent cards and a help queue: run ID, policy, seed, health, progress, state, request
reason and time waiting. Collapse cards vertically in a narrow panel; do not
shrink four games into unreadable quadrants. Selecting a card changes the viewed
session, not input ownership. Taking control explicitly grants the input token.

Each run has isolated game state, policy memory, random state, recorder, pending
request and action sequence. Shared inference may batch requests but must route
responses by session/decision identity. A stale response cannot move a different
run. Only one global human-input token exists; switching away from an intervention
pauses that run and clears pending key state. It does not silently resume its agent.

A help request pauses that game at the settled action boundary. Other agents may
continue until they request help. All waiting games remain frozen with no timeout
death or auto-restart. Order requests by time waiting with clearly justified
categories; the player may select any request. Since waiting games are paused,
apparent danger is not a real-time emergency that should steal keyboard focus.
Provide Pause all, Resume eligible agents, and Finish sessions. Bound the queue
and stop starting new runs when every slot is waiting. Notify once per new request,
with optional sound; avoid repeated alerts for the same pause.

Rendering/inactive-tab behavior must be tested: hidden iframes may throttle the
current animation-settled simulation. Prefer independently owned browser pages or
workers with a focused view attachment where supported, and report actual measured
concurrency. A disconnected worker pauses and preserves its acknowledged log.
App-wide blur defaults to Pause all; any unattended background-run mode needs an
explicit setting and clear indication. Data from correlated runs/seeds stays in
the same split, and aggregation must preserve per-run human/helper provenance.

## Short corrections and suggested handback

During human intervention the policy can propose its next action after each
settled human decision without executing it. A shadow prediction must not add a
second observation/history tick or mutate baseline memory merely because the UI
refreshes. Show the proposed action and a **Ready to try again** cue when evidence
supports a handback. Human actions remain in control until the chosen return mode
authorizes transfer.

Readiness considers the original request reason, current action support, recent
failure/cycle history and observed progress. A movement proposal that repeats a
known no-effect action is not ready merely because it is confident. Combat readiness
may include removing or avoiding the relevant threat; it does not require all
enemies to be gone. Health/equipment changes can be meaningful recovery even if
position did not change. Confidence is auxiliary and uncalibrated initially.

Default controls are **Try agent again** and **Keep teaching**. Also offer an
explicit per-session **Return automatically when ready** option. When armed,
show a brief cancellable handoff notice, stop accepting new queued human moves
at the transfer boundary, and switch the owner badge before executing an agent
action. A readiness cue must never take control halfway through a human action.
Use different request/return thresholds and a post-return observation window to
prevent rapid control flapping; do not invent thresholds before testing them.

After return, watch the first few autonomous decisions (initial test setting: five)
for recurrence, while keeping Take control available. If the failure recurs, pause
and reopen the same recovery request with the previous correction visible. Keep
attempts linked rather than claiming several separate successful recoveries. This
is a supervised trial of the next decisions, not proof that the policy knows a
safe path or an opportunity to explore unseen future states behind the scenes.

Measure human actions per resolved request, recurrence over the following agent
decisions, independent progress, damage/deaths and requests per episode. Leaving
two loop positions alone does not count as durable recovery. Do not optimize short
interventions in isolation: that could encourage premature handbacks or suppressed
requests. Give the human an optional **Needed a longer plan** label for sequences
where the local observation is inadequate.

Related primary research: human-controlled intervention is studied in
[HG-DAgger](https://arxiv.org/abs/1810.02890); learned request/return mechanisms and
human supervision cost are explored in
[ThriftyDAgger](https://users.cs.utah.edu/~dsbrown/readings/thrifty_dagger.pdf).
These motivate the design, but their results do not establish suitable thresholds
or expected gains for this game.

Delivery extension: implement and validate one complete human/agent session first,
then add the multi-session queue and exclusive input token. Add suggested handback
before optional automatic handback. Test simultaneous requests, focus switching
mid-action, per-run recorder failures and isolation of histories before increasing
concurrency. Keep demonstration presets and training eligibility visible from the
first release so human recordings have useful provenance immediately.
