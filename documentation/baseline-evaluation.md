# First programmed-policy evaluation

Local browser run, 2026-09-06 (reports use UTC timestamps). Game build
`5e2e66eb493f522aca8a`; final policy `explore-combat-v2`. Standard seeded starts,
40 decisions per seed, restricted perception schema 3, range 12, identification
brightness 8%, developer mode off. This is an integration evaluation, not a
measurement of learned-agent quality or full-run success.

| Seed | Outcome | Decisions | Game turns | Visited positions | Final health |
|---|---|---:|---:|---:|---:|
| 123 | Budget incomplete | 40 | 36 | 21 | 2 |
| 456 | Budget incomplete | 40 | 37 | 25 | 2 |
| 789 | Budget incomplete | 40 | 36 | 21 | 2 |

The initial v1 policy repeatedly crossed a doorway back and forth. These are
valid free transitions, so an action counter alone concealed the lack of useful
exploration: v1 produced 16/9/18 turns and 17/10/19 visited positions respectively.
The trace showed alternating positions across the door. V2 penalizes remembered
passage crossings and the final traces show continued movement through rooms.
The comparison uses the same small seeds, so it is a targeted regression check,
not a held-out generalization claim.

No run died within this short budget; none is labeled a win. Combat, crafting,
long-range planning and progression success remain to be evaluated. The baseline
is a deterministic heuristic, not a trained network. Replays are diagnostic
artifacts; complete replay playback parity has not been established for every
inventory action or environment change.

## Reproduce and inspect

Open `http://localhost:8000/agent.html`, leave Batch seeds at `123,456,789` and
Decisions per seed at `40`, then Run baseline batch. The result shows outcomes
and the last five decisions. Export batch provides JSON with the last 32
restricted before/after snapshots per run, replay envelopes and policy source.
The browser must remain open while evaluation runs. Stop batch takes effect after
the current action settles. Per-seed budget truncations are incomplete evaluations;
execution errors stop the batch so late callbacks cannot contaminate a reset.

Validation: all 69 Node tests passed; TypeScript checking with skipLibCheck and
the browser bundle build passed. Runner tests cover restricted inputs, warning
avoidance, healing/combat decisions, doorway loops, cancellation, death versus
budget exhaustion, trace bounds, and error handling between seeds.
