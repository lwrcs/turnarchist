'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=ts.createSourceFile('enemy.ts',fs.readFileSync('src/entity/enemy/enemy.ts','utf8'),ts.ScriptTarget.Latest,true);
const cls=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name.text==='Enemy');
const method=cls.members.find(n=>n.name?.getText(source)==='searchPathLocalizedCached').getText(source);
const output=ts.transpileModule(`export class Enemy {${method}}`,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exportsObj={};vm.runInNewContext(output,{exports:exportsObj});const {Enemy}=exportsObj;
function fixture(){const e=new Enemy();Object.assign(e,{globalId:'EN-cache',dead:false,x:18,y:2,
 expandDisablesForFootprint:p=>p,searchPathLocalized:()=>[{pos:{x:17,y:2}}],
 _pathCache:{targetX:17,targetY:5,fromX:17,fromY:2,moves:[{pos:{x:18,y:2}},{pos:{x:19,y:2}},{pos:{x:19,y:3}}]}});
 return {e,rooms:[{globalId:'R-cache',entities:[e]}]};}
test('actual enemy cache reuses the recorded rightward route; ordinary reload recomputes leftward',()=>{
 const live=fixture().e,loaded=fixture().e;loaded._pathCache=null;
 assert.equal(live.searchPathLocalizedCached({x:17,y:5},[])[0].pos.x,19);
 assert.equal(loaded.searchPathLocalizedCached({x:17,y:5},[])[0].pos.x,17);
});
test('planning continuation preserves actual cached successor and detaches path positions',()=>{
 const P=require(process.env.HORIZON_PATH_CACHE_MODULE),live=fixture(),loaded=fixture();loaded.e._pathCache=null;
 const saved=P.capturePlanningPaths(live.rooms,()=>true);
 P.restorePlanningPaths(saved,loaded.rooms,()=>true);
 assert.equal(loaded.e.searchPathLocalizedCached({x:17,y:5},[])[0].pos.x,19);
 loaded.e._pathCache.moves[0].pos.x=999;assert.equal(live.e._pathCache.moves[1].pos.x,19);
 assert.equal(saved.entities[0].cache.moves[1].pos.x,19);
});
for(const bad of ['missing','duplicate','wrong-class','nonfinite','unknown-field','unsupported'])test('path validation is atomic: '+bad,()=>{
 const P=require(process.env.HORIZON_PATH_CACHE_MODULE),f=fixture(),r=fixture(),s=P.capturePlanningPaths(f.rooms,()=>true),old=r.e._pathCache;
 if(bad==='missing')s.entities[0].gid='missing';if(bad==='duplicate')s.entities.push(s.entities[0]);
 if(bad==='wrong-class')s.entities[0].kind='different';if(bad==='nonfinite')s.entities[0].cache.moves[0].pos.x=Infinity;
 if(bad==='unknown-field')s.entities[0].cache.invented=true;
 assert.throws(()=>P.restorePlanningPaths(s,r.rooms,()=>bad!=='unsupported'),e=>e.code==='PLANNING_PATH_CONTINUATION_UNSUPPORTED');
 assert.equal(r.e._pathCache,old);
});
test('cached path invalidation still uses the actual blocked-cell and changed-target rules',()=>{
 const P=require(process.env.HORIZON_PATH_CACHE_MODULE),f=fixture(),s=P.capturePlanningPaths(f.rooms,()=>true);
 for(const [target,blocked] of [[{x:17,y:5},[{x:19,y:2}]],[{x:17,y:6},[]]]){
  const r=fixture();r.e._pathCache=null;P.restorePlanningPaths(s,r.rooms,()=>true);
  assert.equal(r.e.searchPathLocalizedCached(target,blocked)[0].pos.x,17);
 }
});
