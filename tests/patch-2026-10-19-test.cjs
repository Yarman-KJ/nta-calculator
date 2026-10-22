const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(__dirname+'/../data/current/project-data.js','utf8')+fs.readFileSync(__dirname+'/../src/planner-engine.js','utf8')+';this.P=Planner',ctx);const P=ctx.P,d=JSON.parse(JSON.stringify(P.data));let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++};
eq(d.units.find(u=>u.name==='장검').stats.map(s=>s.hp),[208,258,320,397,492,610]);
eq(d.units.find(u=>u.name==='도끼방패').stats.map(s=>s.attack),[[10,10],[14,14],[18,18],[22,22],[26,26],[30,30]]);
eq(P.loadout('장검',6,[],1,{}).hp,655);
for(const [i,coefficient] of [.2,.22,.24,.26,.28,.3].entries()){eq(P.broadswordCoefficient(i+1,true),coefficient);eq(P.broadswordCoefficient(i+1,false),coefficient);}
const actor={},a={},b={};eq(P.broadswordStack(actor,0,a,.2,true),.2);eq(P.broadswordStack(actor,0,a,.2,true),.4);eq(P.broadswordStack(actor,1,a,.2,true),.2);eq(P.broadswordStack(actor,0,b,.2,false),0);eq(P.broadswordStack(actor,0,b,.2,true),.2);
eq(d.patch20261019.beginnerRageRetention,{chance:.4,amount:1});eq(d.opponents.leader.hp,1034);
eq(d.heroes.find(h=>h.entity.startsWith('육손')).ability_summary.includes('15~30%'),true);
eq(d.units.find(u=>u.name==='중기병').weapon.description.includes('최대4명'),true);
eq(d.units.find(u=>u.name==='화궁').weapon.description.includes('해당 회차'),true);
const once=JSON.stringify(d);require('../tools/patch-2026-10-19.cjs')(d);eq(JSON.stringify(d),once);
eq(d.patch20261019.broadswordSlash.perLevel,[.2,.22,.24,.26,.28,.3]);eq(d.patch20261019.broadswordSlash.intermediateLevelsVerified,true);
console.log(JSON.stringify({checks:count,scope:'패치 자료·계수 범위·개체/대상별 중첩 회귀검사. 인게임 검증 아님'}));
