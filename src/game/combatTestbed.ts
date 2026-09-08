/** Versioned, deterministic setup data. Never part of the policy's action space. */
export const COMBAT_TESTBED_VERSION = 6;
export const COMBAT_SCENARIOS = ['combat-skull', 'combat-zombie', 'combat-bigskull',
  'combat-bigzombie', 'combat-armoredskull', 'combat-armoredzombie', 'combat-skull-pack', 'combat-spawner',
  'combat-armoredskull-alert', 'combat-armoredzombie-alert', 'combat-bigskull-alert', 'combat-bigzombie-alert',
  'combat-giant-clutter', 'combat-armored-clutter',
  'combat-giant-clutter-low-health', 'combat-armored-clutter-low-health',
  'combat-giant-pocket', 'combat-skull-choke'] as const;
export type CombatScenario = typeof COMBAT_SCENARIOS[number];
export type AgentScenario = 'standard' | 'forest' | 'cave' | CombatScenario;
export function isCombatScenario(value: string): value is CombatScenario {
  return (COMBAT_SCENARIOS as readonly string[]).includes(value);
}
export function combatEncounter(scenario: CombatScenario) {
  if (!isCombatScenario(scenario)) throw new Error('Unsupported combat encounter');
  if (scenario.startsWith('combat-giant-clutter') || scenario.startsWith('combat-armored-clutter')) {
    const giant = scenario.startsWith('combat-giant-clutter');
    return {version: COMBAT_TESTBED_VERSION, width: 25, height: 25,
      player: {x:12, y:12, health:scenario.endsWith('-low-health')?1:null},
      // West/south clutter leaves a northern escape and space on the east.
      walls: [...Array.from({length:8},(_,i)=>({x:9,y:10+i})),
        ...Array.from({length:6},(_,i)=>({x:10+i,y:17}))],
      objects: [{type:'bush' as const,x:13,y:11},{type:'bush' as const,x:14,y:14}],
      enemies: [{type:giant?'bigskull':'armoredskull',x:giant?11:12,y:13,alert:true},
        {type:'armoredzombie',x:15,y:10,alert:true}]};
  }
  const alert=scenario.endsWith('-alert');
  const pocket=scenario==='combat-giant-pocket',choke=scenario==='combat-skull-choke';
  const walls: {x:number;y:number}[]=[];
  if(pocket) {
    for(let x=10;x<=15;x++)walls.push({x,y:10});
    for(let y=11;y<=16;y++)walls.push({x:10,y});
  }
  if(choke)for(let y=8;y<=16;y++)walls.push({x:11,y},{x:15,y});
  const objects=pocket?[{type:'bush' as const,x:11,y:11}]:choke?
    [{type:'bush' as const,x:12,y:10},{type:'bush' as const,x:14,y:14}]:[];
  const names = scenario === 'combat-skull-pack'||choke ? ['skull','skull','skull'] : [pocket?'bigskull':scenario.slice(7).replace(/-alert$/, '')];
  return {version: COMBAT_TESTBED_VERSION, width: 25, height: 25,
    player: {x: 12, y: 12, health:null}, walls, objects,
    enemies: names.map((type, i) => ({type, alert, x: alert?(type.startsWith('big')?11:12):pocket?12:13, y: alert?13:pocket?13:names.length === 1 ? 12 : 9+i*3}))};
}
