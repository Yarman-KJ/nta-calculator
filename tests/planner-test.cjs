const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(__dirname+'/../data/current/project-data.js','utf8')+fs.readFileSync(__dirname+'/../src/planner-engine.js','utf8')+'\nglobalThis.P=Planner;',ctx);const P=ctx.P;let count=0;
function check(condition,message){assert.ok(condition,message);count++}
check(P.rollThresholds(20,40).min===34&&P.rollThresholds(20,40).end===38,'범위 70%·90% 기준과 반올림');
check(P.rollThresholds(1,4).min===3&&P.rollThresholds(1,4).end===4&&P.rollThresholds(1,5).end===5,'좁은 범위의 종결은 최대 성능');
check(P.rollThresholds(30,15).min===20&&P.rollThresholds(30,15).end===17,'낮을수록 좋은 금 사슬갑옷 역방향 기준');
check(P.equipmentCriteria('구리 방패')[0].min===12&&P.equipmentCriteria('분심계')[0].end===38,'기존 최저값 예외 없이 동일 기준 적용');
check(P.data.equipment.every(i=>P.equipmentCriteria(i.name).every(c=>c.stat!=='hp')),'모든 장비의 기본 체력은 목표에서 제외');
const unifiedGourd=P.reforgeGearExpected(P.equipmentCriteria('술 조롱박'),[]);check(unifiedGourd.minimum===.5&&unifiedGourd.terminal===.25,'표시된 조롱박 3·4와 사용 가능·종결 기댓값 일치');
const cfg={unit:'쇠뇌',level:3,mode:'unit',encounter:'3-rat',count:9,turns:30,tank:'무거운 방패',tankCount:4,tankItems:[],tankQ:.7,heroHp:175,heroAtk:12,heroRageStart:0,heroRageMax:0,skillMul:1,baseDr:0,heal:0,distance:3,allyStart:1,enemyStart:1,enemySkillEvery:3,enemyFirst:true,conservative:true,dealerExposure:0,adjacent:2,pierce:1,pierceFixed:false};
check(P.data.units.length===26,'병종26');check(P.data.heroes.length===59,'영웅59');check(P.data.equipment.length===42,'장비42');
for(const [id,speed,range] of [['rat',9,6],['gorilla',9,6],['goat',9,7],['leader',4,6]])check(P.data.opponents[id].speed===speed&&P.data.opponents[id].range===range,`보스 ${id} 공속·사거리 입력`);
check(P.unitMap['강화 쇠뇌'].stats[4].hp===67,'V4 Lv5 HP 정정');check(P.unitMap['강화 쇠뇌'].stats[5].attack[0]===38,'V4 Lv6 공격 정정');check(P.unitMap['사냥꾼'].stats[5].hp===150,'V4 사냥꾼 HP 정정');
check(Math.abs(P.betterRollChance([{low:1,high:3,current:2}])-1/3)<1e-12,'한 수치가 현재보다 엄격히 좋아질 확률');check(Math.abs(P.betterRollChance([{low:1,high:3,current:2},{low:1,high:3,current:2}])-1/3)<1e-12,'모든 수치가 나빠지지 않고 하나 이상 좋아지는 확률');check(Math.abs(P.betterRollChance([{low:10,high:15,current:13,lowerBetter:true}])-1/2)<1e-12,'낮을수록 좋은 수치의 개선 확률');check(P.betterRollChance([{low:1,high:3,current:3}])===0,'최고 수치에서 개선 확률 0');check(P.betterRollChance([])===null,'비어 있는 기준은 확률 미표시');check(Math.abs(P.singleOptionChance(.8,8,2)-.2)<1e-12,'전용무기 단일 옵션 확률은 8개 중 2개 추첨을 반영');check(P.singleOptionChance(1,4,2)===.5,'pool 크기가 달라져도 포함 확률을 계산');check(P.singleOptionChance(.5,0,2)===null,'옵션 풀이 비면 단일 옵션 확률 미표시');
const poolRolls=Array.from({length:8},(_,i)=>({name:'opt'+i,tier:i<2?'core':i<6?'useful':'none',pMin:1,pEnd:1}));
check(Math.abs(P.reforgeMilestoneChance(poolRolls,[],{included:false,pValid:0},1,'one-valid').chance-27/28)<1e-12,'유효 옵션 1개까지: 2개 코어+4개 쓸만함 풀');
check(Math.abs(P.reforgeMilestoneChance(poolRolls,[],{included:false,pValid:0},1,'two-or-terminal').chance-27/28)<1e-12,'유효 옵션 2개 또는 종결 1개 단계');
check(Math.abs(P.reforgeMilestoneChance(poolRolls,[],{included:false,pValid:0},1,'core-useful').chance-13/28)<1e-12,'코어 옵션 쓸만함 단계');
check(Math.abs(P.reforgeMilestoneChance(poolRolls,[],{included:false,pValid:0},1,'final').chance-1/28)<1e-12,'코어 옵션 2개 종결 조합');
const lockedCore={name:'opt0',valid:true,core:true,terminal:true};check(Math.abs(P.reforgeMilestoneChance(poolRolls,[lockedCore],{included:false,pValid:0},1,'final').chance-1/7)<1e-12,'코어 옵션 고정 후 나머지 하나 재제련');
const stagedPool=Array.from({length:8},(_,i)=>({name:'stage'+i,tier:i<3?'core':'none',pEnd:i<3?.1:0}));
check(Math.abs(P.reforgeFinalPathExpected(stagedPool,[],1,false)-48.01932367149758)<1e-9,'최우선 3개 중 종결 1개를 얻어 고정한 뒤 다음 종결을 노리는 단계별 기대횟수');
check(Math.abs(P.reforgeFinalPathExpected(stagedPool,['stage0'],1,false)-35)<1e-12,'최우선 종결 1개 보유 시 남은 7개 중 다른 최우선 종결 옵션 기대횟수');
check(P.reforgeFinalPathExpected(stagedPool,[],0,false)===null,'무기 스탯 종결 확률 0이면 종결 기댓값 불가');
const gearEv=P.reforgeGearExpected([{kind:'stat',low:1,high:3,min:2},{kind:'effect',low:1,high:3,min:2,end:3}],[{low:1,high:10}],.9);check(Math.abs(gearEv.minimum-4/9)<1e-12&&Math.abs(gearEv.terminal-1/15)<1e-12,'일반 제련 장비는 최소 기준·효과 종결·기본 스탯 90%를 함께 계산');check(P.reforgeGearExpected([],[])===null,'기준 자료가 없는 제련 장비의 기댓값은 만들지 않음');
const minimumOnly=poolRolls.map((o,i)=>({...o,pEnd:null,pMin:i<2?1:0}));check(Math.abs(P.reforgeMilestoneChance(minimumOnly,[],{included:false,pValid:0},1,'core-useful').chance-13/28)<1e-12,'종결 컷 자료가 없어도 코어 최소 컷 단계 계산');
const hpIgnored=P.reforgeGearExpected([{kind:'effect',low:1,high:3,min:2,end:3},{kind:'stat',stat:'hp',low:10,high:20,min:20}],[{stat:'hp',low:10,high:20}],.9);check(Math.abs(hpIgnored.minimum-2/3)<1e-12&&Math.abs(hpIgnored.terminal-1/3)<1e-12,'제련 기본 체력은 최소·종결 기댓값 양쪽에서 제외');
const flagEv=P.reforgeGearExpected([{kind:'effect',low:1,high:1,min:1,end:1,chance:.5}],[],.9);check(flagEv.minimum===.5&&flagEv.terminal===.5,'시간 깃발 원하는 효과 50%는 최소·종결 평균 2회');
const usefulMinimumOnly=poolRolls.map((o,i)=>({...o,tier:i<4?'useful':i<6?'core':'none',pEnd:i<4||i>=6?null:0,pMin:i<6?1:0}));check(Math.abs(P.reforgeMilestoneChance(usefulMinimumOnly,[],{included:false,pValid:0},1,'two-or-terminal').chance-15/28)<1e-12,'쓸만함은 유효 옵션으로 계산하고 2개 충족을 요구');
const load=P.loadout('쇠뇌',3,['다트','낭아봉','회심검','흡혈검'],1,cfg);check(load.atk===8+8+5+5,'랜덤 스탯0%, 제련50%, 전용스탯');
check(P.options('금 사슬갑옷',1).includes('15피해'),'금사슬 낮은상한');
const meteor=P.loadout('장검',1,['천기산'],0,{effectValues:[{'공격력 증가':12,'받는 피해 감소':7}]}),meteorBase=P.loadout('장검',1,[],0,{});check(P.optionFields('천기산').length===2&&Math.abs(meteor.atk-meteorBase.atk*1.12)<1e-9&&Math.abs(meteor.dr-.07)<1e-9,'천기산 공격·피해감소 옵션을 따로 입력·적용');
for(const u of P.data.units)for(const enc of P.data.encounters)for(const q of [0,1]){
 const r=P.combat({...cfg,unit:u.name,level:u.group==='병기'?1:3,encounter:enc.id},['술 조롱박','정심회','금 사슬갑옷','다트'],q);check([r.turns,r.dealt,r.frontEnd,r.backEnd,r.enemyRemaining].every(Number.isFinite),u.name+enc.id);check(r.dealt>=0&&r.enemyRemaining>=0,'nonnegative');
}
const easy={...cfg,heroHp:1e5,heroAtk:1e5,mode:'hero'};check(P.combat(easy,[],0).success,'high stat clear');check(!P.combat({...easy,heroHp:1},[],0).success,'death fail');check(!P.combat({...easy,allyStart:120,turns:1},[],0).success,'no action fail');
const heroEntry=(name,atk=10)=>({name,unit:'장검',level:3,hp:10000,atk,rageStart:0,rageMax:0,skillMul:1,dr:0,exposure:0,items:[],stats:[],effects:[],rolls:[]});
const multiBase={...cfg,mode:'hero',heroBonus:true,enemyStart:120,turns:1};
const oneHero=P.combat({...multiBase,heroes:[heroEntry('A')]},[],1);
const fourHeroes=P.combat({...multiBase,heroes:['A','B','C','D'].map(n=>heroEntry(n))},[],1);
check(fourHeroes.losses.length===4&&fourHeroes.losses.every(z=>z.total===1),'영웅 4명 개별 개체');
check(Math.abs(fourHeroes.dealt-oneHero.dealt*4)<1e-6,'네 영웅 각각 공격');
const distinct=P.combat({...multiBase,heroes:[heroEntry('A'),heroEntry('B',30)]},[],1);
check(distinct.dealt>oneHero.dealt*2,'개별 영웅 공격 스탯 적용');
const sharedWeapon0=P.combat({...multiBase,heroes:[{...heroEntry('A'),weaponHp:0,weaponAtk:0}]},[],1);
const sharedWeapon100=P.combat({...multiBase,heroes:[{...heroEntry('A'),weaponHp:100,weaponAtk:30}]},[],1);
check(sharedWeapon100.frontEnd-sharedWeapon0.frontEnd===100,'영웅에 병종 전용무기 HP 입력 적용');
check(sharedWeapon100.dealt>sharedWeapon0.dealt,'영웅에 병종 전용무기 공격력 입력 적용');
const accompanying0=P.combat({...cfg,supportHero:true,heroBonus:true,enemyStart:120,turns:1,heroes:[{...heroEntry('A'),weaponHp:0,weaponAtk:0}]},[],1);
const accompanying100=P.combat({...cfg,supportHero:true,heroBonus:true,enemyStart:120,turns:1,heroes:[{...heroEntry('A'),weaponHp:100,weaponAtk:30}]},[],1);
check(accompanying100.heroEnd-accompanying0.heroEnd===100,'동반 영웅도 병종 전용무기 HP 공유');
assert.throws(()=>P.combat({...multiBase,heroes:Array.from({length:5},(_,i)=>heroEntry(String(i)))},[],1),/1~4/);
assert.throws(()=>P.combat({...multiBase,heroes:[heroEntry('A'),heroEntry('A')]},[],1),/중복/);
const mixedFront=P.combat({...cfg,mode:'mixed',unit:'강화 쇠뇌',tank:'무거운 방패',count:9,tankCount:4,turns:1,tankLevel:3,enemyStart:1},[],1);
check(mixedFront.losses[0].unit==='무거운 방패','전열 병종이 우선 피격 그룹');
const combos=P.combos(['다트','낭아봉','회심검'],['다트','흡혈검','금 사슬갑옷'],null,2);check(combos.every(c=>new Set(c.names).size===c.names.length),'장비 중복 없음');check(combos.length===5,'풀쌍 및 제련쌍 수');
for(const hero of P.data.heroes){const r=P.combat({...cfg,mode:'hero',heroHp:300,heroAtk:15},[],.5);check(r.warnings.some(w=>w.includes('수동 보정')),'hero manual flag')}

