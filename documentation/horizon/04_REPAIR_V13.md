# Horizon v1.3: timeout correctness and durable diagnostics

## Evidence and scope

The supplied v1.2 report records full success for standard seeds 1 and 2 and generic `SMOKE_CASE_TIMEOUT` failures for cave seeds 1 and 2. The timed-out cases contain neither their internal phase nor completed assertions. Consequently, the report **does not establish whether cave root restoration succeeded**, and does not identify a game deadlock or an allocator defect.

Inspection of the supplied smoke code and prior runner establishes that the outer page-evaluation race discarded the local report on timeout. The host's timer race also lacked an elapsed-time check after a synchronous operation returned. The new regression demonstrates that a completed over-budget operation could win the old race before its overdue timer ran. Neither observation identifies the actual cave bottleneck.

The uploaded engine and helper remain unchanged. Snapshot schema stays v3; origin/frontier allocator reconstruction, lossless diagnostics, strict fingerprints, gross-health metrics, live-state guards, and the four original game cases are retained. The upstream branch was rechecked at `7ab7de52bf2c19166f600e6dcf3b44536e7ad5fb`; the user report identifies local HEAD `129f49f7854896ffde2ce3fbfb8a0aebdbaa8461`.

## 1. Reusable smoke session

`training/horizon-smoke-session.js` owns cancellation, operation deadlines, cumulative time accounting, immutable progress copies, and finalization. Its operations name reset cycles, root/child capture and restore, action replay, parity directions, expensive guard comparisons, and planner calls. Completed checks and durations survive failures. A late promise cannot authorize another smoke operation or change the finalized returned report. Final synchronous verification is also checked against the case deadline.

`AgentHorizonSmoke.run(live, options)` remains the entry point. Additive options are `onProgress(report)`, `signal`, `caseTimeoutMs` and `operationTimeoutMs`. `status()` returns a detached latest report; `cancel()` cancels the active session. A failed page is retired: reload it rather than retrying against a possibly active underlying engine operation.

The default cumulative case limit remains **180,000 ms**. A new **30,000 ms per smoke operation** bound catches individually stalled direct test calls sooner. The reachable-plan wrapper allows 60,000 ms externally, but the existing plan's 30,000 ms search budget and production host's 3,000 ms restore/step limits remain unchanged. These layers are intentionally distinct. Diagnostics never label a timed-out transition safe or an unfinished room impossible.

Progress includes bounded, read-only runtime flags taken from own data descriptors. It does not invoke `observe`, fingerprinting, getters, `canMove`, or any gameplay action to collect those flags. This probe can report unavailable fields on a future implementation; missing diagnostic fields never change an action's result.

## 2. Host deadlines

`AgentHorizonHost.create` accepts an optional `onOperation(event)` observer. Events contain phase, start/completion/failure, budget and elapsed time, never a snapshot. Observer errors do not suppress engine errors or change search choices.

The host validates elapsed time after an operation resolves, not just when its timeout callback executes. Over-budget restore/step/startup failures carry `PLANNING_OPERATION_TIMEOUT`, a `/simulator/<phase>` path and bounded duration details. Existing disposal and mutex behavior remain authoritative. This is not hard preemption of synchronous JavaScript; the external runner provides the independent watchdog.

## 3. Independent process/browser supervision

`horizon_smoke.py` runs each case in its **own spawned worker and fresh browser profile**. Its async Playwright evaluator has a Python deadline independent of the renderer. The parent has a second process deadline that also covers a stalled browser driver or teardown. Only that worker's owned process tree may be terminated; no existing Chrome, watcher or training process is targeted.

Each progress event is flushed to an external `progress.jsonl`. A normal case result is saved before teardown. Parent timeouts retain the last checkpoint, and preserve an already-saved original failure rather than replacing it with a cleanup error. Malformed/mismatched/nonboolean worker results cannot become accepted cases. Renderer freezes, worker failures, operation timeouts and cumulative timeouts have distinct codes.

On a timeout, call-stack acquisition is best effort and explicitly reports when unavailable. No local-variable values are collected. A stack is not guaranteed: the retained operation and runtime flags remain useful when the debugger cannot respond.

The coordinator still requires exactly the four original cases. It embeds case evidence and whitelisted current engine/host/runner source. It can recover partial journals even if Python dies before writing its final report, without converting worker-only success into supervisor acceptance. Broken-pipe/reset exceptions from retired asset requests no longer flood the local server log; other failures are not hidden.

## 4. Immutable allocator checkpoint cache

`IdGenerator.captureSimulationState()` now reuses one frozen checkpoint while the allocator is unchanged. Every successful `generate`, `reserve`, registry clear and test reset invalidates it. A fully validated restore installs its detached frozen checkpoint. Failed validation/reservation cannot corrupt the previous cache or a previously returned memento.

This changes neither generated IDs nor checkpoint values, sort order, wire format, origin/frontier equality, or collision handling. It does **not** cache fingerprints, player state, world transitions or observations. The regression compares cached reads against independent uncached reads across mixed mutations. The included microbenchmark isolates repeated checkpoint reads only; it is not a game speedup claim or evidence that this was the cave timeout's cause.

## Application surface

Six existing files are updated: `agent-horizon-host.js`, `src/globalStateManager/IdGenerator.ts`, `horizon-smoke.html`, `training/horizon-browser-smoke.js`, `training/horizon_smoke.py`, and `training/horizon-validate.cjs`.

Four files are added: the smoke-session module, `training/tests/horizon-timeouts.test.cjs`, `training/tests/horizon_runner_tests.py`, and `documentation/horizon/04_REPAIR_V13.md`. Existing planning/source tests remain mandatory. The guarded installer never bulk-copies the reference payload.
