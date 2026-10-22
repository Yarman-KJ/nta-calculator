// 종합 계산: 명시한 편제·교전 조건을 사용하는 단순 턴 모델. 격자 AI 전체 재현이 아니다.
const Planner = (()=>{
 const data=PROJECT_DATA, itemMap=Object.fromEntries(data.equipment.map(x=>[x.name,x]));
 const unitMap=Object.fromEntries(data.units.map(x=>[x.name,x]));
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
 const roll=(a,q)=>a[0]+(a[1]-a[0])*q;
 function betterRollChance(fields){if(!fields.length||fields.some(f=>!Number.isInteger(f.low)||!Number.isInteger(f.high)||f.high<f.low||!Number.isInteger(f.current)||f.current<f.low||f.current>f.high))return null;let nonWorse=1,equal=1;for(const f of fields){const size=f.high-f.low+1,good=f.lowerBetter?Math.max(0,f.current-f.low+1):Math.max(0,f.high-f.current+1),same=1/size;nonWorse*=good/size;equal*=same;}return Math.max(0,nonWorse-equal);}
 const pair=a=>a.flatMap((n,i)=>a.slice(i+1).map(m=>[n,m]));
 const optionDefs={
  '회심검':[['치명 확률',20,40],['치명 배율',150,180]],'유성추':[['회피 무시',30,70]],'쌍도끼':[['분노 반환 확률',20,50]],
  '월아도':[['주는 피해 증가',20,50]],'용연검':[['공격력 증가',10,20]],'다트':[['고정 전환',20,50]],'낭아봉':[['현재 HP 피해',1,5]],
  '건곤도':[['주변 고정 피해',30,60]],'백사 채찍':[['새 대상 피해 증가',20,50]],'흡혈검':[['흡혈',10,50]],'환도':[['피격당 흡혈 증가',4,10]],
  '갈고리검':[['발동 확률',15,35]],'도끼':[['저체력 후 흡혈',10,30]],'천기산':[['공격력 증가',5,15],['받는 피해 감소',5,15]],'분심계':[['분심 고정 피해',20,40]],
  '구겸':[['레벨당 계수',4,8]],'가시공':[['처치 고정 피해',50,100]],'혈적자':[['처형 HP',5,20]],'모래시계':[['발동 확률',5,25]],
  '현철 지팡이':[['최초 고정 피해',10,25]],'정심회':[['최대 HP 증가',10,20]],'덩굴 방패':[['원거리 감소',30,60]],
  '술 조롱박':[['턴 회복',1,4]],'무쇠 방패':[['근접 감소',10,35]],'금 사슬갑옷':[['타격 상한',30,15,'피해']],
  '구리 방패':[['최초 저HP 보호막',5,15]],'흑요석 갑옷':[['첫 5턴 피해감소',40,80]],'호심경':[['최대 중첩',10,15,'회']],
  '사슬갑옷':[['중첩 확률',5,20]],'회피 신발':[['회피 확률',10,35]],'피해 반사 갑옷':[['발동 확률',20,40]],
  '옥패':[['첫 보호막',5,10]],'적금순':[['보호막 증폭',20,50]],'현목 영락':[['기절 확률',10,35]],'치료검':[['타격 회복',4,10,'HP']],
  '황월':[['보호막 발동 확률',50,80]],'태양 갑옷':[['발동 확률',20,50]],'분노의 허리띠':[['피격 분노 확률',30,50]],'군기':[['군기 체력',3,4]]
 };
 const partial=['군기','황월','옥패','현목 영락','모래시계','시간 깃발','백참도','명광 갑옷'];
 function optionFields(name){return optionDefs[name]||[];}
 // 범위 내 위치: 사용 가능 70%, 종결 90%. 정수 반올림, 폭 5 이하는 종결 최대 성능.
 function rollThresholds(a,b){const low=Math.min(a,b),high=Math.max(a,b),lowerBetter=b<a,minimum=Math.round(a+(b-a)*.7),terminal=high-low<=5?b:Math.round(a+(b-a)*.9);return {low,high,lowerBetter,min:minimum,end:terminal};}
 function equipmentCriteria(name){if(name==='시간 깃발')return [{key:'원하는 효과',kind:'effect',min:1,end:1,low:1,high:1,chance:.5}];const item=itemMap[name];if(!item)return [];const criteria=optionFields(name).map(([key,a,b])=>({key,kind:'effect',...rollThresholds(a,b)}));if(Array.isArray(item.atk)&&item.atk[0]!==item.atk[1])criteria.push({key:'공격력',kind:'stat',stat:'atk',...rollThresholds(...item.atk)});return criteria;}
 function optionCutText(name){if(name==='시간 깃발')return '공격력형 / 체력형 · 각 50%';const fields=optionFields(name);return fields.length?fields.map(([key,a,b,suffix])=>{const cut=rollThresholds(a,b);return key+' '+cut.min+(suffix||'%')+' / '+cut.end+(suffix||'%')+(cut.lowerBetter?' 이하':' 이상');}).join(' · '):itemMap[name]?.cut||'기준 확인 필요';}
 function options(name,q){return (optionDefs[name]||[]).map(([label,a,b,unit])=>`${label} ${Math.round(roll([a,b],q))}${unit||'%'}`).join(' · ')||'고정 효과·수동 보정 항목'}
 function loadout(unitName,level,names,q,cfg={},hero=null){
  const u=unitMap[unitName];if(!u)throw new Error('병종 없음');
  if(u.group==='병기'&&!hero)names=[];
  const st=u.stats[Math.min(level,u.stats.length)-1],max=hero?(cfg.heroBonus?st.hp+hero.hp:hero.hp):st.hp,atk=hero?(cfg.heroBonus?roll(st.attack,q)+hero.atk:hero.atk):roll(st.attack,q);
  const z={unit:u,hp:max,atk,dr:clamp(cfg.baseDr,0,95)/100,heal:Math.max(0,cfg.heal||0),pctHeal:0,hpPct:0,atkPct:0,up:0,conv:0,current:0,ignDr:0,crit:0,critMul:1.5,hook:0,once:0,sickle:0,exec:0,life:0,ranged:0,melee:0,chain:0,gold:0,obs:0,heart:0,mirror:0,shield:0,copper:0,extra:0,thorn:0,gk:0,distract:0,rageAtk:0,rageHit:0,rageReturn:0,belt:false,whip:0,reflect:0,dodge:0,axe:false,warnings:[],level,q,speed:u.speed,conservative:cfg.conservative!==false};
  if(unitName==='검과 방패'){const stackCap=level===6?100:level*10,stacks=clamp(Math.floor(Number(cfg.breakthroughStacks)||0),0,stackCap);z.hp+=stacks*5;z.atk+=stacks*.5;}
  if((!hero||cfg.heroBonus)&&!cfg.bossProfile&&u.weapon){z.hp+=Math.round(cfg.weaponHp??roll(u.weapon.hp,q));z.atk+=Math.round(cfg.weaponAtk??roll(u.weapon.atk,q))}
  names.forEach((name,index)=>{
   if(!name)return;
   const gearQ=cfg.itemRolls?.[index]??q;
   const it=itemMap[name];if(!it)throw new Error('장비 없음');const coefficient=cfg.bossProfile?(cfg.slotKinds?.[index]==='crafted'?.5:1):index<2?1:.5;
   if(cfg.bossProfile?cfg.includeStats:index>=2){const statQ=cfg.bossProfile?1:gearQ;z.hp+=Math.round((cfg.itemStats?.[index]?.hp??roll(it.hp,statQ))*coefficient);z.atk+=Math.round((cfg.itemStats?.[index]?.atk??roll(it.atk,statQ))*coefficient);}
   const effect=(a,b,label)=>{const def=(optionDefs[name]||[]).find(d=>label?d[0]===label:d[1]===a&&d[2]===b);const value=def?cfg.effectValues?.[index]?.[def[0]]:undefined;return value===undefined?roll([a,b],gearQ):clamp(value,Math.min(a,b),Math.max(a,b));};const p=(a,b,label)=>effect(a,b,label)/100;
   switch(name){
    case '유성추':z.effectiveRange=u.range+1;z.ignoreEvade=p(30,70);break;
    case '회심검':z.crit=p(20,40);z.critMul=effect(150,180)/100;break;
    case '쌍도끼':z.rageAtk++;z.rageReturn=p(20,50);break;
    case '월아도':z.up+=p(20,50);z.ignDr=1-(1-z.ignDr)*.8;z.increaseTaken=1;break;
    case '용연검':z.atkPct+=p(10,20);z.grow=.003;break;
    case '다트':z.conv+=p(20,50);break;
    case '낭아봉':z.current+=p(1,5);break;
    case '건곤도':z.gk=p(30,60);break;
    case '백사 채찍':z.whip=p(20,50);break;
    case '흡혈검':z.life+=p(10,50);break;
    case '환도':z.snowLife=p(4,10);break;
    case '갈고리검':z.hook=p(15,35);break;
    case '도끼':z.axe=true;z.axeLife=p(10,30);break;
    case '천기산':z.atkPct+=p(5,15,'공격력 증가');z.dr=1-(1-z.dr)*(1-p(5,15,'받는 피해 감소'));z.warnings.push('천기산 무작위 2배 강화는 제외');break;
    case '분심계':z.distract=p(20,40);break;
    case '구겸':z.sickle=effect(4,8)*level/100;break;
    case '가시공':z.thorn=p(50,100);break;
    case '혈적자':z.exec=p(5,20);break;
    case '모래시계':z.extra=p(5,25);break;
    case '현철 지팡이':z.once=p(10,25);break;
    case '정심회':z.hpPct+=p(10,20);z.meditate=true;break;
    case '덩굴 방패':z.ranged=p(30,60);break;
    case '술 조롱박':z.pctHeal+=p(1,4);break;
    case '무쇠 방패':z.melee=p(10,35);break;
    case '금 사슬갑옷':z.gold=effect(30,15);break;
    case '구리 방패':z.copper=p(5,15);break;
    case '흑요석 갑옷':z.obs=p(40,80);break;
    case '호심경':z.heart=effect(10,15);break;
    case '사슬갑옷':z.chain=p(5,20);break;
    case '회피 신발':z.dodge=p(10,35);break;
    case '피해 반사 갑옷':z.reflect=p(20,40);break;
    case '옥패':if(cfg.jadeSelf)z.shield+=z.hp*p(5,10);else z.warnings.push('옥패 본인 적용 제외');break;
    case '적금순':z.shieldAmp=p(20,50);z.periodShield=true;break;
    case '치료검':if(u.group!=='병기')z.hitHeal=effect(4,10)*(u.range>2?.5:1);break;
    case '태양 갑옷':z.sun=p(20,50);break;
    case '분노의 허리띠':z.belt=true;z.rageHit=p(30,50);break;
    case '시간 깃발':z.warnings.push('계절·선택 효과 미반영');break;
   }
   if(partial.includes(name))z.warnings.push(`${name}: 상태·대상·발동 상세는 미반영 또는 수동 보정`);
  });
  z.hp=Math.round((z.hp+(cfg.hpBonus||0))*(1+z.hpPct+(cfg.hpPct||0)/100));z.atk=(z.atk+(cfg.atkBonus||0))*(1+z.atkPct+(cfg.atkPct||0)/100);
  z.hpNow=z.hp;z.minHp=z.hp;z.shieldNow=z.shield;z.pending=0;z.copperUsed=false;z.hitCount=0;z.chainStacks=0;z.rage=hero?(cfg.heroRageStart||0):u.rageStart;z.defend=0;z.poison=0;z.silence=0;z.stun=0;z.axeUsed=false;z.onceTargets=new Set();z.fixedPct=clamp(cfg.fixedPct,0,100)/100;z.fixedFlat=Math.max(0,cfg.fixedFlat||0);z.manualMul=Math.max(0,cfg.skillMul||1);z.hero=!!hero;return z;
 }
 function heal(z,value){if((z.unit.group==='병기'&&!z.hero)||z.hpNow<=0)return;z.hpNow=Math.min(z.hp,z.hpNow+Math.max(0,value))}
 function receive(z,normal,fixed,ranged,ignoreDr,turn,suppressRage=false){
  if(z.hpNow<=0)return;
  const low=z.hpNow<z.hp*.5;let dr=z.dr;
  if(z.obs){if(turn<5)dr=1-(1-dr)*(1-z.obs);else normal*=1.5}
  if(z.heart)dr=1-(1-dr)*(1-Math.min(z.heart,z.hitCount)*.04);
  if(z.defend)dr=1-(1-dr)*(1-(.25+.05*z.level));
  if(ranged)dr=1-(1-dr)*(1-z.ranged*(low?.5:1));else dr=1-(1-dr)*(1-Math.min(.95,z.melee*(low?2:1)));
  let n=normal*(1-Math.min(.95,dr)*(1-ignoreDr));if(z.chain)n=Math.max(0,n-5-z.chainStacks);
  if(z.increaseTaken){n*=2;fixed*=2}
  let evade=z.conservative?0:z.dodge;
  let hpDamage=0;const packets=[n,fixed].filter(x=>x>0);
  for(let amount of packets){amount*=1-evade;const now=z.gold?Math.min(amount,z.gold):amount;
   if(z.gold)z.pending+=amount-now;
   const shieldLoss=Math.min(z.shieldNow,now);z.shieldNow-=shieldLoss;z.hpNow-=now-shieldLoss;hpDamage+=now-shieldLoss;
   z.minHp=Math.min(z.minHp,z.hpNow);if(z.hpNow<=0)return;
  }
  z.hitCount++;z.chainStacks=Math.min(Math.floor(z.hp/50),z.chainStacks+(z.conservative?0:z.chain));
  if(z.copper&&!z.copperUsed&&z.hpNow<z.hp*.5){z.copperUsed=true;z.shieldNow+=z.hp*z.copper;heal(z,z.hp*.2)}
  if(z.axe&&!z.axeUsed&&z.hpNow<z.hp*.5){z.axeUsed=true;z.atk+=3*z.level;z.life+=z.axeLife}
  if(z.snowLife)z.life=Math.min(.6,z.life+z.snowLife);
  if(!suppressRage&&hpDamage>0&&!z.noRage)z.rage+=1+(z.conservative?0:z.rageHit);
 }
 function startTurn(z,t){
  if(z.hpNow<=0)return;
  heal(z,z.heal+z.hp*z.pctHeal);if(z.meditate&&(t+1)%5===0)heal(z,(z.hp-z.hpNow)*.2);
  if(z.periodShield&&(t+1)%3===0)z.shieldNow+=z.hp*.04*(1+z.shieldAmp);
  // V4: 이월 잔액의 50%, 잔액이 상한 미만이면 전액. 이월 피해는 다시 상한 적용하지 않음.
  if(z.pending>0){const amount=z.pending<z.gold?z.pending:z.pending*.5;z.pending-=amount;const blocked=Math.min(z.shieldNow,amount);z.shieldNow-=blocked;z.hpNow-=amount-blocked;z.minHp=Math.min(z.minHp,z.hpNow)}
 }
 function skillHits(z,skill,cfg){
  const L=z.level,n=z.unit.name;if(z.hero)return [skill?z.manualMul:1];
  if(!skill){if(n==='강화 쇠뇌')return [1+(.14+.01*L)*cfg.distance];return [1]}
  switch(n){
   case '쇠뇌':return [1,.4+.05*L,.4+.05*L];case '쌍창':return [.35,.35];case '궁기병':return [1,.2+.1*L,.2+.1*L,.2+.1*L];
   case '장창':return [.9+.1*L];case '긴 창':return [.6+.1*L];case '장과':return [.95+.05*L];case '장검':return [.4+.05*L];
   case '창방':case '검과 방패':case '검기병':return [.95+.05*L];case '도끼방패':return [.7+.05*L];case '망치방패':return [.7];
   case '창기병':return [(.4+.05*L)*(cfg.distance===1?1.3:1)];case '중기병':return [.7+.05*L];
   case '독궁':case '화궁':case '사냥꾼':case '칼방':case '무거운 방패':return [];
   case '장궁':return [1];case '대도기병':return [1];default:return [1];
  }
 }
 function broadswordCoefficient(level,conservative=true){
  const patch=data.patch20261019?.broadswordSlash;
  if(!patch)return .1+.05*level;
  return patch.perLevel[level-1]??patch.range[conservative?0:1];
 }
 function broadswordStack(actor,member,target,coefficient,cast){
  actor.slashStates??=new Map();
  let state=actor.slashStates.get(member);
  if(!state||state.target!==target){state={target,value:0};actor.slashStates.set(member,state);}
  if(!cast)return 0;
  state.value+=coefficient;return state.value;
 }
 function combat(cfg,names,q,{trace=false}={}){
  if(cfg.heroes){if(!Array.isArray(cfg.heroes)||cfg.heroes.length<1||cfg.heroes.length>4)throw Error('영웅은 1~4명까지 출전할 수 있습니다.');if(new Set(cfg.heroes.map(h=>h.name)).size!==cfg.heroes.length)throw Error('영웅 중복 출전 불가');const h=cfg.heroes[0];cfg={...cfg,heroName:h.name,heroUnit:h.unit,heroLevel:h.level,heroHp:h.hp,heroAtk:h.atk,heroRageStart:h.rageStart,heroRageMax:h.rageMax,skillMul:h.skillMul,heroDr:h.dr,heroExposure:h.exposure,heroItems:h.items,heroStats:h.stats,heroEffects:h.effects,heroRolls:h.rolls,heroWeaponHp:h.weaponHp,heroWeaponAtk:h.weaponAtk};if(cfg.mode==='hero'){cfg={...cfg,unit:h.unit,level:h.level,baseDr:h.dr,itemStats:h.stats,effectValues:h.effects,itemRolls:h.rolls,weaponHp:h.weaponHp,weaponAtk:h.weaponAtk};names=h.items;}}

  const L=cfg.level,u=unitMap[cfg.unit],hero=cfg.mode==='hero'?{hp:cfg.heroHp,atk:cfg.heroAtk}:null;
  const selected=loadout(cfg.unit,L,names,q,cfg,hero), tank=cfg.mode==='mixed'?loadout(cfg.tank,cfg.tankLevel||L,cfg.tankItems||[],cfg.tankQ??q,{...cfg,itemRolls:cfg.tankRolls,itemStats:cfg.tankStats,effectValues:cfg.tankEffects,weaponHp:cfg.tankWeaponHp,weaponAtk:cfg.tankWeaponAtk,baseDr:cfg.tankDr||0,atkBonus:0,atkPct:0,heal:cfg.tankHeal||0,hpBonus:0,hpPct:0,fixedPct:0,fixedFlat:0}):null;
  const companion=cfg.supportHero?loadout(cfg.heroUnit||cfg.unit,cfg.heroLevel||L,cfg.heroItems||[],cfg.heroQ??1,{...cfg,itemRolls:cfg.heroRolls,itemStats:cfg.heroStats,effectValues:cfg.heroEffects,weaponHp:cfg.heroWeaponHp,weaponAtk:cfg.heroWeaponAtk,baseDr:cfg.heroDr||0,hpBonus:0,hpPct:0,atkBonus:0,atkPct:0},{hp:cfg.heroHp,atk:cfg.heroAtk}):null;
  const extraHeroes=(cfg.heroes||[]).slice(1).map(h=>{const z=loadout(h.unit,h.level,h.items,1,{...cfg,itemRolls:h.rolls,itemStats:h.stats,effectValues:h.effects,weaponHp:h.weaponHp,weaponAtk:h.weaponAtk,baseDr:h.dr,heroRageStart:h.rageStart,skillMul:h.skillMul,hpBonus:0,hpPct:0,atkBonus:0,atkPct:0},{hp:h.hp,atk:h.atk});z.heroName=h.name;z.heroRageMax=h.rageMax;z.heroExposure=h.exposure;return z;});if(selected.hero)selected.heroName=cfg.heroName;if(companion)companion.heroName=cfg.heroName;
  const siege=cfg.siege?loadout(cfg.siege,1,[],q,{conservative:cfg.conservative}):null;let victim=tank||selected;const enemyGroups=cfg.enemyList||data.encounters.find(x=>x.id===cfg.encounter)?.enemies||[],enemies=enemyGroups.flatMap(([id,n])=>Array.from({length:n},()=>({...data.opponents[id],id,hpNow:data.opponents[id].hp,poison:0,poisonTurns:0,bleed:0,bleedTurns:0,weak:0,weakTurns:0}))).filter(e=>e.hp>0);
  enemies.forEach(e=>{if(e.kind==='boss'){const g=cfg.bossGear?.[e.id]||{names:[]};e.gear=loadout(e.ranged?'쇠뇌':'장검',e.level,g.names||[],1,{bossProfile:true,includeStats:g.includeStats??true,itemRolls:g.rolls,slotKinds:g.slotKinds,effectValues:g.effectValues,conservative:false},{hp:e.hp,atk:e.atk});e.hp=e.hpNow=e.gear.hp;e.atk=e.gear.atk;e.gear.rage=cfg.bossRage?.[e.id]?.start??data.bossRage?.[e.id]?.start??0;e.rageMax=cfg.bossRage?.[e.id]?.max??data.bossRage?.[e.id]?.max??null;e.gear.noRage=e.rageMax===0;e.casts=0;e.boosted=0;}});
  if(!enemies.length)throw new Error('대상 없음');const initialHp=enemies.reduce((a,e)=>a+e.hp,0),events=[];
  let dealt=0,cleared=false,turns=0,ratStacks=0,tankRatStacks=0;
  const num=cfg.mode==='hero'?1:Math.floor(clamp(cfg.count,1,45));
  const policySet=new Set(cfg.policies||[]);const roster=[tank,selected,companion,...extraHeroes,siege].filter(Boolean);for(const z of roster){const soldier=z.unit.group!=="병기",cavalry=/기병/.test(z.unit.name),bow=["쇠뇌","강화 쇠뇌","장궁","화궁","독궁","사냥꾼"].includes(z.unit.name);let attackUp=0,hpUp=0;if(policySet.has("진격의 나팔")&&cfg.enemyTerritory)attackUp+=.1;if(soldier&&policySet.has("무기 정통"))z.atk+=z.level;if(soldier&&cavalry&&policySet.has("기병 정통")){attackUp+=.08;hpUp+=.08}if(soldier&&z.level===1&&policySet.has("신병의 힘")){attackUp+=.1;hpUp+=.1}z.atk*=1+attackUp;z.hp=Math.round(z.hp*(1+hpUp));z.hpNow=z.hp;z.minHp=z.hp;if(policySet.has("야외 정복자"))z.up+=.2;if(soldier&&bow&&policySet.has("궁병 정통"))z.up+=.1;if(soldier&&z.level===6&&policySet.has("약육강식")){z.up+=.1;z.dr=1-(1-z.dr)*.9}}for(const actor of roster){actor.total=actor===selected?num:actor===tank?Math.floor(clamp(cfg.tankCount,1,45)):actor===siege?Math.floor(clamp(cfg.siegeCount,1,45)):1;actor.losses=0;actor.initial={...actor};}
  const living=a=>a&&a.total>a.losses&&a.hpNow>0;
  function recordDeath(z){if(z.hpNow<=0&&z.total>z.losses){z.losses++;if(z.total>z.losses){const total=z.total,losses=z.losses;Object.assign(z,z.initial,{total,losses});z.freshSets=undefined;}}}
  function takeHit(z,...args){const before=z.hpNow;receive(z,...args);recordDeath(z);return Math.max(0,before-z.hpNow);}
  const memberOrder=(cfg.formationMembers||[]).slice().sort((a,b)=>(Number(b.speed)||0)-(Number(a.speed)||0)||(a.squad??0)-(b.squad??0)||(a.slot??0)-(b.slot??0));
  function actorForMember(m){if(m.kind==='siege')return selected.unit.group==='병기'&&selected.unit.name===m.unit?selected:siege;if(m.kind==='hero'){if(cfg.mode==='hero')return selected;return [selected?.hero?selected:null,companion,...extraHeroes].filter(Boolean).find(actor=>actor.heroName===m.name)||null;}if(selected?.unit.name===m.unit)return selected;if(tank?.unit.name===m.unit)return tank;return null;}
  function orderedRoster(){const bySpeed=memberOrder.map(actorForMember).filter((a,i,list)=>a&&list.indexOf(a)===i);return [...bySpeed,...roster.filter(a=>!bySpeed.includes(a))];}
  function chooseVictim(){victim=orderedRoster().find(living)||selected;return victim;}const maximum=Math.floor(clamp(cfg.turns,1,120));
  const freshByUnit=Array.from({length:num},()=>new Set());
  function harm(e,amount,fixed=0,ranged=unitMap[cfg.unit].range>2,suppressRage=false){if(e.gear){const g=e.gear;g.hpNow=e.hpNow;const before=g.hpNow;receive(g,Math.max(0,amount-fixed),fixed,ranged,0,turns-1,suppressRage);e.hpNow=Math.max(0,g.hpNow);const d=Math.max(0,before-e.hpNow);dealt+=d;return d;}const d=Math.min(e.hpNow,Math.max(0,amount));e.hpNow-=d;dealt+=d;return d}
  for(let t=0;t<maximum;t++){
   turns=t+1;startTurn(selected,t);if(tank)startTurn(tank,t);if(siege)startTurn(siege,t);if(companion)startTurn(companion,t);extraHeroes.forEach(h=>startTurn(h,t));enemies.forEach(e=>{if(e.gear){e.gear.hpNow=e.hpNow;startTurn(e.gear,t);e.hpNow=Math.max(0,e.gear.hpNow);}});roster.forEach(recordDeath);chooseVictim();if(!roster.some(living))break;
   const enemiesFirst=cfg.enemyFirst;
   function enemyPhase(){
    if(t+1<cfg.enemyStart)return;
    for(const e of enemies){if(e.hpNow<=0)continue;chooseVictim();if(!roster.some(living))return;const skill=e.kind==='boss'?(e.id==='leader'&&e.rageMax===null?true:e.rageMax!==null?e.rageMax>0&&e.gear.rage>=e.rageMax:(t+1)%cfg.enemySkillEvery===0):(t+1)%cfg.enemySkillEvery===0;if(skill&&e.gear)e.gear.rage=0;else if(e.gear&&e.rageMax!==0)e.gear.rage+=1;let normal=e.atk*(e.crit||1),fixed=0;if(e.id==='leader'&&skill){normal=e.atk*(.2+e.casts*.05)*3;e.casts++;}
     if(e.gear){const g=e.gear;normal=(normal+g.current*victim.hpNow)*(1+g.up)*(cfg.conservative&&g.crit?g.critMul:1+g.crit*(g.critMul-1))*(1+(cfg.conservative&&g.extra?1:g.extra));fixed+=normal*g.conv;normal*=1-g.conv;fixed+=g.sickle*victim.atk+g.hook*victim.hp*(1+L)/100;if(t===cfg.enemyStart-1)fixed+=victim.hp*g.once;}
     if(e.currentFixed)fixed+=victim.hpNow*e.currentFixed;
     if(e.id==='gorilla'&&skill){e.poison=e.bleed=e.weak=0;e.poisonTurns=e.bleedTurns=e.weakTurns=0;e.boosted=2;continue;}
     if(e.id==='gorilla'&&e.boosted>0){normal*=3;fixed+=e.atk*.5;e.boosted--;}
     if(e.id==='goat'&&skill){fixed+=victim.hp*.15;if(!cfg.ignoreControl)victim.stun=1}

     if(e.weakTurns>0)normal*=1-e.weak;
     const shieldClass=victim.unit.group==='방패병';if(e.id.startsWith('boar')&&shieldClass)normal*=1.4;
     if(e.id.startsWith('archer')&&victim.unit.group==='창병')normal*=1.4;
     if(e.id==='rat')fixed+=victim.hp*.05*(tank?tankRatStacks:ratStacks);
     if(e.id==='rat'&&tank&&ratStacks)takeHit(selected,0,selected.hp*.05*ratStacks,true,0,t);
     if(e.poisonTurns>0){harm(e,e.hp*e.poison);e.poisonTurns--}if(e.bleedTurns>0){harm(e,e.bleed);e.bleedTurns--}
     if(e.hpNow<=0)continue;
     const strikes=e.id==='leader'&&skill?3:1;
     for(let hit=0;hit<strikes;hit++){
      takeHit(chooseVictim(),normal/strikes,fixed/strikes,e.ranged,e.kind==='boss'?.7:e.id.startsWith('boar')||e.id.startsWith('archer')?.2:0,t,hit>0);
      if(tank&&living(selected)&&cfg.dealerExposure>0)takeHit(selected,normal/strikes*cfg.dealerExposure/100,fixed/strikes*cfg.dealerExposure/100,e.ranged,e.kind==='boss'?.7:0,t,hit>0);
      if(siege&&living(siege)&&cfg.siegeExposure>0)takeHit(siege,normal/strikes*cfg.siegeExposure/100,fixed/strikes*cfg.siegeExposure/100,e.ranged,e.kind==='boss'?.7:0,t,hit>0);
      if(companion&&living(companion)&&cfg.heroExposure>0)takeHit(companion,normal/strikes*cfg.heroExposure/100,fixed/strikes*cfg.heroExposure/100,e.ranged,e.kind==='boss'?.7:0,t,hit>0);extraHeroes.forEach(h=>{if(living(h)&&h.heroExposure>0)takeHit(h,normal/strikes*h.heroExposure/100,fixed/strikes*h.heroExposure/100,e.ranged,e.kind==='boss'?.7:0,t,hit>0);});if(!roster.some(living))return;
     }
     if(!victim.conservative&&victim.reflect)harm(e,(5+Math.floor(victim.hp/50))*victim.reflect);
     if(!roster.some(living))return;
    }
   }
   function actorPhase(selected,actorIndex,actorDistance){const u=selected.unit,L=selected.level,hero=selected.hero;const freshByUnit=selected.freshSets||(selected.freshSets=Array.from({length:selected.total||1},()=>new Set()));const cfgActor={...cfg,distance:actorDistance};
    if(t+1<cfg.allyStart||!living(selected))return;if(!selected.hero&&actorDistance>(selected.effectiveRange||u.range))return;
    if(selected.stun){selected.stun--;return}
    if(!selected.hero&&selected.unit.name==='강화 쇠뇌'&&(t-cfg.allyStart+1)%2===0)return;
    if(selected.defend){selected.defend--;return}
    const maximumRage=selected.hero?(selected.heroRageMax??cfg.heroRageMax):u.rageMax;
    const skill=maximumRage>0&&selected.rage>=maximumRage;
    if(skill)selected.rage=0;
    else selected.rage+=1+selected.rageAtk;
    if(!selected.hero&&skill&&u.name==='무거운 방패'){selected.defend=3;return}
    if(!selected.hero&&skill&&u.name==='칼방')selected.shieldNow+=20+10*L+(!hero?selected.hp*.05:0);
    if(!selected.hero&&skill&&u.name==='사냥꾼')selected.buff=3;
    if(skill&&selected.belt)heal(selected,selected.hp*.04+selected.atk*.4);
    if(!selected.hero&&skill&&u.name==='장창')heal(selected,(selected.hp-selected.hpNow)*.3);
    const actions=selected.conservative?1:1+selected.extra;
    const i=actorIndex;if(!living(selected))return;
     let e=enemies.find(e=>e.hpNow>0);if(!e)return;
     if(!selected.hero&&skill&&u.name==='장과'){e.weak=.2+.1*L;e.weakTurns=3}
     if(!selected.hero&&skill&&u.name==='독궁'){e.poison=.005+.005*L;e.poisonTurns=3}
     if(!selected.hero&&skill&&u.name==='화궁'&&e.kind!=='boss'){harm(e,selected.atk*(.5+.05*L)*3)}
     const multipliers=skillHits(selected,skill,cfgActor);
     for(const [strikeIndex,k] of multipliers.entries()){
      e=enemies.find(e=>e.hpNow>0);if(!e)break;
      const memberFresh=freshByUnit[i]||(freshByUnit[i]=new Set()),fresh=!memberFresh.has(e);let atk=selected.atk*(1+(selected.grow||0)*t)+(selected.buff?L+1:0);
      if(u.name==='맥도'&&!hero)atk=(selected.conservative?u.stats[L-1].attack[0]:roll(u.stats[L-1].attack,selected.q))+(selected.atk-roll(u.stats[L-1].attack,selected.q));
      const ignore=1-(1-selected.ignDr)*(u.name==='맥도'?1-L*.05:1);
      let dr=1-(1-e.dr)*(1-(u.range>2?(e.rangedDr||0):0));dr*=1-ignore;
      const crit=selected.conservative?1:1+selected.crit*(selected.critMul-1);
      const base=(atk*k+selected.current*e.hpNow)*(1+selected.up+(policySet.has("파죽지세")&&u.group!=="병기"?Math.max(0,L-e.level)*.1:0)+(fresh?selected.whip:0));
      let fixedHit=base*selected.conv*crit*actions;let hit=base*(selected.conv+(1-selected.conv)*(1-dr))*crit*actions;
      if(!selected.hero&&u.name==='대도기병'){
       const extra=atk*broadswordStack(selected,i,e,broadswordCoefficient(L,selected.conservative),skill);
       hit+=extra;fixedHit+=extra;
      }
      if(!selected.hero&&skill&&u.name==='검기병')hit+=Math.max(0,e.hp-e.hpNow)*.1;
      if(!selected.hero&&u.name==='쇠뇌차'){const pct=cfg.pierce/100;hit+=e.hp*pct*(cfg.pierceFixed?1:1-dr);if(cfg.pierceFixed)fixedHit+=e.hp*pct}
      const manualFixed=e.hp*selected.fixedPct+selected.fixedFlat;hit+=manualFixed;fixedHit+=manualFixed;
      hit+=selected.sickle*e.atk*(1-dr);
      if(!selected.conservative){const hook=(1+L+(e.ranged?0:1))/100*e.hp*selected.hook;hit+=hook;fixedHit+=hook;}
      if(fresh&&selected.once){const fixed=e.hp*selected.once;hit+=fixed;fixedHit+=fixed;if(i===0)selected.shieldNow+=fixed*.4*(1+(selected.shieldAmp||0))}
      const applied=harm(e,hit,fixedHit,u.range>2,strikeIndex>0);if(e.gear?.reflect&&i===0)takeHit(selected,0,(5+Math.floor(e.hp/50))*(cfg.conservative?1:e.gear.reflect),true,0,t);if(i===0)heal(selected,applied*selected.life+(selected.hitHeal||0));
      if(!selected.hero&&i===0&&skill&&u.name==='검과 방패')selected.shieldNow+=applied*.8;
      memberFresh.add(e);
      if(i===0&&e.id==='rat'&&actorDistance<=2){if(selected===tank)tankRatStacks++;else ratStacks++;}
      if(!selected.hero&&skill&&u.name==='장검'){e.bleed=atk*(.4+.05*L);e.bleedTurns=3}
      if(e.hpNow>0&&selected.exec&&e.hpNow<e.hp*selected.exec)harm(e,e.hpNow);
      if(e.hpNow<=0&&selected.thorn)enemies.filter(o=>o.hpNow>0).slice(0,8).forEach(o=>harm(o,atk*selected.thorn));
      if(!skill&&selected.gk)enemies.filter(o=>o!==e&&o.hpNow>0).slice(0,cfg.adjacent).forEach(o=>harm(o,atk*selected.gk));
      if(!selected.hero&&skill&&u.name==='장궁')enemies.filter(o=>o!==e&&o.hpNow>0).slice(0,4).forEach(o=>harm(o,atk*(.4+.1*L)*(1-o.dr)));
      if(skill&&selected.distract&&!selected.conservative)harm(e,atk*selected.distract*.5);
     }
    if(selected.buff)selected.buff--;
   }
   function allyPhase(){if(memberOrder.length){const cursors=new Map();for(const m of memberOrder){const actor=actorForMember(m);if(!actor)continue;const index=cursors.get(actor)||0;cursors.set(actor,index+1);const distance=actor===tank?(cfg.tankDistance||1):actor===siege?5:actor.hero?(cfg.heroDistance||3):actor===selected?cfg.distance:(cfg.tankDistance||1);actorPhase(actor,index,distance);}return;}for(let i=0;i<selected.total-selected.losses;i++)actorPhase(selected,i,cfg.distance);if(tank)for(let i=0;i<tank.total-tank.losses;i++)actorPhase(tank,i,cfg.tankDistance||1);if(siege)for(let i=0;i<siege.total-siege.losses;i++)actorPhase(siege,i,5);if(companion)actorPhase(companion,0,cfg.heroDistance||3);extraHeroes.forEach(h=>actorPhase(h,0,cfg.heroDistance||3));}
   if(enemiesFirst){enemyPhase();allyPhase()}else{allyPhase();enemyPhase()}
   enemies.forEach(e=>{if(e.weakTurns>0)e.weakTurns--});
   if(trace)events.push({turn:t+1,enemyHP:enemies.reduce((a,e)=>a+Math.max(0,e.hpNow),0),frontHP:Math.max(0,victim.hpNow),dealerHP:Math.max(0,selected.hpNow),allyRage:selected.rage,bossStates:enemies.filter(e=>e.gear).map(e=>({id:e.id,rage:e.gear.rage,casts:e.casts,boosted:e.boosted}))});
   if(!roster.some(living))break;
   if(enemies.every(e=>e.hpNow<=0)){cleared=true;break}
  }
  //  종료 후 이월 피해도 생존에 포함. 새 공격·회복 없이 잔액을 보수적으로 전액 차감.
  const frontEnd=victim.hpNow-Math.max(0,victim.pending-victim.shieldNow),backEnd=selected.hpNow-Math.max(0,selected.pending-selected.shieldNow);
  const siegeEnd=siege?siege.hpNow-Math.max(0,siege.pending-siege.shieldNow):null;const heroEnd=companion?companion.hpNow-Math.max(0,companion.pending-companion.shieldNow):null;const casualties=roster.reduce((a,z)=>a+z.losses+(z.hpNow>0&&z.hpNow-Math.max(0,z.pending-z.shieldNow)<=0?1:0),0);const success=cleared&&casualties===0&&frontEnd>0&&backEnd>0&&(siegeEnd===null||siegeEnd>0)&&(heroEnd===null||heroEnd>0)&&extraHeroes.every(h=>h.hpNow-Math.max(0,h.pending-h.shieldNow)>0);
  const warnings=[...new Set(roster.flatMap(z=>z.warnings||[]))];
  if(data.patch20261019){
   const dao=roster.filter(z=>z.unit.name==='대도기병');
   if(dao.length)warnings.push('대도 찍기는 개체·대상별 중첩, 대상 변경 시 초기화하는 기본 규칙을 반영. 언월도50% 비축·이전 효과는 미반영입니다.');
   if(roster.some(z=>z.unit.name==='화궁'))warnings.push('10/19 화궁 요원 연쇄·회차별20% 증가와 육손15~30% 확산은 격자 연쇄 미구현으로 계산에 반영되지 않습니다.');
   if(roster.some(z=>z.unit.name==='중기병'))warnings.push('10/19 중기병 전용충돌 최대4명·1턴 추가기절은 경로·기절대상 미재현으로 계산에 반영되지 않습니다.');
   if(roster.some(z=>z.hero))warnings.push('10/19 초급 분노1보류는40%확률입니다. 영웅 재능 수동보정에 확정1보류를 적용하면 안 됩니다.');
  }
  warnings.push('병종 제어·광역·전용장비 일부는 단순화: 상세 모델 문서 참고');
  if(enemies.some(e=>e.kind==='boss'&&e.id!=='leader'&&e.rageMax===null))warnings.push('3렙지 보스 시작/최대 분노 미입력: 스킬 주기 가정으로 계산. 확정 무손실 판정 아님');
  if(memberOrder.length)warnings.push('개별 공속·동률 좌우 슬롯의 아군 행동 순서를 반영했습니다. 전장 좌표·사거리 내 대상 우선·무작위 광역의 실제 배치는 미재현하여 조건부 손실입니다.');else warnings.push('개체별 공속·부대 내 좌우 순서·최근접 무작위 타깃·2칸 최대8명 광역은 아직 미재현. 피격 비율을 사용한 조건부 손실');
  if(enemies.some(e=>e.kind==='boss'&&!(cfg.bossGear?.[e.id]?.names||[]).some(Boolean)))warnings.push('보스 장비 미입력: 장비 없는 보스로 가정한 참고 결과');
  if(hero||companion)warnings.push('영웅 고유 능력·재능은 수동 보정 입력만 적용');
  enemies.forEach(e=>{if(e.gear){warnings.push(...e.gear.warnings);if((cfg.bossGear?.[e.id]?.names||[]).some(Boolean))warnings.push('보스 장비: 공격 확률은 선택 조건에 따라 보수·평균, 방어 확률은 평균값. 흡혈·피격 분노·분심·처형·광역·제어·사거리 이동은 미반영 또는 단순화');}});if(policySet.size)warnings.push('선택 정책은 1단계. 공격력·피해 증가 각 합산 모델이며 정책 적용 범위·중첩은 실전 검증 필요');if(policySet.has('진격의 나팔')&&!cfg.enemyTerritory)warnings.push('진격의 나팔: 적군 영지 미선택으로 미적용');if(siege)warnings.push('병기 생존은 지정 피격 비율 및 반사 피해 기준. 이동·어그로 미재현');
  if(u.name==='쇠뇌차')warnings.push('관통 계수·피해 유형은 선택한 가정');
  return {casualties,heroEnd:heroEnd===null?null:Math.max(0,heroEnd),losses:roster.map(z=>({unit:z.hero?(z.heroName||'영웅'):z.unit.name,total:z.total,dead:z.losses+(z.hpNow>0&&z.hpNow-Math.max(0,z.pending-z.shieldNow)<=0?1:0)})),siegeEnd:siegeEnd===null?null:Math.max(0,siegeEnd),success,cleared,turns,dealt,enemyRemaining:enemies.reduce((a,e)=>a+Math.max(0,e.hpNow),0),frontEnd:Math.max(0,frontEnd),backEnd:Math.max(0,backEnd),frontMin:Math.max(0,Math.min(victim.minHp,frontEnd)),warnings,events};
 }
 function mandatory(unit){const u=unitMap[unit];return !!u&&u.group!=='병기'&&((u.range>=2&&u.range<=3)||unit==='맥도');}
 function recommendationExcluded(unit,name){const u=unitMap[unit],rules=data.recommendationExclusions||{};return (rules.groups?.[u?.group]||[]).includes(name)||(rules.units?.[unit]||[]).includes(name);}
 function recommendationProfile(unit){const model=data.recommendationFramework||{},ids=model.unitProfiles?.[unit]||[],profiles=ids.map(id=>model.profiles?.[id]).filter(Boolean);return {ids,profiles,functions:[...new Set(profiles.flatMap(p=>p.functions||[]))],label:profiles.map(p=>p.label).filter(Boolean).join(' · ')};}
 function recommendationRoleFit(unit,names){const model=data.recommendationFramework||{},profile=recommendationProfile(unit),tags=new Set(names.flatMap(n=>model.equipmentFunctions?.[n]||[])),reasons=[];let score=0;const reward=(tag,label,weight=.2)=>{if(profile.functions.includes(tag)&&tags.has(tag)){score+=weight;reasons.push(label);}};
  reward('rangedMitigation','원거리 피해 감소');reward('sustain','회복·흡혈');reward('shieldSource','보호막 제공');reward('shieldAmplification','보호막 강화');reward('fixedDamage','고정 피해');reward('range','사거리');
  reward('attackScaling','공격 확장',profile.ids.includes('tankHybrid') ? .25 : .1);reward('onHitDamage','타격 효과');reward('attackCycle','공격 기회');reward('skillDamage','스킬 효과');reward('rageCycle','분노 회전');reward('killSplash','처치 광역');
  if(profile.ids.includes('tankHybrid')&&tags.has('rangedMitigation')&&tags.has('sustain')&&names.some(n=>(model.equipmentFunctions?.[n]||[]).includes('attackScaling'))){score+=.15;reasons.push('생존 기반 공격 확장');}
  return {score,reasons,profileIds:profile.ids,label:profile.label};
 }
 const incompatibleRecommendationPairs=data.recommendationFramework?.constraints?.incompatiblePairs||[['회피 신발','피해 반사 갑옷']];
 function recommendationCombos(unit,all){return all.filter(c=>c.names.every(name=>!recommendationExcluded(unit,name))&&!incompatibleRecommendationPairs.some(([a,b])=>c.names.includes(a)&&c.names.includes(b)));}
 const activeRecommendationVariants=new Map();
 function setRecommendationVariant(unit,key){const variants=data.weaponBuilds?.[unit]?.variants||{};if(!variants[key])return false;activeRecommendationVariants.set(unit,key);return true;}
 function buildOpinion(unit){const source=data.weaponBuilds?.[unit]||{core:[],recommended:[],useful:[]},variants=source.variants||{},variantKey=activeRecommendationVariants.get(unit)||source.defaultVariant||'',variant=variants[variantKey],resolved=variant?{...source,...variant}:source;return Object.fromEntries(['core','recommended','useful','alternative','mole'].map(k=>[k,(resolved[k]||[]).filter(n=>k==='mole'||!recommendationExcluded(unit,n))]).concat([['recommendationDisabled',source.recommendationDisabled===true],['author',source.author],['source',source.source],['date',source.date],['kind',source.kind],['roleNote',resolved.roleNote||source.roleNote||''],['variantKey',variant?variantKey:''],['variantLabel',variant?.label||''],['variants',variants],['defaultVariant',source.defaultVariant||'']]));}
 function candidateItems(unit){return unitMap[unit]?.group==='병기'?[]:data.equipment.map(i=>i.name);}
 const fixedDamageItems=new Set(['다트','건곤도','갈고리검','분심계','가시공','현철 지팡이']);
 function fixedCount(names){return names.filter(n=>fixedDamageItems.has(n)).length;}
 function fixedDamageLimit(){const value=Number(data.recommendationFramework?.constraints?.maximumFixedDamageItems);return Number.isInteger(value)&&value>=0?value:2;}
 function prioritizeFixed(unit,all){return all.filter(c=>fixedCount(c.names)<=fixedDamageLimit());}
 function recommend(unit){const b=buildOpinion(unit);if(unitMap[unit]?.group==='병기'||b.recommendationDisabled)return [];const list=[...new Set([...(mandatory(unit)?['유성추']:[]),...b.core,...b.recommended])].filter(n=>itemMap[n]&&!recommendationExcluded(unit,n));const first=list.find(n=>fixedDamageItems.has(n));return [...list.filter(n=>!fixedDamageItems.has(n)||n===first),...list.filter(n=>fixedDamageItems.has(n)&&n!==first)].slice(0,8);}
 function buildScore(unit,names){const b=buildOpinion(unit);if(b.recommendationDisabled)return 0;const curated=names.reduce((s,n)=>s+(recommendationExcluded(unit,n)?0:b.core.includes(n)?6:b.recommended.includes(n)?3:b.useful.includes(n)?1:(b.alternative||[]).includes(n)?0.5:0),0);return curated+(mandatory(unit)&&names.includes('유성추')?10:0)+recommendationRoleFit(unit,names).score;}
 function rankRecommendationCombos(unit,combos,priorityNames=[],usefulNames=[],limit=3){
  const available=prioritizeFixed(unit,recommendationCombos(unit,combos)),priority=[...new Set(priorityNames)],useful=new Set(usefulNames);
  const randomNames=c=>c.random||c.names.slice(0,2);
  const score=c=>randomNames(c).filter(n=>priority.includes(n)).length*10000+buildScore(unit,c.names)+randomNames(c).reduce((s,n)=>s+(useful.has(n)?100:0),0);
  const sorted=available.map((c,index)=>({c,index,score:score(c)})).sort((a,b)=>b.score-a.score||a.index-b.index),top=[],seen=new Set(),topLimit=Math.min(3,Math.max(0,Math.floor(limit)));
  for(const {c} of sorted){if(top.length>=topLimit)break;const key=[...c.names].sort().join('|');if(!seen.has(key)){seen.add(key);top.push(c);}}
  return {top,unavailable:priority.filter(n=>!available.some(c=>randomNames(c).includes(n)))};
 }
 function combos(pool,candidates,random,slots){const rs=random?.length===2?[random]:pair(pool);const adds=slots===0?[[]]:slots===1?candidates.map(n=>[n]):pair(candidates);return rs.flatMap(r=>adds.filter(a=>a.every(n=>!r.includes(n))).map(a=>({random:r,crafted:a,names:[...r,...a]})))}
 function reforgeMilestoneChance(pool,locks,attack,weaponStatsTerminal,goal){
  if(!Array.isArray(pool)||pool.length!==8||pool.some(o=>o.tier!=='none'&&(o.pMin===null||((goal==='two-or-terminal'||goal==='core-terminal'||goal==='final')&&o.tier==='core'&&o.pEnd===null))))return null;
  const states=o=>{if(!o||o.tier==='none')return [{valid:false,core:false,terminal:false,p:1}];const min=clamp(o.pMin,0,1),end=Math.min(min,clamp(o.pEnd,0,1));return [{valid:false,core:false,terminal:false,p:1-min},{valid:true,core:o.tier==='core',terminal:false,p:min-end},{valid:true,core:o.tier==='core',terminal:true,p:end}].filter(s=>s.p>0)};
  const pass=(a,b,atk,stats)=>{const valid=a.valid+b.valid+(attack?.included&&atk?1:0),terminal=(a.terminal?1:0)+(b.terminal?1:0),coreMin=(a.core&&a.valid?1:0)+(b.core&&b.valid?1:0),coreEnd=(a.core&&a.terminal?1:0)+(b.core&&b.terminal?1:0);return goal==='one-valid'?valid>=1:goal==='two-or-terminal'?valid>=2||terminal>=1:goal==='core-useful'?coreMin>=1:goal==='core-terminal'?coreEnd>=1:goal==='final'?coreEnd>=2&&stats:true};
  const attackStates=attack?.included?[{valid:true,p:clamp(attack.pValid,0,1)},{valid:false,p:1-clamp(attack.pValid,0,1)}].filter(s=>s.p>0):[{valid:false,p:1}];
  function chanceForPairs(pairs,denominator,fixed=null){if(!denominator)return 0;let chance=0;for(const [x,y] of pairs){const sx=fixed?[{...fixed,p:1}]:states(x),sy=states(y);for(const a of sx)for(const b of sy)for(const atk of attackStates){const p=a.p*b.p*atk.p;if(!p)continue;if(goal==='final'){const ps=clamp(weaponStatsTerminal,0,1);if(pass(a,b,atk.valid,true))chance+=p*ps;}else if(pass(a,b,atk.valid,false))chance+=p;}}return chance/denominator;}
  const pairs=[];for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++)pairs.push([pool[i],pool[j]]);
  const plans=[{lock:null,chance:chanceForPairs(pairs,pairs.length)}];
  for(const fixed of locks||[]){const candidates=pool.filter(o=>o.name!==fixed.name);if(!pool.some(o=>o.name===fixed.name)||!candidates.length)continue;plans.push({lock:fixed.name,chance:chanceForPairs(candidates.map(o=>[null,o]),candidates.length,fixed)});}
  plans.sort((a,b)=>b.chance-a.chance||(a.lock===null?-1:1));return plans[0]||{lock:null,chance:0};
 }
 function reforgeFinalPathExpected(pool,lockedNames=[],weaponStatsTerminal=1,currentStatsTerminal=false){
  if(!Array.isArray(pool)||pool.length!==8||pool.some(o=>o.tier==='core'&&!Number.isFinite(o.pEnd)))return null;
  const core=pool.filter(o=>o.tier==='core'),byName=new Map(core.map(o=>[o.name,clamp(o.pEnd,0,1)]));
  if(core.length<2)return null;
  const statChance=clamp(weaponStatsTerminal,0,1),locks=[...new Set((lockedNames||[]).filter(n=>byName.has(n)))];
  if(locks.length>=2&&currentStatsTerminal)return 0;
  const lockChance=name=>[...byName].reduce((s,[other,p])=>s+(other===name?0:p),0)/7*statChance;
  if(locks.length){const best=Math.max(...locks.map(lockChance));return best>0?1/best:null;}
  const pairs=[];for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++)pairs.push([pool[i],pool[j]]);
  let firstProbability=0,remainingWeighted=0;
  for(const [a,b] of pairs){
   const pa=a.tier==='core'?clamp(a.pEnd,0,1):0,pb=b.tier==='core'?clamp(b.pEnd,0,1):0;
   for(const [hitA,hitB,p] of [[false,false,(1-pa)*(1-pb)],[true,false,pa*(1-pb)],[false,true,(1-pa)*pb],[true,true,pa*pb]]){
    if(!p||(!hitA&&!hitB))continue;firstProbability+=p/28;
    const found=[...(hitA?[a.name]:[]),...(hitB?[b.name]:[])];
    const waitChance=Math.max(...found.map(lockChance));
    if(found.length===2&&statChance>0)remainingWeighted+=(p/28)*(1-statChance)*(waitChance>0?1/waitChance:0);
    else remainingWeighted+=(p/28)*(waitChance>0?1/waitChance:Infinity);
   }
  }
  if(firstProbability<=0||!Number.isFinite(remainingWeighted))return null;
  return 1/firstProbability+remainingWeighted/firstProbability;
 }
 function dedicatedReforgeExpected(rows){
  if(!Array.isArray(rows)||rows.length!==8)return null;
  const effective=rows.filter(o=>o.tier==='core'||o.tier==='useful');
  const pMin=o=>Number.isFinite(o?.pMin)?clamp(o.pMin,0,1):null;
  const pEnd=o=>Number.isFinite(o?.pEnd)?clamp(o.pEnd,0,1):null;
  const pairs=[];
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++)pairs.push([rows[i],rows[j]]);
  const isEffective=o=>o&&(o.tier==='core'||o.tier==='useful');
  const minKnown=effective.every(o=>pMin(o)!==null);
  let firstValid=0,validExtraWeighted=0;
  if(minKnown&&effective.length>=2){
   for(const [a,b] of pairs){
    const pa=isEffective(a)?pMin(a):0,pb=isEffective(b)?pMin(b):0;
    for(const [hitA,hitB,p] of [[false,false,(1-pa)*(1-pb)],[true,false,pa*(1-pb)],[false,true,(1-pa)*pb],[true,true,pa*pb]]){
     if(!p||(!hitA&&!hitB))continue;
     const weighted=p/pairs.length;firstValid+=weighted;
     const hits=[...(hitA?[a]:[]),...(hitB?[b]:[])];
     if(hits.length===2)continue;
     const locked=hits[0],remainingValidChance=effective.filter(o=>o!==locked).reduce((s,o)=>s+pMin(o),0)/7;
     if(remainingValidChance<=0){validExtraWeighted=Infinity;continue;}
     validExtraWeighted+=weighted/remainingValidChance;
    }
   }
  }
  const twoUseful=firstValid>0&&Number.isFinite(validExtraWeighted)?1/firstValid+validExtraWeighted/firstValid:null;
  if(effective.length<2)return {effectiveCount:effective.length,twoUseful,firstTerminal:null,afterLock:null,final:null,reason:'유효 옵션으로 표시한 장비를 2개 이상 선택하세요.'};
  if(!minKnown)return {effectiveCount:effective.length,twoUseful:null,firstTerminal:null,afterLock:null,final:null,reason:'유효 옵션의 최소 컷 자료가 부족합니다.'};
  if(twoUseful===null)return {effectiveCount:effective.length,twoUseful,firstTerminal:null,afterLock:null,final:null,reason:'현재 표시한 옵션만으로는 유효 옵션 2개를 만들 수 없습니다.'};
  if(effective.some(o=>pEnd(o)===null))return {effectiveCount:effective.length,twoUseful,firstTerminal:null,afterLock:null,final:null,reason:'종결 옵션 컷 자료가 부족합니다. 유효 옵션 2개 기댓값은 계산했습니다.'};
  const terminalPool=effective.filter(o=>pEnd(o)>0);
  if(terminalPool.length<2)return {effectiveCount:effective.length,twoUseful,firstTerminal:null,afterLock:null,final:null,reason:'종결 옵션 2개를 만들려면 종결 기준이 있는 장비를 2개 이상 최우선·차선책으로 표시하세요.'};
  let firstHit=0,extraWeighted=0;
  for(const [a,b] of pairs){
   const pa=isEffective(a)?pEnd(a):0,pb=isEffective(b)?pEnd(b):0;
   const outcomes=[[false,false,(1-pa)*(1-pb)],[true,false,pa*(1-pb)],[false,true,(1-pa)*pb],[true,true,pa*pb]];
   for(const [hitA,hitB,p] of outcomes){
    if(!p||(!hitA&&!hitB))continue;
    const weighted=p/pairs.length;firstHit+=weighted;
    const hits=[...(hitA?[a]:[]),...(hitB?[b]:[])];
    if(hits.length===2)continue;
    const locked=hits[0];
    const remainingTerminalChance=effective.filter(o=>o!==locked).reduce((s,o)=>s+pEnd(o),0)/7;
    if(remainingTerminalChance<=0)return {effectiveCount:effective.length,twoUseful,firstTerminal:1/firstHit,afterLock:null,final:null,reason:'첫 종결 옵션을 고정한 뒤 남은 7개 중 종결 가능한 옵션이 없습니다.'};
    extraWeighted+=weighted/remainingTerminalChance;
   }
  }
  const firstTerminal=firstHit>0?1/firstHit:null;
  const afterLock=firstHit>0?extraWeighted/firstHit:null;
  const final=firstTerminal!==null&&afterLock!==null?firstTerminal+afterLock:null;
  return {effectiveCount:effective.length,twoUseful,firstTerminal,afterLock,final,reason:final===null?'현재 선택으로는 두 종결 옵션을 만들 수 없습니다.':'',goal:'any-two-terminal'};
 }
 function reforgeGearExpected(criteria=[],variableStats=[],terminalStatFraction=.9){
  if(!Array.isArray(criteria)||!Array.isArray(variableStats)||!criteria.length)return null;
  const chance=(low,high,target,lowerBetter=false)=>{if(!Number.isFinite(low)||!Number.isFinite(high)||!Number.isFinite(target))return null;if(high<low)[low,high]=[high,low];const total=Math.floor(high)-Math.ceil(low)+1;if(total<=0)return null;const success=lowerBetter?Math.max(0,Math.min(Math.floor(high),Math.floor(target))-Math.ceil(low)+1):Math.max(0,Math.floor(high)-Math.max(Math.ceil(low),Math.ceil(target))+1);return success/total;};
  const minParts=criteria.filter(c=>c.stat!=='hp'&&c.key!=='HP').map(c=>c.chance??chance(c.low,c.high,c.min,c.lowerBetter));
  const endParts=criteria.filter(c=>c.kind==='effect').map(c=>c.chance??chance(c.low,c.high,c.end,c.lowerBetter));
  for(const s of variableStats.filter(s=>s.stat!=='hp'&&s.key!=='hp'&&s.key!=='HP')){const low=Math.min(s.low,s.high),high=Math.max(s.low,s.high);if(high>low)endParts.push(chance(low,high,rollThresholds(low,high).end,false));}
  if(minParts.some(p=>p===null)||endParts.some(p=>p===null)||!endParts.length)return null;
  return {minimum:minParts.reduce((p,c)=>p*c,1),terminal:endParts.reduce((p,c)=>p*c,1)};
 }
 function singleOptionChance(optionChance,poolSize=8,drawCount=2){if(!Number.isFinite(optionChance)||!Number.isFinite(poolSize)||!Number.isFinite(drawCount)||poolSize<=0||drawCount<0)return null;return clamp(optionChance,0,1)*Math.min(poolSize,drawCount)/poolSize;}
 return {rollThresholds,equipmentCriteria,optionCutText,broadswordCoefficient,broadswordStack,fixedCount,fixedDamageLimit,prioritizeFixed,data,itemMap,unitMap,clamp,roll,betterRollChance,reforgeMilestoneChance,reforgeFinalPathExpected,dedicatedReforgeExpected,reforgeGearExpected,singleOptionChance,pair,options,loadout,combat,recommend,mandatory,combos,recommendationCombos,rankRecommendationCombos,optionFields,buildOpinion,buildScore,recommendationProfile,recommendationRoleFit,candidateItems,recommendationExcluded,setRecommendationVariant};
})();