const baseline={...cfg,mode:'hero',heroHp:100000,heroAtk:0,count:1,turns:1,distance:3};
check(Math.abs(P.combat(baseline,[],0).frontEnd-99934)<1e-7,'기본 보스피해66');
check(Math.abs(P.combat({...baseline,baseDr:30},[],0).frontEnd-99939.94)<1e-7,'보스피감70%관통');
check(Math.abs(P.combat({...baseline,heroHp:100},['구리 방패'],0).frontEnd-54)<1e-7,'랜덤 구리방패 스탯 제외 및20%회복');
const heroA=P.combat({...cfg,mode:'hero',heroHp:10000,heroAtk:10,heroRageStart:1,heroRageMax:1,skillMul:2,turns:2,unit:'장창'},[],0);
const heroB=P.combat({...cfg,mode:'hero',heroHp:10000,heroAtk:10,heroRageStart:1,heroRageMax:1,skillMul:2,turns:2,unit:'장검'},[],0);
check(Math.abs(heroA.dealt-heroB.dealt)<1e-7,'영웅에 병종스킬 자동적용 금지');
const once=P.combat({...cfg,mode:'hero',heroHp:10000,heroAtk:0,turns:1},['현철 지팡이'],0);
const a=P.combat({...cfg,count:1,enemyStart:120,turns:1},['현철 지팡이'],0),b=P.combat({...cfg,count:2,enemyStart:120,turns:1},['현철 지팡이'],0);
check(b.dealt>a.dealt*1.8,'현철은 개체마다 첫 대상에 발동');
const raw=P.loadout('쇠뇌',3,['다트','낭아봉'],1,cfg),mixed=P.loadout('쇠뇌',3,['다트','낭아봉'],1,{...cfg,itemRolls:[0,1]});
check(mixed.atk===raw.atk&&mixed.conv<raw.conv&&mixed.current===raw.current,'랜덤 개별 굴림은 옵션만 보정');
check(P.recommend('쇠뇌차','dealer','boss').length===0,'병기 장비 추천 없음');
check(P.loadout('쇠뇌차',1,['정심회','다트'],1).hp===P.loadout('쇠뇌차',1,[],1).hp,'병기 장비 스탯 제외');
for(const u of P.data.units.filter(u=>u.range>=2&&u.range<=3&&u.group!=='병기'))check(P.recommend(u.name,'tank','ranged').includes('유성추'),'중거리 필수');
const offensive={...baseline,bossGear:{rat:{names:['월아도'],rolls:[1]}}};check(P.combat(offensive,[],0).frontEnd<P.combat(baseline,[],0).frontEnd,'보스 공격 장비 적용');
const attackCfg={...baseline,heroAtk:100,enemyStart:120};check(P.combat({...attackCfg,bossGear:{rat:{names:['천기산'],rolls:[1]}}},[],0).dealt<P.combat(attackCfg,[],0).dealt,'보스 방어 적용');
const machines={...attackCfg,siege:'쇠뇌차',siegeCount:1,siegeExposure:0};check(P.combat(machines,[],0).dealt>P.combat(attackCfg,[],0).dealt,'병기 추가 공격');check(P.combat({...machines,bossGear:{rat:{names:['피해 반사 갑옷'],rolls:[1]}}},[],0).siegeEnd<50,'보스 반사 병기 손실');
check(P.combat({...attackCfg,mode:'mixed',tank:'쇠뇌',tankCount:2,tankDistance:3},[],0).dealt>P.combat({...attackCfg,mode:'mixed',tank:'쇠뇌',tankCount:1,tankDistance:3},[],0).dealt,'두 번째 병종 공격 수');
for(const u of P.data.units.filter(u=>u.group!=='병기')){check(!!P.data.weaponBuilds[u.name],'전무 24종 평가 연결');check(P.recommend(u.name).length<=8,'후보 8개 제한');}
check(P.recommendationProfile('검과 방패').ids.join(',')==='tankBaseline,tankHybrid','검방은 공통 탱커 틀과 공격 확장 역할을 함께 적용');check(P.recommendationProfile('망치방패').ids.includes('tankBaseline')&&P.recommendationProfile('창방').ids.includes('tankBaseline'),'일반 탱커는 공통 초소 생존 축을 적용');check(!P.recommendationProfile('칼방').ids.includes('tankBaseline')&&P.recommendationProfile('칼방').ids.includes('shieldSupport'),'칼방은 공통 탱커 묶음에서 분리해 보호막 역할 적용');const swordShieldFit=P.recommendationRoleFit('검과 방패',['술 조롱박','정심회','덩굴 방패','천기산']);check(swordShieldFit.reasons.includes('원거리 피해 감소')&&swordShieldFit.reasons.includes('회복·흡혈')&&swordShieldFit.reasons.includes('공격 확장')&&swordShieldFit.reasons.includes('생존 기반 공격 확장'),'검방 조합은 탱킹 축 유지 후 공격 확장을 보조 평가');const ordinaryTankFit=P.recommendationRoleFit('망치방패',['술 조롱박','정심회','덩굴 방패','천기산']);check(!ordinaryTankFit.reasons.includes('생존 기반 공격 확장'),'검방 외 일반 탱커에만 공격 확장 시너지를 임의 추가하지 않음');const shieldFit=P.recommendationRoleFit('칼방',['황월','적금순']);check(shieldFit.reasons.includes('보호막 제공')&&shieldFit.reasons.includes('보호막 강화'),'칼방 보호막 공급과 증폭 기능 구별');check(P.fixedDamageLimit()===2,'고정 피해 장비 최대 개수는 데이터 설정을 따름');check(P.data.recommendationFramework.equipmentRoles['태양 갑옷'].includes('tank')&&!P.data.recommendationFramework.equipmentRoles['태양 갑옷'].includes('fixedDamage')&&P.data.recommendationFramework.equipmentRoles['현철 지팡이'].includes('utilityDamage'),'태양 갑옷·현철 지팡이는 사용자 분류를 따름');check(Object.keys(P.data.recommendationFramework.equipmentFunctions).every(n=>P.itemMap[n]),'역할 함수표의 장비명이 실제 장비 목록과 연결');
for(const u of ['도끼방패','독궁','사냥꾼']){const opinion=P.buildOpinion(u);check(!opinion.recommendationDisabled&&opinion.core.length+opinion.recommended.length+opinion.useful.length>0,u+'의 보관된 추천 조합을 재활성화');check(P.recommend(u).length>0,u+' 추천 후보 노출');}
check(P.data.units.filter(u=>u.group!=='병기').every(u=>{const b=P.buildOpinion(u.name);return !b.recommendationDisabled&&(b.core.length+b.recommended.length+b.useful.length)>0;}),'장착 가능한 모든 병종에 추천 후보가 있음');
const bossBase={bossProfile:true,includeStats:true,slotKinds:['normal','crafted'],effectValues:[{'회피 무시':67},{'분노 반환 확률':25}]};const leader=P.loadout('쇠뇌',10,['유성추','쌍도끼'],0,bossBase,{hp:10341,atk:106});check(leader.atk===121,'보스 본 장비 최대 공격+제련50%');check(leader.ignoreEvade===.67&&leader.rageReturn===.25&&leader.rageAtk===1,'보스 두 장비 실제 효과 유지');
const armored=P.loadout('쇠뇌',10,['유성추','피해 반사 갑옷'],0,{bossProfile:true,includeStats:true,slotKinds:['normal','crafted']},{hp:10341,atk:106});check(armored.hp===10341+Math.round(P.itemMap['피해 반사 갑옷'].hp[1]*.5),'보스 제련 HP50%');
const explicit=P.loadout('쇠뇌',3,['회심검'],0,{...cfg,effectValues:[{'치명 확률':37,'치명 배율':171}],itemStats:[{hp:0,atk:8}]});check(explicit.crit===.37&&explicit.critMul===1.71,'독립 실제 옵션 입력');
const solo=P.combat({...cfg,count:1,heroHp:10000,heroAtk:0,mode:'hero',turns:1},[],1);const partner=P.combat({...cfg,count:1,heroHp:10000,heroAtk:100,supportHero:true,heroItems:[],turns:1},[],1);check(partner.heroEnd!==null&&partner.dealt>solo.dealt,'동반 영웅 실제 공격');
const slain=P.combat({...cfg,unit:'쇠뇌차',level:1,count:3,turns:1,allyStart:120},[],1);check(slain.casualties===1&&slain.losses[0].dead===1,'순차 피격 손실 계수');
check(P.combat({...cfg,mode:'hero',heroHp:10000,heroAtk:10000,turns:1},[],1).casualties===0,'무손실 실제0 판정');
const shieldBase=P.loadout('검과 방패',3,[],1),shieldStack=P.loadout('검과 방패',3,[],1,{breakthroughStacks:4});check(shieldStack.hp-shieldBase.hp===20&&shieldStack.atk-shieldBase.atk===2,'검방 돌파 스택 HP·공격력 반영');const shieldCapped=P.loadout('검과 방패',3,[],1,{breakthroughStacks:99});check(shieldCapped.hp-shieldBase.hp===150&&shieldCapped.atk-shieldBase.atk===15,'검방 돌파 스택은 레벨별 상한 적용');const shieldHeroBase=P.loadout('검과 방패',3,[],1,{heroBonus:true},{hp:175,atk:12}),shieldHero=P.loadout('검과 방패',3,[],1,{breakthroughStacks:4,heroBonus:true},{hp:175,atk:12});check(shieldHero.hp-shieldHeroBase.hp===20&&shieldHero.atk-shieldHeroBase.atk===2,'검방 돌파 스택은 영웅에게도 적용');const noRandom=P.loadout('장검',3,[],1),withRandom=P.loadout('장검',3,['흡혈검','정심회'],1);
check(withRandom.atk===noRandom.atk&&withRandom.hp===Math.round(noRandom.hp*1.2)&&withRandom.life===.5,'랜덤 스탯 제외·HP증가와 흡혈 옵션 유지');
const heroBonus=P.loadout('장검',3,[],1,{heroBonus:true},{hp:175,atk:12});
check(heroBonus.hp===noRandom.hp+175&&heroBonus.atk===noRandom.atk+12,'영웅 추가 스탯은 병종과 전용무기에 합산');
const heroHigher=P.loadout('장검',6,[],1,{heroBonus:true},{hp:175,atk:12});check(heroHigher.hp>heroBonus.hp&&heroHigher.atk>heroBonus.atk,'영웅 기반 레벨 반영');
for(const u of P.data.units.filter(u=>u.group!=='병기')){
 check(P.candidateItems(u.name).length===42,'병종별 전체 장비 후보42개');
 check(P.recommend(u.name).length<=8,'자동후보8개');
 const b=P.buildOpinion(u.name);check(b.author==='사용자','추천 작성자 사용자');
 if(P.mandatory(u.name))check(P.recommend(u.name).includes('유성추'),'중거리 필수');
}
for(const u of ['독궁','사냥꾼','도끼방패','쌍창']){const b=P.buildOpinion(u);check(!b.recommendationDisabled&&b.core.length+b.recommended.length+b.useful.length>0&&P.recommend(u).length>0,'기존에 비어 있거나 꺼져 있던 추천 활성화 '+u);check(P.candidateItems(u).includes('시간 깃발'),'직접 선택 유지');}
const publishedPath=__dirname+'/published-recommendations.json';
assert.ok(fs.existsSync(publishedPath),'게시 추천 스냅샷 필수');if(fs.existsSync(publishedPath)){const published=JSON.parse(fs.readFileSync(publishedPath,'utf8'));for(const [name,b] of Object.entries(published.builds||published))for(const key of ['core','recommended','useful','alternative','mole'])check(JSON.stringify(P.buildOpinion(name)[key]||[])===JSON.stringify(b[key]||[]),'게시한 사용자 추천 유지 '+name+key);}
const app=fs.readFileSync(__dirname+'/../src/planner-app.js','utf8'),html=fs.readFileSync(__dirname+'/../src/index.template.html','utf8').replace(/<style>[\s\S]*?<\/style>/g,'');check(!html.includes('data-page="crossbow"')&&!html.includes('role-cards')&&!app.includes('selectedRole'),'상세 탭과 역할 UI 제거');check(app.includes('ranked=P.rankRecommendationCombos')&&app.includes('ranked.unavailable')&&app.includes('최우선으로 표시한'),'도달 불가능한 최우선 장비를 사용자에게 표시');check(app.includes('gears[target]=selected.map(g=>({name:g.name,stats:{...g.stats},values:{...g.values}}))'),'추천 장비 자동 이어받기');check(!html.includes('pool-grade-guide')&&!html.includes('눌러서 8개를 고르세요'),'장비 풀 안내문 제거');check(!html.includes('crafted-slot-count')&&html.includes('id="crafted-gear-results"')&&app.includes('P.reforgeGearExpected(criteria,stats,.9)'),'제련 장비 수 선택 제거·2개 자동 기댓값');check(!html.includes('id="boss-transfer-footer"')&&app.includes('data-target="primary"')&&app.includes('data-target="secondary"'),'보스 편성 적용 버튼 제거');check(app.includes('P.dedicatedReforgeExpected(rows)'),'전용무기 유효·종결 옵션 기댓값 연결');check(app.includes("mark==='core'||mark==='alternative'?optionChance(name)")&&app.includes("mark==='alternative'?'useful':'none'"),'차선책 표시는 전용무기 기댓값에 포함');check(app.includes('candidateNames.map(name=>gears.custom.slice(2,4).find(g=>g?.name===name)||blankInputGear(name))'),'선택한 제련 후보를 조합 불러오기 전 4번에 자동 표시');check(app.includes("pool.size+'/8")&&app.includes("candidates.size+'개"),'계산 대기 안내에 선택 상태 표시');check(!html.includes('카드 클릭: 선택 → 최우선 → 차선책 → 해제')&&html.includes('<h2>추천 장비 조합</h2>'),'장비 풀 클릭 순서 안내 제거·조합 제목 변경');check(app.includes('첫 유효 옵션은 고정')&&app.includes('종결 옵션 2개까지'),'유효·종결 2개 기댓값을 표시');check(app.includes("p===0?'범위 내 달성 불가'"),'제련 기댓값이 없는 원인을 화면에 표시');check(app.includes('계산 대상 · 최우선 ')&&app.includes('coreNames=e.core.map(o=>o.name)'),'전용무기 계산 입력에 최우선·차선책 표시');
check(html.includes('id="reforge-panel"')&&html.includes('reforge-auto-note'),'4번 자동 계산 안내와 패널 식별');
check(app.includes('function revealReforgePanel()')&&app.includes('body.hidden=false')&&app.includes("button.setAttribute('aria-expanded','true')"),'선택 시 접힌 4번을 자동으로 펼침');
check(app.includes("chips();revealReforgePanel();});$('craft-candidates').innerHTML")&&app.includes("chips();revealReforgePanel();});$('pool-count')"),'2번·3번 선택 즉시 4번 갱신·펼침');
check(app.includes('candidateNames.map(name=>gears.custom.slice(2,4).find(g=>g?.name===name)||blankInputGear(name))')&&app.includes('crafted=candidateNames.map'),'3번 선택한 전체 장비를 4번에서 자동 계산');
const threePriority=P.dedicatedReforgeExpected([{tier:'core',pMin:1,pEnd:1},{tier:'core',pMin:1,pEnd:1},{tier:'core',pMin:1,pEnd:1},{tier:'useful',pMin:1,pEnd:1},{tier:'none',pMin:0,pEnd:0},{tier:'none',pMin:0,pEnd:0},{tier:'none',pMin:0,pEnd:0},{tier:'none',pMin:0,pEnd:0}]);check(threePriority.effectiveCount===4&&threePriority.firstTerminal>0&&threePriority.afterLock>0,'최우선 장비를 2개 초과로 선택해도 기대값 계산');
const rageTest=P.combat({...baseline,heroRageStart:4,heroRageMax:4,enemyStart:120},[],0,{trace:true});check(rageTest.events[0].allyRage===0,'스킬 후 분노0');
const gor=P.combat({...baseline,encounter:'3-gorilla',turns:4,bossRage:{gorilla:{start:100,max:100}}},[],0,{trace:true});check(gor.events[0].bossStates[0].boosted===2&&gor.events[2].bossStates[0].boosted===0,'고릴라 다음2회 강화');check(gor.events[0].frontHP===100000,'고릴라 격노 시전 분리');
const sampleEv=P.dedicatedReforgeExpected([{tier:'core',pMin:1,pEnd:1},{tier:'core',pMin:1,pEnd:1},{tier:'useful',pMin:1,pEnd:0},{tier:'useful',pMin:1,pEnd:0},{tier:'useful',pMin:1,pEnd:0},{tier:'useful',pMin:1,pEnd:0},{tier:'none',pMin:0,pEnd:0},{tier:'none',pMin:0,pEnd:0}]);check(Math.abs(sampleEv.twoUseful-224/135)<1e-9,'6개 유효 옵션에서 2개 유효 조합 기댓값');check(Math.abs(sampleEv.final-112/13)<1e-9,'최종 2개 즉시 획득 가능성과 1개 고정 후 재제련을 포함');
const allTerminal=Array.from({length:8},()=>({tier:'core',pMin:1,pEnd:1})),sameRoll=P.dedicatedReforgeExpected(allTerminal,1);check(Math.abs(sameRoll.final-1)<1e-12&&sameRoll.afterLock===0,'첫 제련에 종결 두 개가 함께 뜨면 1회 완성');
const twoCore=P.dedicatedReforgeExpected([{tier:'core',pMin:1,pEnd:1},{tier:'core',pMin:1,pEnd:1},...Array.from({length:6},()=>({tier:'none',pMin:0,pEnd:0}))]);check(Math.abs(twoCore.twoUseful-112/13)<1e-9&&Math.abs(twoCore.final-112/13)<1e-9&&Math.abs(twoCore.firstTerminal-28/13)<1e-9,'두 종결 목표의 동시 출현·첫 획득·고정 후 남은 7개 경로');
const mixedGoal=P.dedicatedReforgeExpected([{tier:'core',pMin:1,pEnd:1},{tier:'useful',pMin:1,pEnd:1},...Array.from({length:6},()=>({tier:'none',pMin:0,pEnd:0}))]);check(Math.abs(mixedGoal.final-112/13)<1e-9,'최우선·차선책 종결 옵션을 모두 인정');
const statsRoll=P.dedicatedReforgeExpected(allTerminal);check(Math.abs(statsRoll.final-1)<1e-12&&statsRoll.afterLock===0,'기본 스탯 확률을 옵션 기댓값에 섞지 않음');
const attackValid=P.dedicatedReforgeExpected([{tier:'core',pMin:1,pEnd:1},...Array.from({length:7},()=>({tier:'none',pMin:0,pEnd:0}))]);check(attackValid.twoUseful===null,'옵션 기댓값은 무기 공격력과 분리');
const impossibleGoal=P.dedicatedReforgeExpected([{tier:'core',pMin:1,pEnd:1},...Array.from({length:7},()=>({tier:'none',pMin:0,pEnd:0}))],1);check(impossibleGoal.final===null&&!!impossibleGoal.reason,'완성 가능한 두 번째 목표가 없으면 횟수를 만들지 않음');
console.log('추가 분노/고릴라 3검증 통과');

