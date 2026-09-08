const {test}=require('node:test'),assert=require('node:assert/strict');
const {compareReports}=require('../scripts/compare-agent-batches.cjs');
function report(){return {policy:'one',backend:'browser',decisionsPerSeed:500,runs:[{seed:123,status:'budget-incomplete',
  visitedPositions:40,contract:{buildId:'build',settingsId:'settings',observationMode:'player-perception',
  observationSchemaVersion:5,actionSchemaVersion:3},vision:{range:12,identificationBrightness:.08}}]};}
test('pairs equal-seed runs and keeps missing optional metrics unknown',()=>{
  const a=report(),b=report();b.policy='two';b.runs[0].visitedPositions=100;
  const c=compareReports(a,b);assert.equal(c.controlledSeeds,1);assert.equal(c.pairs[0].delta.visitedPositions,60);
  assert.equal(c.pairs[0].delta.healthLost,null);assert.equal(c.controlledDeaths.after,0);
});
test('build, settings, schema, vision and budget changes prevent controlled aggregation',()=>{
  for(const change of [r=>r.decisionsPerSeed++,r=>r.runs[0].contract.buildId='changed',
    r=>r.runs[0].contract.settingsId='changed',r=>r.runs[0].contract.observationSchemaVersion++,
    r=>r.runs[0].vision.range++,r=>delete r.runs[0].contract.buildId]) {
    const a=report(),b=report();change(b);const c=compareReports(a,b);
    assert.equal(c.controlledSeeds,0);assert.ok(c.pairs[0].differences.length);
  }
});
test('death differs from incomplete budget; interrupted runs cannot enter aggregates',()=>{
  const a=report(),b=report();b.runs[0].status='dead';
  assert.equal(compareReports(a,b).controlledDeaths.after,1);
  for(const status of ['error','cancelled','unsupported-decision','running']) {
    b.runs[0].status=status;assert.equal(compareReports(a,b).controlledSeeds,0);
  }
});
test('unpaired and duplicate seeds cannot silently alter the matched comparison',()=>{
  const a=report(),b=report();b.runs[0].seed=456;
  const c=compareReports(a,b);assert.equal(c.pairedSeeds,0);assert.deepEqual(c.onlyBefore,[123]);assert.deepEqual(c.onlyAfter,[456]);
  b.runs.push({...b.runs[0]});assert.throws(()=>compareReports(a,b),/unique/);
});

test('a resumed run uses its own budget rather than the original batch default',()=>{
  const a=report(),b=report();b.runs[0].decisionBudget=750;
  assert.equal(compareReports(a,b).controlledSeeds,0);
  a.runs[0].decisionBudget=750;assert.equal(compareReports(a,b).controlledSeeds,1);
});

test('combat presets cannot be compared as equivalent to standard or other encounters',()=>{
  const a=report(),b=report();b.scenario='combat-skull';
  assert.ok(compareReports(a,b).pairs[0].differences.includes('scenario'));
  a.scenario='combat-zombie';assert.equal(compareReports(a,b).controlledSeeds,0);
  a.scenario=b.scenario;assert.equal(compareReports(a,b).controlledSeeds,1);
});

test('encounter clears remain distinct from death and budget exhaustion',()=>{
  const a=report(),b=report();a.scenario=b.scenario='combat-skull-pack';
  a.runs[0].status='dead';b.runs[0].status='encounter-cleared';
  const result=compareReports(a,b);assert.equal(result.controlledSeeds,1);
  assert.equal(result.controlledClears.after,1);assert.equal(result.controlledClears.before,0);
  assert.equal(result.controlledDeaths.before,1);assert.equal(result.controlledDeaths.after,0);
});


test('changed outcome-report contracts prevent controlled aggregation',()=>{
  const a=report(),b=report();a.schemaVersion=3;b.schemaVersion=4;
  assert.ok(compareReports(a,b).pairs[0].differences.includes('report-schema'));
  assert.equal(compareReports(a,b).controlledSeeds,0);
});
