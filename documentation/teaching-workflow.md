# Teaching the agent

Current regression build: perception schema v8 and dungeon encoder v9 add wider
visibility, contact tracking, facing, neighboring rooms and spawn hazards.
Earlier checkpoints/datasets are deliberately
incompatible. Use the programmed baseline or demonstrations until a v9 checkpoint
is trained and evaluated. The existing checkpoint and inference process have not
been overwritten or silently relabeled.

Known solid walls are excluded from teaching movement choices for adjacent-cardinal
weapons. Unknown terrain, doors, attackable occupants and longer-range weapons remain
eligible. A learned prediction into a masked wall uses its highest-probability eligible
direction; this is an execution filter, not evidence that the policy learned the rule.
Recoverable API rejections are saved with `source: rejected`, synchronize observation
history, and request help instead of destroying the session. They are not human labels.

Open `http://localhost:8000/teach.html` while the local game server is running.
The existing agent lab links to this page. Ordinary play remains separate.

## Record a demonstration

Choose **Record my play**, a seed, and a protocol, then start. Click **Activate
human controls**. The badge says when controls are enabled. Arrows/WASD work only
while the board is focused; the direction buttons also work. Inputs are ignored
while an action is settling or saving. Inventory and interaction controls appear
below the board. There is no automatic food use during human control.

- **Starter skills:** keep the starting dagger and loadout. Eat, explore, prepare
  and retreat as needed. No exploration quota or requirement to rush the boss.
- **Normal first-floor run:** play normally and use upgrades. Records are retained,
  but this first importer requires manual review of normal-run equipment coverage.

The default Game view shows the real game's artwork. Switch to Agent grid to
inspect the restricted observations used by the policy. Switching views preserves
the live run. Humans can see more context in Game view; each human action records
which view was used, while policy observations stay restricted in both views.
Movement keys, number keys 1–9, item clicks, item-on-item use, slot drags, drops,
visible menu choices, cardinal world clicks, ranged shots and spell targets go
through the recorder. Opening inventory is presentation state. In Agent grid,
click a tile to inspect its visible contents.

**Super fast** under Agent pace removes the between-action delay and the ordinary
input cooldown and the enemy-turn presentation delay. Enemy turns still execute;
animation and transition readiness still apply, and
each action is saved before another is executed. Taking control or pausing restores
normal input timing. The diagnostic lab also has a Super fast checkbox.

Identified contacts stay recognized when they return to darkness. A dashed outline
marks remembered identities; current health and facing become unknown. Previously
illuminated terrain is remembered separately for each room. Fresh light updates
that knowledge, without memory exposing current hidden trap phases or door locks.
Memory resets with each new run and does not create contacts outside the view.
Collected-item animations are excluded from ground items immediately on pickup.

Shared traits include pushable, chain-pushable, breakable, forward-only attacks
(turn before attacking in a new direction), and boss status. Item categories include
equippable, usable, use-on, weapon, armor and shield. Depth, environment and room
type are recorded. These categories, context and memory flags reach the learner's
features; they do not prescribe goals such as collecting a particular reward.

The observation covers a fixed 25×19 tile window. Dim entities and items remain
unidentified contacts; doors remain recognizable without revealing their type or
lock state. Identification uses a lower brightness threshold (0.04) with a small
neighbor-light contribution to approximate the renderer's blurred shade edges.
This changes perception only, not gameplay lighting or light-sensitive enemies.
Previously entered rooms on the same path are included where they intersect the
window; unexplored rooms are not disclosed.

Contacts receive stable session IDs. Identified enemies show facing, and recorded
movement tracks displacement since their previous observation. Spawners expose
their enemy type when identified. Spawn markers are visible nonsolid hazards with
0.5 damage and also contribute danger warnings. Click a tile for these details.

Room identity is retained even when linked doors share world coordinates. Each
known connection records its source room/tile, the linked door tile, and the actual
arrival tile in the destination room. Training features include that arrival
offset and rotate it along with facing and observed movement.

## Watch, correct, return

Choose **Watch and teach** and either the explicitly labeled programmed baseline
or a learned checkpoint. Start paused, then use **Try agent again** or **One agent
step**. **Take control** waits for the current action to finish before accepting
human actions. There is no fixed length for a correction.

