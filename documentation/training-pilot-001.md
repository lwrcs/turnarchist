# First learned combat pilot — 2026-09-08

Desktop run `pilot-001`, commit `ab1b4983`, completed 2,048 PPO decisions
and exited successfully. Final/checkpoint files are under
`/home/harrison/turnarchist-training/pilot-001`. A saved checkpoint was reloaded
successfully in a separate process. Windows task launch survived SSH disconnect;
a tmux-only WSL launch did not.

## Initial deterministic evaluation

| Scenario | Outcome | Decisions | Remaining health |
| --- | --- | ---: | ---: |
| Skeleton | cleared | 2 | 2 |
| Zombie | cleared | 1 | 2 |
| Alert armored zombie | budget-incomplete | 64 | 2 |
| Alert giant skeleton (transfer) | budget-incomplete | 64 | 2 |
| Alert giant zombie (transfer) | budget-incomplete | 64 | 2 |

The preliminary random policy died against the skeleton and armored zombie and
cleared the zombie. These were only single episodes. The original evaluation
used a shared random generator for episode seeds and random actions, so the
random/learned seed lists differ after the first episode. Do not present this as
a paired statistical comparison. The follow-up evaluation command fixes this.

The trained policy can finish the simple fixtures. Full health in the tougher
fixtures is not success: all three exhausted the decision budget. This may be
avoidance without combat completion; movement traces in the follow-up evaluation
will distinguish repeated movement from waiting or another failure pattern.
Different seeds still share fixture geometry and do not demonstrate layout
or full-dungeon generalization. Giant cases were not training fixtures.

Next: evaluate random and learned policies with matched seed plans and five
repeats per fixture, including movement traces. Use those results before changing
reward, curriculum or observation encoding. Keep the first pilot checkpoint as
a reference; do not overwrite it with continued training.

## Matched-seed follow-up (50 episodes)

Completed successfully on commit `a681b374`. Each policy ran five episodes per
fixture. Trained clears: skeleton 5/5, zombie 5/5, armored zombie 0/5, giant
skeleton 0/5, giant zombie 0/5. All 15 tough trained episodes were budget-incomplete.
Random clears: 2/5, 4/5, 0/5, 1/5, 0/5 respectively; all other random episodes died.

Every trained action was right. Each tough episode visited 11 positions, then
continued choosing right. This is a fixed-direction shortcut, not evidence that
the policy learned the dodge-and-hit strategy. The easy fixtures' fixed placement
made the shortcut profitable. The next pilot keeps reward and gameplay unchanged
and adds per-episode coordinate-frame rotation (encoder v2), training from scratch
for 8,192 decisions. This specifically tests the directional shortcut, not clutter,
resource use or new layout generalization.
