import { isWarningVisibleAboveShade } from "../drawable/warningVisibility";
import type { observeEntity, observeItem, observeWarnings } from "./agentTraits";

export const DEFAULT_AGENT_VISION = Object.freeze({range: 12, identificationBrightness: 0.08});
export interface AgentVision {range: number; identificationBrightness: number;}

export function validateAgentVision(vision: AgentVision): AgentVision {
  if (!Number.isFinite(vision.range) || vision.range < 1 || vision.range > 100 ||
    !Number.isFinite(vision.identificationBrightness) || vision.identificationBrightness < 0 ||
    vision.identificationBrightness > 1) throw new Error("Invalid vision range or identification brightness");
  return {range: vision.range, identificationBrightness: vision.identificationBrightness};
}

/** Supercover sight between tile centers. A blocked corner cannot reveal its diagonal. */
export function hasTileSight(x: number, y: number, tx: number, ty: number,
  blocked: (x: number, y: number) => boolean): boolean {
  const dx = tx-x, dy = ty-y, nx = Math.abs(dx), ny = Math.abs(dy);
  const sx = Math.sign(dx), sy = Math.sign(dy);
  let ix=0, iy=0;
  while (ix<nx || iy<ny) {
    const decision=(1+2*ix)*ny-(1+2*iy)*nx;
    if (decision===0) {
      if (blocked(x+sx,y) || blocked(x,y+sy)) return false;
      x+=sx; y+=sy; ix++; iy++;
    } else if (decision<0) {x+=sx; ix++;} else {y+=sy; iy++;}
    if (x===tx && y===ty) return true; // The blocking tile's near face is visible.
    if (blocked(x,y)) return false;
  }
  return true;
}

export function perceiveRoom(input: {
  player: {x: number; y: number; z: number};
  tiles: {x: number; y: number; kind: string; solid?: boolean; traversal?: object; isDoor?: boolean; exit?: boolean}[];
  entities: ReturnType<typeof observeEntity>[];
  items: (ReturnType<typeof observeItem> & {z?: number})[];
  warnings: ReturnType<typeof observeWarnings>;
  brightness(x: number, y: number): number;
  blocked(x: number, y: number): boolean;
}, vision: AgentVision) {
  const {player}=input;
  const inSight=(x: number|null, y: number|null): boolean =>
    x!==null && y!==null && Number.isFinite(x) && Number.isFinite(y) &&
    Math.hypot(x-player.x,y-player.y)<=vision.range &&
    hasTileSight(player.x,player.y,x,y,input.blocked);
  const bright=(x: number,y: number)=>input.brightness(x,y)>=vision.identificationBrightness;
  const entities = input.entities.filter(e=>e.z===player.z && inSight(e.x,e.y)).flatMap(e=> {
    if (bright(e.x!,e.y!)) return [{appearance:"identified", ...e}];
    // No ID, species, stats, dimensions, or hidden phase survives an anonymous contact.
    return e.isEnemy ? [{appearance:"unidentified", x:e.x, y:e.y, z:e.z}] : [];
  });
  return {
    tiles: input.tiles.filter(t=>inSight(t.x,t.y)).map(t=>bright(t.x,t.y)
      ? {...t, brightness:input.brightness(t.x,t.y)}
      : {x:t.x,y:t.y,kind:null,solid:null,isDoor:null,traversal:null,exit:null,brightness:input.brightness(t.x,t.y)}),
    entities,
    items: input.items.filter(i=>(i.z??0)===player.z && inSight(i.x,i.y) && bright(i.x!,i.y!)),
    // Arrows and nearby X marks render above shade. Preserve range/LOS and omit source details.
    hitWarnings: input.warnings.filter(w=>w.z===player.z && inSight(w.x,w.y) &&
      isWarningVisibleAboveShade(w,player.x,player.y))
      .map(w=>({x:w.x,y:w.y,z:w.z,hostile:w.hostile,directionOnly:w.directionOnly})),
  };
}
