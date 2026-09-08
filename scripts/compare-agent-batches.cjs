#!/usr/bin/env node
/* Read-only comparison of exported evaluation reports; does not execute a policy. */
const fs = require('node:fs');
const completed = new Set(['dead', 'budget-incomplete', 'encounter-cleared']);
const metrics = ['decisions', 'turns', 'visitedPositions', 'roomsVisited', 'finalHealth',
  'healthLost', 'maxDecisionsWithoutNewPosition', 'zeroTurnDecisions'];
const finite = value => typeof value === 'number' && Number.isFinite(value);
function runsBySeed(report) {
  if (!report || !Array.isArray(report.runs) || !Number.isInteger(report.decisionsPerSeed) || report.decisionsPerSeed < 1)
    throw new Error('Expected an exported batch report with a positive decision budget');
  const runs = new Map();
  for (const run of report.runs) {
    if (!Number.isInteger(run.seed) || run.seed < 0 || run.seed > 0xffffffff || runs.has(run.seed))
      throw new Error('Run seeds must be unique uint32 values');
    runs.set(run.seed, run);
  }
  return runs;
}
function compareReports(before, after) {
  const previous = runsBySeed(before), current = runsBySeed(after);
  const pairs = [];
  for (const [seed, oldRun] of previous) {
    const newRun = current.get(seed);
    if (!newRun) continue;
    const differences = [];
    if (before.schemaVersion !== after.schemaVersion) differences.push('report-schema');
    if ((before.scenario ?? 'standard') !== (after.scenario ?? 'standard')) differences.push('scenario');
    if ((oldRun.decisionBudget ?? before.decisionsPerSeed) !== (newRun.decisionBudget ?? after.decisionsPerSeed)) differences.push('decision-budget');
    if (!before.backend || before.backend !== after.backend) differences.push('backend');
    const a = oldRun.contract ?? {}, b = newRun.contract ?? {};
    for (const field of ['settingsId', 'observationMode', 'observationSchemaVersion', 'actionSchemaVersion', 'buildId']) {
      if (a[field] == null || b[field] == null || a[field] !== b[field]) differences.push(field);
    }
    const visionA = oldRun.vision, visionB = newRun.vision;
    if (!visionA || !visionB || ['range', 'identificationBrightness'].some(k =>
      !finite(visionA[k]) || visionA[k] !== visionB[k])) differences.push('vision');
    if (!completed.has(oldRun.status) || !completed.has(newRun.status)) differences.push('unfinished-or-error');
    const delta = Object.fromEntries(metrics.map(k => [k,
      finite(oldRun[k]) && finite(newRun[k]) ? newRun[k] - oldRun[k] : null]));
    pairs.push({seed, before: oldRun.status, after: newRun.status,
      controlledComparison: differences.length === 0, differences, delta});
  }
  const controlled = pairs.filter(p => p.controlledComparison);
  return {
    schemaVersion: 1, beforePolicy: before.policy ?? null, afterPolicy: after.policy ?? null,
    pairedSeeds: pairs.length, controlledSeeds: controlled.length,
    onlyBefore: [...previous.keys()].filter(s => !current.has(s)),
    onlyAfter: [...current.keys()].filter(s => !previous.has(s)),
    // Death and budget exhaustion remain distinct; no derived metric claims a win.
    controlledClears: {before: controlled.filter(p => p.before === 'encounter-cleared').length,
      after: controlled.filter(p => p.after === 'encounter-cleared').length},
    controlledDeaths: {before: controlled.filter(p => p.before === 'dead').length,
      after: controlled.filter(p => p.after === 'dead').length},
    pairs,
  };
}
module.exports = {compareReports};
if (require.main === module) {
  try {
    if (process.argv.length !== 4) throw new Error('Usage: node scripts/compare-agent-batches.cjs before.json after.json');
    const reports = process.argv.slice(2).map(path => JSON.parse(fs.readFileSync(path, 'utf8')));
    process.stdout.write(JSON.stringify(compareReports(...reports), null, 2) + '\n');
  } catch (error) {
    process.stderr.write(String(error.message ?? error) + '\n');
    process.exitCode = 1;
  }
}
