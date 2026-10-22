const {spawnSync}=require('node:child_process'),path=require('node:path');
for(const test of ['knowledge-test','planner-test','boss-flow-test','boss-rage-test','patch-2026-10-19-test','attack-calculator-test','session-test']){const r=spawnSync(process.execPath,[path.resolve(__dirname,'../tests/'+test+'.cjs')],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}
