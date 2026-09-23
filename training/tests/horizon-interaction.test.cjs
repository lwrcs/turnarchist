'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ts=require('typescript'),I=require(process.env.HORIZON_INTERACTION_MODULE),Host=require('../../agent-horizon-host.js');
// Extract the actual engine prompt and callbacks, not a look-alike save/load.
const source=ts.createSourceFile('downLadder.ts',fs.readFileSync('src/tile/downLadder.ts','utf8'),ts.ScriptTarget.Latest,true);
const cls=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name.text==='DownLadder');
const methods=['onCollide','confirmDescent','getMainPathDialogText'].map(name=>cls.members.find(n=>n.name?.getText(source)===name).getText(source)).join('\n');
const output=ts.transpileModule(`export class DownLadder {${methods}}`,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exportsObj={};vm.runInNewContext(output,{exports:exportsObj});const {DownLadder}=exportsObj;
const isLadder=t=>t?.constructor===DownLadder;
function fixture(){
 const room={globalId:'R-ladder',roomArray:[]},calls={generation:0,record:[]};
 const p={x:3,y:4,z:0,getRoom:()=>room,screenMessage:{open:false,buttons:[],show(text,buttons){this.open=true;this.buttons=buttons;},close(){this.open=false;this.buttons=[];}}};
 const ladder=new DownLadder();Object.assign(ladder,{room,x:3,y:4,isSidePath:false,lockable:{isLocked:()=>false},
  game:{players:{local:p},replayManager:{recordAction:a=>calls.record.push(a)}},doEnterLevel:()=>calls.generation++});
 room.roomArray[3]=[];room.roomArray[3][4]=ladder;
 return {room,p,ladder,calls};
}
test('actual DownLadder prompt reproduces ladder-versus-world restore mismatch',()=>{
 const f=fixture();f.ladder.onCollide(f.p);assert.equal(f.p.screenMessage.open,true);
 const loaded=fixture(); // Save V2 restores the tile/player, but not screenMessage.
 assert.throws(()=>Host.assertViewIdentity({decision:f.p.screenMessage.open?'ladder':'world'},
  {decision:loaded.p.screenMessage.open?'ladder':'world'}),e=>e.path==='/observation/decision');
});
for(const action of ['confirm','cancel'])test('ladder continuation reinstalls actual '+action+' callback without advancing the world',()=>{
 const f=fixture();f.ladder.onCollide(f.p);const saved=I.capturePlanningInteraction(f.p,isLadder),r=fixture();
 I.restorePlanningInteraction(saved,r.p,[r.p],isLadder);
 assert.equal(r.p.screenMessage.open,true);assert.equal(r.calls.generation,0);assert.equal(r.calls.record.length,0);
 r.p.screenMessage.buttons[action==='confirm'?0:1].onClick();
 assert.equal(r.p.screenMessage.open,false);assert.equal(r.calls.generation,action==='confirm'?1:0);
 assert.deepEqual(JSON.parse(JSON.stringify(r.calls.record)),[{type:action==='confirm'?'LadderConfirm':'LadderCancel'}]);
});
test('cancelled prompt on the same ladder stays closed across recapture',()=>{
 const f=fixture();f.ladder.onCollide(f.p);f.p.screenMessage.buttons[1].onClick();
 assert.equal(I.capturePlanningInteraction(f.p,isLadder),null);
 I.restorePlanningInteraction(null,f.p,[f.p],isLadder);assert.equal(f.p.screenMessage.open,false);
});
for(const bad of ['locked','wrong-room','wrong-position','other-player','unknown-tile','unknown-field'])test('unsafe ladder reconstruction rejected before onCollide: '+bad,()=>{
 const f=fixture();f.ladder.onCollide(f.p);const s=I.capturePlanningInteraction(f.p,isLadder),r=fixture();let invoked=false;
 r.ladder.onCollide=()=>{invoked=true;};const players=[r.p];
 if(bad==='locked')r.ladder.lockable.isLocked=()=>true;
 if(bad==='wrong-room')s.roomGid='other';if(bad==='wrong-position')s.x++;
 if(bad==='other-player')players.push({...r.p,x:7});if(bad==='unknown-tile')r.room.roomArray[3][4]={};
 if(bad==='unknown-field')s.unexpected=true;
 assert.throws(()=>I.restorePlanningInteraction(s,r.p,players,isLadder),e=>e.code==='PLANNING_INTERACTION_UNSUPPORTED');assert.equal(invoked,false);
});
