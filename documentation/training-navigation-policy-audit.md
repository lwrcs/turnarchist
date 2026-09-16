# Navigation policy audit

## Decision

Use the safe current-room A* frontier planner as the navigation controller in
calm rooms. Keep the learned policy for situations the planner deliberately
does not cover, especially combat and rooms with threats. Do not continue
mixing raw DAgger recovery samples into the directional navigation model.

## Evidence

All results use the same fresh held-out seed slice (indices 12–15), a
512-action budget, and the DAgger001 model.

| Policy | Rooms | Positions | Deaths | Terminal health | Rejected actions | Max rejection streak |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| DAgger001 sampled | 3.25 | 36.5 | 2 | 1.125 | 241.75 | 50.75 |
| DAgger002 action-balanced candidate | 3.5 | 29.0 | 2 | 0.25 | 195.0 | 41.25 |
| DAgger mixed candidate | 1.25 | 21.25 | 0 | 1.875 | 1.75 | 0.75 |
| DAgger001 planner-filtered deterministic | 3.5 | 30.0 | 0 | 1.0 | 20.5 | 1.25 |

The action-balanced candidate retained invalid-action loops. The mixed
candidate removed loops by becoming passive. Planner-constrained deterministic
navigation eliminates both failure modes without asking the learned policy to
reconstruct a safe path from high-dimensional observations.

## Next training boundary

Train and evaluate combat, threat response, interaction, and inventory choices
separately. Navigation runs should log the planner controller distinctly so
those actions are not misrepresented as learned policy demonstrations.
