import type { Entity } from "../../../entity/entity";
import type { Room } from "../../../room/room";
import type { LoadContext, SaveContext } from "../context";
import type { EnemyKind, EnemySaveV2 } from "../schema";
import { Registry } from "./registry";

export type EnemyCodecV2 = {
  save: (value: Entity, ctx: SaveContext) => EnemySaveV2;
  spawn: (value: EnemySaveV2, room: Room, ctx: LoadContext) => Entity;
};

export const enemyRegistryV2 = new Registry<EnemyKind, EnemyCodecV2>();


