/* Spatial guidance only. Every returned goal still requires a simulator-verified plan. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AgentHorizonGoals = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const key = (room, x, y, z) => JSON.stringify([room, x, y, z]);
  const goalKey = g => JSON.stringify([g.kind, g.roomId, g.x, g.y, g.z]);
  const traversableExit = t => (t.isDoor || t.exit) &&
    (t.traversal?.unlocked !== false || t.traversal?.unlockableFromHere === true || t.traversal?.unlockFromHere === true);
  function arrivalExitKeys({ view, geometry }) {
    if (!geometry || geometry.schemaVersion !== 1 || geometry.roomId !== view.room.id) throw new Error('Current-room geometry required');
    const { player, room } = view;
    return geometry.tiles.filter(t => t.z === player.z && traversableExit(t) &&
      Math.abs(t.x-player.x)+Math.abs(t.y-player.y) <= 1).map(t => key(room.id,t.x,t.y,player.z));
  }
  function createLocalSelector({ radius = 5, maxExpanded = 2048 } = {}) {
    if (!Number.isSafeInteger(radius) || radius < 1 || radius > 32 ||
        !Number.isSafeInteger(maxExpanded) || maxExpanded < 1 || maxExpanded > 20000) throw new TypeError('Invalid local-goal bounds');
    return function select({ view, geometry, visits = {}, excluded = [] }) {
      if (!geometry || geometry.schemaVersion !== 1 || geometry.roomId !== view.room.id) throw new Error('Current-room geometry required');
      const { player, room } = view;
      const blockedGoals = new Set(excluded), occupied = geometry.occupied || [];
      const tiles = new Map(geometry.tiles.filter(t => t.z === player.z).map(t => [`${t.x},${t.y}`, t]));
      const start = `${player.x},${player.y}`, queue = [{ x: player.x, y: player.y, d: 0, parent: null }];
      const seen = new Set([start]), candidates = []; let cursor = 0;
      // A standing ladder prompt needs a real confirmation goal, not a current-position no-op.
      const standing = tiles.get(start);
      if (standing && traversableExit(standing)) {
        if (view.decision === 'ladder') {
          const goal = { kind: 'exit', roomId: room.id, x: player.x, y: player.y, z: player.z };
          if (!blockedGoals.has(goalKey(goal))) return { goal, label: 'Confirm the current ladder through the planner' };
        } else {
          // Up-ladder arrivals can leave the player standing on the traversal
          // without an active confirmation decision. Move exactly one safe-
          // checked tile off it so the next goal can re-enter, rather than
          // selecting a distant arbitrary room waypoint.
          const neighbor = [[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy]) => tiles.get(`${player.x+dx},${player.y+dy}`))
            .find(t => t && t.solid === false && !traversableExit(t) &&
              !occupied.some(e => e.z === player.z && t.x >= e.x && t.x < e.x+e.width && t.y >= e.y && t.y < e.y+e.height));
          if (neighbor) {
            const goal = { kind: 'position', roomId: room.id, x: neighbor.x, y: neighbor.y, z: player.z };
            if (!blockedGoals.has(goalKey(goal))) return { goal, label: 'Step off the arrival ladder before returning' };
          }
        }
      }
      while (cursor < queue.length && cursor < maxExpanded) {
        const node = queue[cursor++];
        for (const [dx, dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
          const x = node.x + dx, y = node.y + dy, k = `${x},${y}`, t = tiles.get(k);
          if (seen.has(k) || !t) continue; seen.add(k);
          const exit = traversableExit(t);
          if (t.solid !== false && !exit) continue;
          if (occupied.some(e => e.z === player.z && x >= e.x && x < e.x+e.width && y >= e.y && y < e.y+e.height)) continue;
          const next = { x, y, d: node.d + 1, parent: node };
          if (exit) candidates.push({ node: next, exit: true });
          else { queue.push(next); if (next.d <= radius) candidates.push({ node: next, exit: false }); }
          // Never spatially route THROUGH an exit into an unmodelled room.
        }
      }
      const choices = [];
      for (const candidate of candidates) {
        let node = candidate.node;
        while (node.d > radius) node = node.parent;
        const goal = { kind: candidate.exit && candidate.node.d <= radius ? 'exit' : 'position',
          roomId: room.id, x: node.x, y: node.y, z: player.z };
        if (blockedGoals.has(goalKey(goal))) continue;
        choices.push({ goal, exit: candidate.exit, length: candidate.node.d,
          visits: visits[key(room.id, candidate.exit ? candidate.node.x : node.x,
            candidate.exit ? candidate.node.y : node.y, player.z)] || 0, distance: node.d });
      }
      // Geometry already exposes every reachable traversal in this room. Do
      // not wander among floor cells while a door or ladder route is known.
      const traversalChoices = choices.filter(choice => choice.exit);
      const ranked = traversalChoices.length ? traversalChoices : choices;
      ranked.sort((a,b) => a.visits-b.visits || Number(b.exit)-Number(a.exit) ||
        (a.exit && b.exit ? a.length-b.length : b.distance-a.distance) || a.goal.y-b.goal.y || a.goal.x-b.goal.x);
      if (!ranked.length) return null;
      const chosen = ranked[0];
      return { goal: chosen.goal, label: chosen.exit ? 'Local goal toward a reachable traversal' : 'Least-visited local waypoint',
        basis: 'bounded-spatial-guidance-not-safety', expanded: cursor, cutOff: cursor < queue.length };
    };
  }
  return { createLocalSelector, key, goalKey, arrivalExitKeys };
});
