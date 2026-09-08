/** Versioned, deterministic setup data. Never part of the policy's action space. */
export const COMBAT_TESTBED_VERSION = 1;
export const COMBAT_SCENARIOS = ['combat-skull', 'combat-zombie', 'combat-bigskull',
  'combat-bigzombie', 'combat-skull-pack', 'combat-spawner'] as const;
export type CombatScenario = typeof COMBAT_SCENARIOS[number];
export type AgentScenario = 'standard' | 'forest' | 'cave' | CombatScenario;
export function isCombatScenario(value: string): value is CombatScenario {
  return (COMBAT_SCENARIOS as readonly string[]).includes(value);
}
export function combatEncounter(scenario: CombatScenario) {
  if (!isCombatScenario(scenario)) throw new Error('Unsupported combat encounter');
  const names = scenario === 'combat-skull-pack' ? ['skull','skull','skull'] : [scenario.slice(7)];
  return {version: COMBAT_TESTBED_VERSION, width: 25, height: 25,
    player: {x: 12, y: 12},
    enemies: names.map((type, i) => ({type, x: 13, y: names.length === 1 ? 12 : 9+i*3}))};
}
