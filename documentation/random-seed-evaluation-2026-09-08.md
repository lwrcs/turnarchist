# Random-seed baseline evaluation — September 8, 2026

Eight unscreened random 31-bit seeds, run with four independent browser lab
instances. Policy `explore-combat-v22`, game build `64e97d177a3d948b4c36`, standard
scenario, perception schema 6, action schema 3. All reports used the same settings
and policy/build. No policy or gameplay changes were made during the experiment.

Each run initially received 1,000 decisions. Seed 853138141 reached that limit
alive, at 0.5 health, with 20 rooms visited and no current stall; it continued
without resetting under a 3,000-decision cumulative cap and died at 1,041.
Seed 1226147441 reached 1,000 alive but had already spent 443 decisions without
reaching a new tile, so it was retained as a stall rather than extended. Full
batch recordings were exported through the lab, including the extension.

## Results

| Seed | Decisions | World turns | Final floor index | Rooms visited | Result | Observed final context |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 2146669110 | 323 | 303 | 0 | 6 | Died | Spawner and crabs in final trace |
| 1575837997 | 471 | 456 | 0 | 5 | Died | Spawner and mixed crowd in final trace |
| 852752276 | 984 | 939 | 1 | 16 | Died | Spawner and crabs in final room |
| 853138141 | 1041 | 987 | 1 | 20 | Died | Mixed wizard/frog crowd in final trace |
| 419481281 | 704 | 684 | 0 | 6 | Died | Spawner in final room |
| 2130021310 | 796 | 776 | 0 | 6 | Died | Giant zombie in final room |
| 396919171 | 616 | 591 | 0 | 8 | Died | Giant skeleton and skeleton in final room |
| 1226147441 | 1000 | 978 | 0 | 7 | Alive, stalled | Navigation cycle around pushables and a crab |

Total: 5,935 decisions and 5,714 world turns.
Seven deaths, one budget-limited stalled survivor, no evaluation errors.
The median decision count among the seven deaths was 704.
Two runs ended on floor index 1; six ended on floor index 0. The best progressing
run visited 20 rooms and 654 distinct positions before dying at decision 1,041.

Floor values are final diagnostic room depths, not lifetime maximum-depth
measurements or proof of a particular boss kill. Floor 0 is the opening floor.
Rooms visited are unique room IDs within each run. Free actions explain the
difference between decisions and world turns. Enemy presence in a final room
does not by itself establish the exact source of the killing hit.

## Findings

- Clean duel success does not yet transfer reliably to natural crowds. Spawners
  and crabs recur in the final scenes of four deaths. Two other deaths occurred
  in giant skeleton/zombie rooms; the floor-1 extension ended amid wizards and
  other enemies. These are useful regression seeds, not a statistically robust
  estimate of win rate from eight runs.
- The stalled run is a survival false positive. Its last trace cycles between
  (12,6), (12,7), and (12,8), alternating route goals (10,5) and (9,6). A crab at
  (10,6) casts warnings onto nearby pushable crates/barrels. The player remains
  at full health but makes no exploration progress for 443 decisions.
- The other seven runs had maximum no-new-position streaks of 19–48 decisions.
  Combat, rather than prolonged navigation cycling, was their visible endpoint.
- Future evaluation should retain both the combat failures and the full-health
  loop. Report progress separately from survival, and keep resource-demanding
  armored/clutter stress tests separate from basic duel expectations.

[Machine-readable measurements](random-seed-evaluation-2026-09-08.csv).
