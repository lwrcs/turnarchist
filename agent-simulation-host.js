/* Same-origin hidden-iframe host for privileged deterministic action previews. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AgentSimulationHost = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const copy = value => JSON.parse(JSON.stringify(value));
  const DIRECTIONS = ["up", "right", "down", "left"];
  const within = (promise, milliseconds, message) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), milliseconds);
    Promise.resolve(promise).then(value => { clearTimeout(timeout); resolve(value); }, error => { clearTimeout(timeout); reject(error); });
  });

  // This is intentionally mechanical.  It converts the game's current
  // operator preview into candidate inputs without deciding which one is best.
  // The normal action processor remains the authority on every candidate.
  function candidateActions(operator) {
    const moves = new Map(((operator?.tactical?.moves) ?? [])
      .filter(move => move && typeof move.direction === "string")
      .map(move => [move.direction, move]));
    return DIRECTIONS.flatMap(direction => {
      const preview = moves.get(direction);
      if (!preview) return [];
      const traversal = preview.traversal ?? {};
      // A locked or guarded traversal that cannot be opened from this side is
      // a zero-turn no-op.  Do not offer it as a legal branch: otherwise an
      // agent can choose it forever while the rest of the room advances.
      if (["ladder", "door-transition-or-door-interaction"].includes(preview.resolution) &&
          traversal.unlocked === false && traversal.unlockableFromHere !== true &&
          traversal.unlockFromHere !== true) return [];
      // Empty solid walls are not actions.  A wall torch or any other
      // occupant still receives the real interaction attempt.
      if (preview.resolution === "blocked-or-interact" && !preview.occupantId) return [];
      return [{id: `move_${direction}`, action: {type: "Move", direction}, preview: copy(preview)}];
    });
  }

  function rankOutcome(outcome) {
    const delta = outcome.playerDelta ?? {};
    const lostHealth = Math.max(0, -(delta.health ?? 0));
    const noEffect = !outcome.recorded && !delta.positionChanged &&
      !delta.roomChanged && !delta.depthChanged && !(outcome.enemiesKilled ?? []).length &&
      !(outcome.enemiesDamaged ?? []).length;
    // Lexicographic, not weighted: survival is never exchanged for a small
    // navigation gain.  Damage is a cost, not a ban; a forced half-heart line
    // remains eligible when every candidate has a worse outcome.
    return [
      outcome.transition === "death" ? 1 : 0,
      lostHealth,
      outcome.threatsAfter ?? Number.MAX_SAFE_INTEGER,
      noEffect ? 1 : 0,
      -((outcome.enemiesKilled ?? []).length),
      -((outcome.enemiesDamaged ?? []).length),
      delta.depthChanged ? -1 : 0,
      delta.roomChanged ? -1 : 0,
      delta.positionChanged ? -1 : 0,
    ];
  }

  function compareOutcomes(left, right) {
    const a = rankOutcome(left), b = rankOutcome(right);
    for (let index = 0; index < Math.max(a.length, b.length); index++) {
      if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) - (b[index] ?? 0);
    }
    return String(left.id ?? left.action?.direction).localeCompare(String(right.id ?? right.action?.direction));
  }

  const stateKey = view => `${view?.room?.id ?? 'unknown'}:${view?.player?.x ?? '?'}:${view?.player?.y ?? '?'}:${view?.decision ?? ''}`;
  const traversableGoals = operator => (operator?.pathfinding?.pointsOfInterest ?? [])
    .filter(point => ['door', 'ladder'].includes(point.kind))
    .filter(point => point.traversal?.unlocked !== false || point.traversal?.unlockableFromHere === true ||
      point.traversal?.unlockFromHere === true)
    .filter(point => point.route?.reachable !== false);
  const nearestGoalDistance = (operator, excludedGoalIds = new Set()) => {
    const distances = traversableGoals(operator).filter(point => !excludedGoalIds.has(point.id))
      .map(point => point.route?.steps?.length)
      .filter(Number.isFinite);
    return distances.length ? Math.min(...distances) : null;
  };

  function evaluateOutcome(candidate, context) {
    const outcome = candidate.outcome ?? {};
    const delta = outcome.playerDelta ?? {};
    const roomAfter = outcome.roomAfter ?? {};
    const endState = stateKey({room: roomAfter, player: outcome.playerAfter, decision: outcome.decisionAfter});
    const stateVisits = context.stateVisits.get(endState) ?? 0;
    const roomVisits = context.roomVisits.get(roomAfter.id) ?? 0;
    const noEffect = !outcome.recorded && !delta.positionChanged && !delta.roomChanged && !delta.depthChanged;
    const backtracks = delta.roomChanged && roomAfter.id === context.previousRoomId;
    const discoversRoom = delta.roomChanged && roomVisits === 0;
    const goalDistance = nearestGoalDistance(outcome.operatorAfter,
      context.entryGoalIds.get(roomAfter.id) ?? new Set());
    let utility = 0;
    const reasons = [];
    if (outcome.transition === 'death') reasons.push('fatal');
    if (noEffect) { utility -= 100; reasons.push('no state change'); }
    if ((delta.health ?? 0) < 0) { utility += delta.health * 40; reasons.push(`loses ${Math.abs(delta.health)} health`); }
    if (Number.isFinite(outcome.threatsAfter)) {
      utility -= outcome.threatsAfter * 8;
      if (outcome.threatsAfter) reasons.push(`${outcome.threatsAfter} active threats after action`);
    }
    if (stateVisits) { utility -= stateVisits * 25; reasons.push(`returns to a state visited ${stateVisits} time${stateVisits === 1 ? '' : 's'}`); }
    if (backtracks) { utility -= 60; reasons.push('immediately backtracks to the previous room'); }
    if (discoversRoom) { utility += 50; reasons.push('enters an unvisited room'); }
    else if (delta.roomChanged) { utility -= 15; reasons.push('enters an already visited room'); }
    if (delta.depthChanged) { utility += 100; reasons.push('advances to another floor'); }
    if (goalDistance !== null && !delta.roomChanged) {
      utility -= goalDistance * 3;
      reasons.push(`${goalDistance} safe path step${goalDistance === 1 ? '' : 's'} from the nearest traversal goal`);
    }
    if (delta.positionChanged) utility += 1;
    if (outcome.enemiesKilled?.length) utility += outcome.enemiesKilled.length * 8;
    if (outcome.enemiesDamaged?.length) utility += outcome.enemiesDamaged.length;
    return {fatal: outcome.transition === 'death', utility, reasons, stateVisits, roomVisits,
      backtracks, discoversRoom, nearestTraversalDistance: goalDistance};
  }

  function compareEvaluated(left, right) {
    // Death is the sole unconditional policy priority. All nonfatal tradeoffs
    // are contextual utility so progress can justify manageable damage.
    if (left.evaluation.fatal !== right.evaluation.fatal) return left.evaluation.fatal ? 1 : -1;
    if (left.evaluation.utility !== right.evaluation.utility) return right.evaluation.utility - left.evaluation.utility;
    return String(left.id).localeCompare(String(right.id));
  }

  function summary(action, before, after, result) {
    const damagingWarnings = view => (view.room?.hitWarnings ?? [])
      .filter(warning => warning.dangerous && warning.directionOnly !== true);
    const entities = view => new Map((view.room?.entities ?? [])
      .filter(entity => entity.id)
      .map(entity => [entity.id, entity]));
    const sameRoom = before.room.id === after.room.id;
    const beforeEntities = entities(before), afterEntities = entities(after);
    const beforeEnemies = new Map([...beforeEntities].filter(([, entity]) => entity.isEnemy));
    const afterEnemies = new Map([...afterEntities].filter(([, entity]) => entity.isEnemy));
    // Disappearing from the observation only means "killed" when both frames
    // describe the same room. Door traversal replaces the entire entity list.
    const enemiesKilled = sameRoom
      ? [...beforeEnemies.keys()].filter(id => !afterEnemies.has(id)) : [];
    const enemiesDamaged = sameRoom ? [...afterEnemies.entries()]
      .filter(([id, entity]) => {
        const prior = beforeEnemies.get(id);
        return prior && typeof entity.health === 'number' && typeof prior.health === 'number' && entity.health < prior.health;
      }).map(([id]) => id) : [];
    const objectsDestroyed = sameRoom ? [...beforeEntities.entries()]
      .filter(([id, entity]) => entity.isEnemy !== true && !afterEntities.has(id))
      .map(([id, entity]) => ({id, kind: entity.kind ?? 'object'})) : [];
    return {
      status: result.terminated ? 'terminated' : result.truncated ? 'truncated' : 'settled',
      action: copy(action),
      playerDelta: {
        health: after.player.health - before.player.health,
        mana: after.player.mana - before.player.mana,
        coins: after.player.coins - before.player.coins,
        turnCount: after.player.turnCount - before.player.turnCount,
        positionChanged: before.player.x !== after.player.x || before.player.y !== after.player.y || before.player.z !== after.player.z,
        roomChanged: before.room.id !== after.room.id,
        depthChanged: before.room.depth !== after.room.depth,
      },
      playerAfter: {x: after.player.x, y: after.player.y, z: after.player.z,
        health: after.player.health, mana: after.player.mana, coins: after.player.coins},
      roomAfter: {id: after.room.id, depth: after.room.depth, roomType: after.room.roomType ?? after.room.type ?? null},
      observationAfter: copy(after),
      enemiesKilled,
      enemiesDamaged,
      objectsDestroyed,
      // Direction-only arrows visually annotate a target tile. They are not a
      // second damaging event, so they must not inflate tactical threat counts.
      threatsBefore: damagingWarnings(before).length,
      threatsAfter: damagingWarnings(after).length,
      dangerousWarningsAfter: copy(damagingWarnings(after)),
      decisionAfter: after.decision ?? null,
      transition: result.terminated ? 'death' : before.room.depth !== after.room.depth ? 'floor' :
        before.room.id !== after.room.id ? 'room' : null,
      recorded: result.info?.recorded === true,
      turnDelta: result.info?.turnDelta ?? null,
    };
  }

  function describeOutcome(candidate) {
    const outcome = candidate?.outcome ?? {};
    const delta = outcome.playerDelta ?? {};
    if (outcome.status === 'unsupported') return `unavailable (${String(outcome.error ?? 'unsupported').split('\n')[0]})`;
    const parts = [];
    const preview = candidate?.preview ?? {};
    const traversal = preview.traversal ?? {};
    const threatText = count => `${count} active damaging ${count === 1 ? 'warning' : 'warnings'}`;
    if (outcome.transition === 'death') parts.push('dies');
    else if (outcome.transition === 'floor') parts.push('changes floor');
    else if (outcome.transition === 'room') {
      parts.push('enters another room');
      if (typeof outcome.threatsAfter === 'number' && outcome.threatsAfter > 0) {
        parts.push(`new room has ${threatText(outcome.threatsAfter)}`);
      }
    }
    else if (preview.resolution === 'ladder' && delta.positionChanged) {
      const path = traversal.direction === 'down'
        ? `${traversal.sidePath ? 'sidepath' : 'main-path'} down ladder`
        : 'up ladder';
      parts.push(`moves onto ${path}`);
      if (outcome.decisionAfter === 'ladder') parts.push('confirmation interface available');
    }
    else if (outcome.enemiesKilled?.length) parts.push(`kills ${outcome.enemiesKilled.length} ${outcome.enemiesKilled.length === 1 ? 'enemy' : 'enemies'}`);
    else if (outcome.objectsDestroyed?.length) {
      const kinds = [...new Set(outcome.objectsDestroyed.map(entity => String(entity.kind ?? 'object')
        .replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()))];
      parts.push(`destroys ${kinds.join(', ')} and stays in place`);
    } else if (outcome.enemiesDamaged?.length) parts.push(`hits ${outcome.enemiesDamaged.length} ${outcome.enemiesDamaged.length === 1 ? 'enemy' : 'enemies'} and stays in place`);
    else if (delta.positionChanged) parts.push(`moves to (${outcome.playerAfter?.x}, ${outcome.playerAfter?.y})`);
    else if (!outcome.recorded && traversal.unlocked === false) {
      parts.push(`blocked by locked ${traversal.kind ?? (preview.resolution === 'ladder' ? 'ladder' : 'door')}; no turn advances`);
    }
    else if (outcome.recorded && preview.resolution === 'attack') parts.push('attacks and stays in place');
    else if (outcome.recorded) parts.push('acts and stays in place');
    else parts.push('has no effect');
    if (typeof delta.health === 'number' && delta.health < 0) parts.push(`takes ${Math.abs(delta.health)} health`);
    if (outcome.transition !== 'room' && typeof outcome.threatsAfter === 'number' && outcome.threatsAfter > 0) {
      parts.push(`${threatText(outcome.threatsAfter)} remain`);
    }
    return parts.join('; ');
  }

  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

  class IsolatedSimulator {
    constructor({source, createFrame} = {}) {
      if (typeof source !== 'function') throw new Error('An agent source function is required');
      this.source = source;
      this.createFrame = createFrame ?? (() => {
        const frame = document.createElement('iframe');
        frame.title = 'Hidden deterministic action simulator';
        frame.setAttribute('aria-hidden', 'true');
        frame.tabIndex = -1;
        // Keep this frame paintable. Browsers may pause animation frames for a
        // visibility:hidden iframe, which leaves turn resolution stuck after a
        // restored branch performs a real movement action.
        frame.style.cssText = 'position:fixed;left:-200vw;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
        frame.src = './play.html?agent=1&simulator=1';
        document.body.appendChild(frame);
        return frame;
      });
      this.frame = null;
      this.pending = null;
      this.stateVisits = new Map();
      this.roomVisits = new Map();
      this.lastLiveState = null;
      this.lastLiveRoomId = null;
      this.previousRoomId = null;
      this.entryGoalIds = new Map();
    }

    async agent() {
      if (!this.frame) this.frame = this.createFrame();
      const deadline = Date.now() + 15000;
      while (!this.frame.contentWindow?.agent ||
        typeof this.frame.contentWindow.agent.restoreSimulationSnapshot !== 'function' ||
        typeof this.frame.contentWindow.agent.step !== 'function' ||
        typeof this.frame.contentWindow.agent.observe !== 'function') {
        if (Date.now() >= deadline) throw new Error('Hidden simulator did not finish loading');
        await wait(25);
      }
      const agent = this.frame.contentWindow.agent;
      // A branch preview must settle immediately and independently of the
      // visible lab's speed toggle.
      agent.setFastMode?.(true);
      return agent;
    }

    async simulateFromSnapshot(snapshot, action, liveBefore) {
      const live = this.source();
      const simulator = await this.agent();
      try {
        await within(simulator.restoreSimulationSnapshot(snapshot.serialized), 8000,
          'Simulator restore timed out; branch discarded');
        const before = copy(simulator.observe());
        if (!before?.player || !before?.room) throw new Error('Simulator restore returned an incomplete game observation');
        const result = await within(simulator.step(copy(action)), 8000,
          'Simulator action timed out; branch discarded');
        const after = copy(simulator.observe());
        if (!after?.player || !after?.room) throw new Error('Simulator action returned an incomplete game observation');
        let operatorAfter = null;
        if (typeof simulator.inspectOperator === 'function' && !result.terminated) {
          try { operatorAfter = copy(simulator.inspectOperator()); }
          catch { operatorAfter = null; }
        }
        const liveAfter = copy(live.observe());
        if (JSON.stringify(liveBefore) !== JSON.stringify(liveAfter)) {
          throw new Error('Simulation preview changed the live game; preview discarded');
        }
        return {...summary(action, before, after, result), operatorAfter};
      } catch (error) {
        // AgentEnvironment marks its iframe failed after a timed-out action.
        // Never reuse that poisoned branch for a later preview.
        this.dispose();
        throw error;
      }
    }

    async simulateBranch(snapshot, action, liveBefore) {
      // A timeout intentionally marks AgentEnvironment as failed. Retrying in
      // the same iframe can never recover, so dispose it and retry once from a
      // clean browser context. This keeps a single sick candidate from making
      // every subsequent preview unavailable.
      let firstError = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try { return await this.simulateFromSnapshot(snapshot, action, liveBefore); }
        catch (error) {
          firstError ??= error;
          if (attempt === 0) await wait(50);
        }
      }
      throw firstError;
    }

    async simulate(action) {
      if (this.pending) throw new Error('Another simulation preview is in progress');
      this.pending = (async () => {
        const live = this.source();
        const liveBefore = copy(live.observe());
        const snapshot = live.captureSimulationSnapshot();
        return this.simulateBranch(snapshot, action, liveBefore);
      })();
      try { return await this.pending; }
      finally { this.pending = null; }
    }

    async evaluateCandidates(candidates) {
      if (this.pending) throw new Error('Another simulation preview is in progress');
      this.pending = (async () => {
        const live = this.source();
        const liveBefore = copy(live.observe());
        const liveOperator = typeof live.inspectOperator === 'function' ? copy(live.inspectOperator()) : null;
        const liveState = stateKey(liveBefore);
        if (liveState !== this.lastLiveState) {
          this.stateVisits.set(liveState, (this.stateVisits.get(liveState) ?? 0) + 1);
          this.lastLiveState = liveState;
        }
        if (liveBefore.room?.id !== this.lastLiveRoomId) {
          this.previousRoomId = this.lastLiveRoomId;
          this.lastLiveRoomId = liveBefore.room?.id ?? null;
          if (this.lastLiveRoomId) this.roomVisits.set(this.lastLiveRoomId,
            (this.roomVisits.get(this.lastLiveRoomId) ?? 0) + 1);
          if (this.previousRoomId && this.lastLiveRoomId) {
            const goals = traversableGoals(liveOperator);
            const nearest = goals.reduce((best, point) => {
              const distance = point.route?.steps?.length;
              return Number.isFinite(distance) && (!best || distance < best.distance)
                ? {id:point.id,distance} : best;
            }, null);
            if (nearest) this.entryGoalIds.set(this.lastLiveRoomId, new Set([nearest.id]));
          }
        }
        const snapshot = live.captureSimulationSnapshot();
        const results = [];
        for (const candidate of candidates) {
          try {
            results.push({...candidate, outcome: await this.simulateBranch(snapshot, candidate.action, liveBefore)});
          } catch (error) {
            results.push({...candidate, outcome: {status: 'unsupported', action: copy(candidate.action),
              transition: null, playerDelta: {}, recorded: false,
              error: error && typeof error === 'object' && typeof error.stack === 'string'
                ? error.stack : String(error)}});
          }
        }
        // A branch that did not record the requested action is not a valid
        // simulation outcome.  Never present a silent no-op as a suggestion.
        const context = {stateVisits: this.stateVisits, roomVisits: this.roomVisits,
          previousRoomId: this.previousRoomId, entryGoalIds: this.entryGoalIds};
        results.forEach(result => { result.evaluation = evaluateOutcome(result, context); });
        const settled = results.filter(result => ['settled', 'terminated'].includes(result.outcome.status) && result.outcome.recorded);
        const ranked = settled.sort(compareEvaluated);
        return {schemaVersion: 2, policy:{survivalPriority:'death-only',previousRoomId:this.previousRoomId},
          candidates: results, ranked: ranked.map(result => ({
          id: result.id, action: result.action, preview: result.preview, outcome: result.outcome,
          evaluation: result.evaluation,
        })), selected: ranked[0] ? {id: ranked[0].id, action: ranked[0].action,
          preview: ranked[0].preview, outcome: ranked[0].outcome, evaluation: ranked[0].evaluation} : null};
      })();
      try { return await this.pending; }
      finally { this.pending = null; }
    }

    dispose() {
      this.frame?.remove?.();
      this.frame = null;
    }
  }

  return {IsolatedSimulator, candidateActions, compareOutcomes, rankOutcome, summary, describeOutcome,
    evaluateOutcome, compareEvaluated, nearestGoalDistance};
});
