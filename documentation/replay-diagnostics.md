# Reading replay diagnostics

The game publishes completed and failed reports into the hidden JSON script
`#replay-diagnostics`. Browser tools can read this DOM surface even when their
evaluation context cannot access page JavaScript globals:

```js
JSON.parse(document.querySelector('#replay-diagnostics').textContent)
```

The envelope has `schemaVersion: 1` and `report` (null until a report exists).
The latest report is retained in sessionStorage across reloads in the same tab.
A retained report may describe an earlier run; check `finishedAt` and `seed`.
The page also exposes `window.lastReplayReport` and logs the full JSON report.

Reports contain completion/failure status, failure reason, divergence details,
the last 20 executed/attempted steps with before/after context, and nearby
recorded actions. `recordedContext` begins at zero-based index
`max(0, haltedAtStep - 20)` for failed runs. Timing-sensitive fields remain
diagnostic evidence, not additional equality checks. Existing recordings cannot
retroactively supply room/depth or other fields they did not capture.

Action exceptions and transition/cooldown timeouts stop with a failed report.
Divergence no longer sets player health to zero. Startup without a player and
manual cancellation do not currently publish a report.

Finished and failed playback remains in replay mode (saving and live input stay
blocked), with recording disabled and game updates stopped. The replay menu offers
Replay Again or New Game. Resume/Escape/outside clicks cannot resume
a finished run. `ReplayManager.isFinished()` distinguishes this terminal state
from active playback; `isReplaying()` remains true until leaving the replay.

`spellDiagnostics` includes up to 300 live and 300 replay lifecycle events, tagged
with seed, step, timestamp, sequence, room, turn state, health, death/animation
state and equipped weapon. Cast IDs link book checks and spell effects; beam IDs
link beam creation (which includes its cast ID), arrival and deferred callbacks.
Inspect rejected casts, mana, pattern resolution and tick-before/tick-after when
turn counts drift after a cast. Events also appear as `[spell]` JSON console logs.
The trace is diagnostic only; it does not alter spell execution or validation.

Save/load evidence is available independently of replay completion:

```js
JSON.parse(document.querySelector('#save-diagnostics').textContent)
```

Its `events` list retains the last 20 snapshots in sessionStorage across refreshes.
`save-encoded` captures the source inventory and serialized save inventory;
`load-before`/`load-after` compare saved data with the reconstructed game. Legacy
loads are tagged separately. `unresolved-spell-source` captures the inventory at
cast-source failure. Inspect item runtime types, spell IDs, active/pending spells,
equipped and targeting slots, cooldown/durability, and saved/restored replay seeds,
action counts and tails. `save-encoded` means encoding succeeded, not that the
subsequent storage write succeeded. Snapshots are from the cookie/Electron save
and load entry points; developer-only direct codec calls are not included.
