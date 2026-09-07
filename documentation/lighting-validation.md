# Lighting validation — 2026-09-06

Measured in the Codex in-app browser on the development macOS laptop, using real
seeded sidepath sandbox generation. Build: `96da76a65a119cc7f978`.
These are local samples, not a hardware-independent performance guarantee.

## Timings

Each row uses three warmup calls and 20 timed synchronous `Room.updateLighting`
calls. Perception is one timed call after the lighting samples. Values are ms.

| Scenario | Seed | Room | Sources | Entities | Lighting median | p95 | Max | Perception |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| Forest | 123 | 52×52 | 32 | 350 | 4.4 | 4.6 | 4.6 | 1.4 |
| Forest | 456 | 52×52 | 19 | 246 | 2.9 | 3.5 | 3.6 | 2.2 |
| Cave | 123 | 90×90 | 13 | 386 | 3.4 | 4.0 | 4.3 | 2.9 |
| Cave | 456 | 90×90 | 9 | 447 | 2.6 | 2.9 | 3.1 | 4.2 |

Seed 123 was generated again after the initial measurements: dimensions, source
counts and entity counts matched in both biomes. This is a limited repeatability
check, not proof of full-run deterministic replay. No lighting approximation or
ray-count reduction was needed on the evidence from these samples. Multiple
lighting updates in one turn, rendering, generation and enemy AI are additional
costs, so these measurements do not establish a frame rate or total turn budget.

## Visibility checks

The rendered forest and cave scenes were inspected in the browser. The dark cave
still displays distant cues, consistent with the intended anonymous-contact mode.
The audit found hostile warning arrows rendered above shade, while the initial
perception filter incorrectly required light for all warnings. The renderer and
perception now share the above-shade warning visibility rule: hostile arrows are
visible independently of light; friendly non-directional X marks require proximity.
Perception still applies range/LOS/layer limits and strips source coordinates/IDs.

The following sweep used fixed entrance positions. Identified counts include
scenery/resources, not only enemies. Anonymous counts represent enemy contacts.

| Scenario / seed | Threshold | Identified | Anonymous | Warnings |
|---|---:|---:|---:|---:|
| Forest / 123 | 4% / 8% / 16% | 10 / 10 / 8 | 0 / 0 / 0 | 0 / 0 / 0 |
| Forest / 456 | 4% / 8% / 16% | 7 / 7 / 6 | 0 / 0 / 0 | 2 / 2 / 2 |
| Cave / 123 | 4% / 8% / 16% | 10 / 9 / 5 | 2 / 2 / 2 | 3 / 3 / 3 |
| Cave / 456 | 4% / 8% / 16% | 8 / 8 / 5 | 7 / 7 / 7 | 4 / 4 / 4 |

Keep range 12 and identification brightness 8% as configurable defaults. The
sample is insufficient to claim an optimal threshold or player-equivalent vision
for all sprites/content. Large-entity partial visibility, more positions and light
equipment, and long-run behavior remain further evaluation targets.

## Reproduce

Serve the repository on port 8000 and open `/agent.html`. Choose Forest sandbox
or Cave sandbox, set seed 123 or 456, click Reset run, then Inspect lighting.
Reset enters the sidepath automatically. The report and diagnostic lighting map
are shown below the game; the full report is `window.lastLightingReport` in the
parent lab. Sandbox replay exports are labeled with their scenario and must not
be treated as ordinary progression runs.

The standard Node suite covers numerical lighting parity, camera independence,
perception filtering, warning visibility, action budgets, inventory/crafting,
scenario metadata and existing replay behavior. It does not assert timing
thresholds, which would be machine-dependent and flaky.
