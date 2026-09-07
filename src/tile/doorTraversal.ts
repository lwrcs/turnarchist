/** Physical doorway occupancy, independent of generation assumptions and rendering. */
export function findDoorwayOccupant(entities: readonly {x: number; y: number; z?: number; w?: number; h?: number; dead?: boolean; collidable?: boolean}[],
  x: number, y: number, z: number, width=1, height=1) {
  return entities.find(entity => !entity.dead && entity.collidable !== false && (entity.z??0)===z &&
    x < entity.x + Math.max(1,entity.w??1) && x+width > entity.x &&
    y < entity.y + Math.max(1,entity.h??1) && y+height > entity.y);
}
