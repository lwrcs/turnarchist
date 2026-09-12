# Turnarchist AI player: short operating prompt

Play and record one run in the teaching interface. First read
[agent-player-manual.md](agent-player-manual.md), version 2, then use this checklist.
Keep Game view visible. Decide from the restricted inspector. Route every game
action through recorded teaching controls. After activating human controls, focus
the game board and require **Keyboard active · arrows / WASD**. Use keyboard input
for every supported gameplay action; do not scroll to or click the teaching page's
direction or item-action buttons during routine play. Do not use developer commands
or hidden world data. Start with Starter skills unless the user requests normal
equipment play.

## Every decision

1. Read `teachingInspector()` or `#teaching-inspector-state` with a supported browser
   read method. Check selected run ID, human input ownership, readiness and `busy`.
2. Read menu, room/depth, `(x,y,z)`, health/food, active weapon, full enemy footprints,
   facing, dangerous warnings and spawn/trap hazards. Null means unknown.
3. Use needed permitted zero-turn healing/preparation before advancing danger.
4. Warned now? A verified lethal hit cancels only that enemy's threat. Otherwise
   dodge to a safe tile with an escape route. Attacking does not move you.
5. Side hit will not kill? Plan your NEXT dodge before hitting. Forward-only enemies
   spend a turn turning; giants occupy four tiles and may cover a dodge lane.
6. Safe to explore? Commit to a reachable unexplored exit. Defer the locked
   starting shortcut. Backtrack from dead ends; do not cycle through used doors.
7. Send one keyboard input and read the settled result. Verify acknowledgment and
   effects. Batch only known safe travel with a check after each step. Stop a
   repeated failed input after two attempts and diagnose instead of spamming it.

## Remember

- Up decreases y; left decreases x. Room ID matters at shared door coordinates.
- `dangerous: false` warnings are resolved; spawn markers can still hurt.
- Known damage threshold matters more than enemy name. Finish headless skeletons
  safely before recovery. Do not casually strike cross-shaped gravestones.
- A push/break interaction is not guaranteed movement. Empty solid walls are not routes.
- Fish heals 1; a rod only needs to be carried. Fishing spends turns.
- Arrow keys are the preferred movement/attack input. I toggles inventory; number
  keys 1–9 use slots 0–8. Attacking does not move the player into the enemy tile.
- Read live action costs. No forced per-turn action quota; no generic Space-to-wait.
- Space confirms a verified ladder, vending, or ordinary prompt decision, but can
  use the selected quickbar item in world state. Floor transitions do not heal.
- Escape dismisses vending/interactions but pauses controls in ordinary world state.
  If a keyboard action lacks an acknowledged record, refocus once and retry once.
- Use visible game-surface clicks or drags only for actions without a keyboard
  binding, such as ranged targets or item-on-item operations. Page buttons remain
  a last-resort input fallback; setup, pause, and export controls are still allowed.
- No good continuation? State the exact threat and ask for a small correction.
- A chat model using manual controls is exported as “human” by today's recorder.
  Preserve a companion operator record and keep the run out of automatic human-data
  ingestion pending review. Mark coaching and screenshot-assisted decisions.
- End, export, and verify the file and counts. Save failures need a backup download;
  do not reload an unexported run. Report actual outcome and new experience notes.

Keep scratch state small:

```text
Run / acknowledged action count:
Room, position, health, weapon:
Objective / unfinished exits / deferred shortcut:
Current threats / chosen action / expected result:
Next escape if target survives:
Recent failed moves or loop / coaching ranges:
Last verified export:
```
