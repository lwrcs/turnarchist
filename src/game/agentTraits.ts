/** Explicit, read-only feature projection. Missing values mean unknown, never zero. */
const numberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const booleanOrNull = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;
const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

interface EntityTraitsSource {
  getAgentKillDamageThreshold?: () => number | null;
  globalId?: string; x?: number; y?: number; z?: number;
  health?: number; maxHealth?: number; w?: number; h?: number;
  isEnemy?: boolean; collidable?: boolean; pushable?: boolean; chainPushable?: boolean;
  destroyable?: boolean; interactable?: boolean; baseDamage?: number;
  orthogonalAttack?: boolean; diagonalAttack?: boolean;
  direction?: number;
  forwardOnlyAttack?: boolean; isBossEnemy?: boolean;
  getAgentSpawnTraits?: () => {enemyType: string};
}

export function observeEntity(source: object) {
  // Some subclasses promote protected base-class combat flags to public fields.
  // This diagnostic projection reads only the explicitly listed fields.
  const entity = source as EntityTraitsSource;
  return {
    id: stringOrNull(entity.globalId),
    // Labels are for debugging. Policies should consume traits, not class-name vocabularies.
    kind: entity.constructor.name,
    x: numberOrNull(entity.x), y: numberOrNull(entity.y), z: numberOrNull(entity.z),
    health: numberOrNull(entity.health), maxHealth: numberOrNull(entity.maxHealth),
    width: numberOrNull(entity.w), height: numberOrNull(entity.h),
    isEnemy: booleanOrNull(entity.isEnemy), collidable: booleanOrNull(entity.collidable),
    pushable: booleanOrNull(entity.pushable), chainPushable: booleanOrNull(entity.chainPushable), destroyable: booleanOrNull(entity.destroyable),
    interactable: booleanOrNull(entity.interactable),
    isBoss: booleanOrNull(entity.isBossEnemy),
    forwardOnlyAttack: booleanOrNull(entity.forwardOnlyAttack),
    facing: Number.isInteger(entity.direction) && entity.direction >= 0 && entity.direction < 8
      ? {dx: [0,0,1,-1,1,-1,1,-1][entity.direction], dy: [1,-1,0,0,1,-1,-1,1][entity.direction]} : null,
    spawner: entity.getAgentSpawnTraits?.() ?? null,
    combat: {
      baseDamage: numberOrNull(entity.baseDamage),
      killDamageThreshold: numberOrNull(entity.getAgentKillDamageThreshold?.()),
      orthogonalAttack: booleanOrNull(entity.orthogonalAttack),
      diagonalAttack: booleanOrNull(entity.diagonalAttack),
      // No universal timing descriptor exists yet. Do not infer one from a species name.
      movementPeriodTurns: null, attackPeriodTurns: null,
    },
  };
}

interface ItemTraitsSource {
  getAgentCategories?: () => string[];
  getAgentAttackTraits?: () => {pattern: string; minimumDamage: number} | null;
  getHealingAmount?: () => number;
  stackCount?: number; equipped?: boolean; canUseOnOther?: boolean;
  getUseTurnCost?: () => number | null;
  globalId?: string; name?: string; x?: number; y?: number;
  damage?: number; range?: number; cooldown?: number; cooldownMax?: number;
  manaCost?: number; durability?: number; durabilityMax?: number;
  knockbackDistance?: number; allowsDiagonalAttack?: boolean; twoHanded?: boolean;
  getSuccessfulAttackTurnCost?: () => number | null;
  canMine?: boolean; requiredLevel?: number; requiredSkill?: string;
}

export function observeItem(item: ItemTraitsSource) {
  return {
    id: stringOrNull(item.globalId), kind: item.constructor.name,
    categories: item.getAgentCategories?.() ?? [],
    name: stringOrNull(item.name), x: numberOrNull(item.x), y: numberOrNull(item.y),
    stackCount: numberOrNull(item.stackCount),
    healingAmount: numberOrNull(item.getHealingAmount?.()),
    canUseOnOther: item.canUseOnOther === true,
    useTurnCost: numberOrNull(item.getUseTurnCost?.()),
    traits: {
      // Base stats, not a prediction of final damage after skills, armor or status effects.
      baseDamage: numberOrNull(item.damage), range: numberOrNull(item.range),
      cooldown: numberOrNull(item.cooldown), cooldownMax: numberOrNull(item.cooldownMax),
      manaCost: numberOrNull(item.manaCost), durability: numberOrNull(item.durability),
      durabilityMax: numberOrNull(item.durabilityMax),
      knockbackDistance: numberOrNull(item.knockbackDistance),
      allowsDiagonalAttack: booleanOrNull(item.allowsDiagonalAttack),
      twoHanded: booleanOrNull(item.twoHanded), canMine: booleanOrNull(item.canMine),
      requiredLevel: numberOrNull(item.requiredLevel), requiredSkill: stringOrNull(item.requiredSkill),
      // Range alone does not describe a weapon's footprint. Never invent a pattern.
      attackPattern: item.getAgentAttackTraits?.()?.pattern ?? null,
      minimumAttackDamage: numberOrNull(item.getAgentAttackTraits?.()?.minimumDamage),
      successfulAttackTurnCost: numberOrNull(item.getSuccessfulAttackTurnCost?.()),
    },
  };
}

interface WarningSource {
  x: number; y: number; dead: boolean;
  isActive?: () => boolean;
  parent?: { globalId?: string; z?: number } | null;
  getSaveFields(): {eX?: number; eY?: number; isEnemy: boolean; dirOnly: boolean};
}

export function observeWarnings(warnings: readonly WarningSource[]) {
  return warnings.filter(warning => !warning.dead && (warning.isActive?.() ?? true)).map(warning => {
    const fields = warning.getSaveFields();
    return {
      x: warning.x, y: warning.y, z: numberOrNull(warning.parent?.z) ?? 0,
      sourceId: stringOrNull(warning.parent?.globalId),
      sourceX: numberOrNull(fields.eX), sourceY: numberOrNull(fields.eY),
      hostile: fields.isEnemy, directionOnly: fields.dirOnly,
      // Warning lifetime is not a reliable universal attack countdown.
      resolvesInTurns: null,
    };
  });
}