After a correction, a shadow prediction may offer a **Ready to try again** cue.
It does not execute a move. Manual return is the default. Optional automatic return
uses a cancellable two-second notice. Readiness and probability thresholds are
initial heuristics, not calibrated safety estimates. A hit warning under the
player suppresses the readiness suggestion conservatively; it does not prohibit
the human from choosing a lethal attack or manually returning control.

Two independent games can be active. Cards select the viewed game; selecting a
card does not grant input ownership. Help requests pause that game. Only one game
accepts human input, and switching away pauses the intervention. Losing window
focus pauses all games, with explicit resume required. Failed inference or saving
also stops the affected run. No fallback policy is silently substituted.

## Saving and training

Actions save locally in this browser's IndexedDB. Export current sessions before
clearing browser data. Choose the repository's `training/data/teaching` directory
with **Choose data folder**, then **Save current to data folder** writes the JSON
there directly. Browser security requires that one explicit folder choice; the
browser normally returns to the same folder on later visits. **Download current
copy** remains available as a backup. After reload, **Saved recordings** can export
acknowledged records; live game continuation is not restored. Current-session
export additionally includes the game's replay. Reload exports contain the recorded
observations and actions, not that separate replay. Mistaken human segments can be
excluded while preserving their original records.

Recordings stop at 10,000 total API actions, independently of world turns. There
is no per-turn action cap. Start another recording after this session budget.
No recording is uploaded or automatically added to training.

Using the existing training Python environment:

```sh
python training/teaching_data.py recording.json \
  --checkpoint-manifest /path/to/checkpoint/manifest.json \
  --out /path/to/new-demonstration-dataset
```

The importer checks observation/build compatibility, sequence continuity,
evaluation-seed exclusions, equipment consistency and helper boundaries. Only
eligible human directional actions become labels. Other actions remain in the
history; excluded segments and terminal actions do not become labels. Inspect the
import report before training. Keep whole sessions and seeds together when splitting
training/validation. This release does not implement automatic dataset balancing,
recovery-success scoring, model training or promotion.

Every export names the session's recording mode, policy type and exact policy
identity in `meta`. Each action has an explicit `actor` (`human`, `model`, or
`helper`), its recorder `source`, and the originally requested source if the game
rejected it. Model actions retain the proposed action and probability vector before
any legal-action masking; human corrections retain the immediately preceding model
suggestion when one was available. This provenance is descriptive metadata and is
validated separately from the action labels used for imitation.

## Learned inference

The inference service uses the existing Python encoder and a specified checkpoint:

```sh
python training/teaching_service.py --model /path/to/checkpoint/final.zip \
  --token-file /path/to/new-private-token-file
```

It binds to loopback port 8766, requires the generated token and accepts only the
local game's origins. For the desktop setup, forward that port through the existing
verified SSH connection. Enter the local URL and token in the page, or place them
in the ignored `.teaching-local.json` file as `url` and `token`. Keep the game server
bound to loopback when using that local config. The service uses CPU inference and
does not start training. Keep the connection alive while watching learned play.
It supports 16 retained sessions with two-hour idle expiry; restart the service
and reconnect with a fresh token if that limit is reached.

## Validation and remaining pilot

Automated checks cover input ownership, delayed predictions, save failure,
takeover during an action, session isolation, baseline shadow state, zero-turn
helpers, rotation and Python feature-history parity. Browser checks cover a narrow
390px layout, two games, recording export and learned agent → human → agent
handoff in the earlier compatible build. Current v8/v9 checks cover recording,
exports, ordinary play, vector rotation, contact identity, neighboring rooms and
spawn damage. A controlled main-floor ladder fixture confirms the menu transition
from depth 0 to depth 1 and a subsequent movement action; this is not an autonomous
floor-clear result. Learned handoff requires a newly trained compatible checkpoint.

The next step is a short human pilot: inspect a few corrections and normal-run
records before collecting dozens of games. Two-game throughput under long browser
runs remains unprofiled. The initial request detector recognizes failed moves and
simple position cycles, not every poor strategy. Richer equipment labels,
automatic curation, request recurrence metrics and database ingestion remain later
work. Existing evaluation data and checkpoints are unchanged.
