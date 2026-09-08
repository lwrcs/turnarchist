/** Versioned, deterministic setup data. Never part of the policy's action space. */
export const COMBAT_TESTBED_VERSION = 2;
export const COMBAT_SCENARIOS = ['combat-skull', 'combat-zombie', 'combat-bigskull',
  'combat-bigzombie', 'combat-skull-pack', 'combat-spawner',
  'combat-giant-pocket', 'combat-skull-choke'] as const;
export type CombatScenario = typeof COMBAT_SCENARIOS[number];
export type AgentScenario = 'standard' | 'forest' | 'cave' | CombatScenario;
export function isCombatScenario(value: string): value is CombatScenario {
  return (COMBAT_SCENARIOS as readonly string[]).includes(value);
}
export function combatEncounter(scenario: CombatScenario) {
  if (!isCombatScenario(scenario)) throw new Error('Unsupported combat encounter');
  const pocket=scenario==='combat-giant-pocket',choke=scenario==='combat-skull-choke';
  const walls: {x:number;y:number}[]=[];
  if(pocket) {
    for(let x=10;x<=15;x++)walls.push({x,y:10});
    for(let y=11;y<=16;y++)walls.push({x:10,y});
  }
  if(choke)for(let y=8;y<=16;y++)walls.push({x:11,y},{x:15,y});
  const objects=pocket?[{type:'bush' as const,x:11,y:11}]:choke?
    [{type:'bush' as const,x:12,y:10},{type:'bush' as const,x:14,y:14}]:[];
  const names = scenario === 'combat-skull-pack'||choke ? ['skull','skull','skull'] : [pocket?'bigskull':scenario.slice(7)];
  return {version: COMBAT_TESTBED_VERSION, width: 25, height: 25,
    player: {x: 12, y: 12}, walls, objects,
    enemies: names.map((type, i) => ({type, x: pocket?12:13, y: pocket?13:names.length === 1 ? 12 : 9+i*3}))};
}
