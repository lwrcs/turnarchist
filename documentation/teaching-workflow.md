# Teaching the agent

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

The board deliberately draws the restricted observation as labeled tiles rather
than the full game's artwork. Click a tile to inspect visible contents. This keeps
unseen information out of the demonstration. It is an initial teaching interface,
not a complete replacement for the normal game's inventory and menus.

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
clearing browser data. After reload, **Saved recordings** can export acknowledged
records; live game continuation is not restored. Current-session export additionally
includes the game's replay. Reload exports contain the recorded observations and
actions, not that separate replay. Mistaken human segments can be excluded while
preserving their original records.

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
handoff. A real browser export was imported successfully against the checkpoint.

The next step is a short human pilot: inspect a few corrections and normal-run
records before collecting dozens of games. Two-game throughput under long browser
runs remains unprofiled. The initial request detector recognizes failed moves and
simple position cycles, not every poor strategy. Richer equipment labels,
automatic curation, request recurrence metrics and database ingestion remain later
work. Existing evaluation data and checkpoints are unchanged.