const polBase={...baseline,heroAtk:100,enemyStart:120};const polRaw=P.combat(polBase,[],0).dealt;
check(Math.abs(P.combat({...polBase,policies:['진격의 나팔'],enemyTerritory:true},[],0).dealt-polRaw*1.1)<1e-6,'나팔1단계 공격력10%');
check(P.combat({...polBase,policies:['진격의 나팔'],enemyTerritory:false},[],0).dealt===polRaw,'나팔 영지조건');
check(Math.abs(P.combat({...polBase,policies:['야외 정복자']},[],0).dealt-polRaw*1.2)<1e-6,'야외1단계 피해20%');
console.log('정책3검사 통과');

check(P.mandatory('맥도')&&P.recommend('맥도').includes('유성추'),'맥도 사용자 기준 유성추 필수');console.log('맥도 필수 검사 통과');
const defensive=['술 조롱박','정심회','덩굴 방패','사슬갑옷','구리 방패','황월','무쇠 방패','흑요석 갑옷','피해 반사 갑옷','군기','태양 갑옷','금 사슬갑옷','호심경','옥패','분노의 허리띠','회피 신발','현목 영락','명광 갑옷','적금순'];
check(P.fixedCount(['피해 반사 갑옷'])===0&&P.fixedCount(['태양 갑옷'])===0&&P.fixedCount(['다트'])===1,'피해 반사·태양 갑옷은 탱·유틸이며 고정 피해 우선 집계에서 제외');
check(P.prioritizeFixed('쇠뇌',[{names:['다트','가시공','갈고리검']},{names:['다트','가시공','모래시계']},{names:['다트','가시공']}]).length===2,'고정 피해 장비 최대 2개 제한, 유틸 장비 조합 허용');
const priorityItems=['다트','가시공','모래시계'],priorityCombos=[{names:['백사 채찍','다트','낭아봉','쌍도끼']},{names:['가시공','낭아봉','쌍도끼','유성추']},{names:['모래시계','갈고리검','낭아봉','쌍도끼']}],ranked=P.rankRecommendationCombos('쇠뇌',priorityCombos,priorityItems,[]);check(priorityItems.every(n=>ranked.top.some(c=>c.names.includes(n)))&&ranked.unavailable.length===0,'사용자가 최우선으로 고른 각 장비를 추천 목록에 포함');check(ranked.top[0].names.filter(n=>priorityItems.includes(n)).length>=1,'최우선 장비 포함 수를 먼저 고려해 추천 순서 결정');
const splitPool=['다트','가시공','모래시계','회심검','용연검','시간 깃발','월아도','갈고리검'],splitCraft=['유성추','낭아봉','쌍도끼','흡혈검'],splitRank=P.rankRecommendationCombos('쇠뇌',P.combos(splitPool,splitCraft,null,2),splitPool,[],9);
check(splitRank.top.length===3,'최우선이 많아도 추천 조합은 최대 3개');check(splitRank.top.every(c=>c.random.length===2&&c.random.every(n=>splitPool.includes(n))&&c.crafted.length===2&&c.crafted.every(n=>splitCraft.includes(n))),'랜덤 2개와 직접 선택한 제련 2개의 출처 유지');
const mirrored={random:['유성추','낭아봉'],crafted:['다트','쌍도끼'],names:['유성추','낭아봉','다트','쌍도끼']},original={random:['다트','쌍도끼'],crafted:['유성추','낭아봉'],names:['다트','쌍도끼','유성추','낭아봉']},dedup=P.rankRecommendationCombos('쇠뇌',[mirrored,original],['다트'],[]);check(dedup.top.length===1&&dedup.top[0].random.includes('다트'),'자리만 바꾼 같은 세트는 중복 제거하고 최우선의 랜덤 배치 우선');
const recOutput={innerHTML:'',textContent:'',querySelectorAll:()=>[]},recCtx=vm.createContext({P,unit:'쇠뇌',pool:new Set(splitPool),poolMarks:new Map(splitPool.map(n=>[n,'core'])),candidates:new Set(splitCraft),$:()=>recOutput,esc:String,tier:()=>'',comboBenefit:()=>'',loadCustomBuild:()=>{}});vm.runInContext(app.split('\n').find(l=>l.includes('function recommend(){'))+'\nrecommend();',recCtx);check((recOutput.innerHTML.match(/우선 검토 조합/g)||[]).length===3&&(recOutput.innerHTML.match(/combo-slot-row/g)||[]).length===6,'실제 추천 화면은 3개 조합을 랜덤·제련 2줄로 렌더링');recCtx.candidates=new Set();vm.runInContext('recommend();',recCtx);check(recOutput.textContent==='3번에서 제련 후보를 2개 이상 선택하세요.','랜덤 최우선 선택을 제련 후보로 자동 추가하지 않음');
const actualPriorityPool=Array.from({length:8},(_,i)=>({name:'real'+i,tier:i<3?'core':'none',pEnd:({real0:2/31,real1:3/51,real2:2/21})['real'+i]||0})),actualStatsChance=(3/11)*(2/9);check(Math.abs(P.reforgeFinalPathExpected(actualPriorityPool,[],actualStatsChance,false)-841.2203192257001)<1e-9,'다트·가시공·모래시계 선택과 강화쇠뇌 90% 스탯 기준의 단계별 종결 기댓값');
check(P.recommendationCombos('검과 방패',[{names:['회피 신발','피해 반사 갑옷']},{names:['회피 신발','회심검']},{names:['피해 반사 갑옷','낭아봉']}]).length===2,'회피 신발과 피해 반사 갑옷 동시 추천만 차단');
for(const u of P.data.units.filter(u=>u.group==='궁병'||['궁기병','맥도','장과','긴 창'].includes(u.name))){const b=P.buildOpinion(u.name);for(const k of ['core','recommended','useful','alternative'])check(!b[k].some(n=>defensive.includes(n)),u.name+' 탱커·유틸 탱 추천 차단 '+k);const probes=defensive.map(name=>({names:[name,'회심검','다트','백사 채찍']})).concat([{names:['회심검','다트','백사 채찍','낭아봉']}]),generated=P.recommendationCombos(u.name,probes);check(generated.length===1&&generated[0].names[0]==='회심검',u.name+' 최종 자동 조합에서 탱·유틸 탱 제외');}
const speedCfg={...cfg,unit:'쇠뇌',count:3,turns:1,enemyStart:120,formationMembers:[{kind:'soldier',unit:'쇠뇌',speed:9,squad:0,slot:0},{kind:'soldier',unit:'쇠뇌',speed:3,squad:0,slot:1},{kind:'soldier',unit:'쇠뇌',speed:1,squad:0,slot:2}]};
const speedResult=P.combat(speedCfg,[],0);check(speedResult.warnings.some(w=>w.includes('개별 공속·동률 좌우 슬롯')),'개별 공속 입력을 사용한 계산 범위 안내');check(Math.abs(speedResult.dealt-P.combat({...speedCfg,formationMembers:undefined},[],0).dealt)<1e-7,'개별 병사별 공격 횟수 보존');
for(const u of ['검과 방패','망치방패','무거운 방패','중기병','창방']){const core=new Set(P.buildOpinion(u).core);check(['술 조롱박','정심회','덩굴 방패'].every(n=>core.has(n)),'탱커 기본 세트 유지 '+u);}
check(P.buildOpinion('검과 방패').roleNote.includes('술 조롱박을 상황에 맞는 탱 장비로 바꿉니다'),'탱커 대체 기준은 술 조롱박 교체');
check(P.buildOpinion('도끼방패').variantLabel==='딜 빌드'&&P.buildOpinion('도끼방패').core.join(',')==='유성추,가시공','도끼방패 딜 빌드 기본 추천');
check(P.setRecommendationVariant('도끼방패','bruiser')&&P.buildOpinion('도끼방패').variantLabel==='딜탱 빌드'&&P.buildOpinion('도끼방패').core.join(',')==='흡혈검,덩굴 방패','도끼방패 딜탱 빌드 분기');
check(['도끼','천기산','호심경'].every(n=>P.recommend('도끼방패').includes(n))&&P.buildOpinion('도끼방패').roleNote.includes('생존형'),'도끼방패 딜탱 대안 및 역할 설명');
check(['가시공','현철 지팡이','분심계','시간 깃발','백참도','회피 신발','분노의 허리띠'].every(n=>P.buildOpinion('도끼방패').useful.includes(n)),'도끼방패 딜탱 쓸만함 장비');
check(P.setRecommendationVariant('도끼방패','damage')&&P.recommend('도끼방패').includes('유성추')&&P.recommend('도끼방패').includes('가시공'),'도끼방패 딜 빌드 후보 자동 갱신');
check(['흡혈검','현철 지팡이','분심계','시간 깃발','백참도'].every(n=>P.buildOpinion('도끼방패').useful.includes(n)),'도끼방패 딜 빌드 쓸만함 장비');
check(P.buildOpinion('대도기병').core.includes('시간 깃발')&&P.buildOpinion('대도기병').roleNote.includes('공격력 옵션'),'시간 깃발은 공격력 옵션 조건 표시');
check(P.buildOpinion('화궁').recommended.includes('분심계'),'화궁 분심계는 추천 등급');
check(P.buildOpinion('사냥꾼').core.length===0&&P.buildOpinion('사냥꾼').roleNote.includes('격려 유지'),'지원 병종은 기능을 코어로 표시');
console.log(`${count} planner assertions passed`);

