// 사용자 제공 패치. 구버전 자료를 다시 가져와도 마지막에 적용한다.
module.exports=function applyPatch(d){
 d.version='2026-10-19';
 d.patch20261019={source:'사용자 제공 패치 공지',date:'2026-10-19',beginnerRageRetention:{chance:.4,amount:1},broadswordSlash:{range:[.2,.3],perLevel:[.2,.22,.24,.26,.28,.3],stackScope:'동일 개체가 같은 대상에게 찍기 시전, 대상 변경까지',intermediateLevelsVerified:true,coefficientSource:'사용자 확정: Lv1 20%, 이후 레벨당2%포인트 증가'},summoning:{oldBudgetsReusable:false,newRate:null,newPityCount:null},rewardPoints:{dailyRecovery:50,cap:null,initialGrantUnchanged:true}};
 const unit=n=>d.units.find(u=>u.name===n);
 unit('장검').stats.forEach((s,i)=>s.hp=[208,258,320,397,492,610][i]);
 unit('도끼방패').stats.forEach((s,i)=>s.attack=[[10,10],[14,14],[18,18],[22,22],[26,26],[30,30]][i]);
 const dao=unit('대도기병');dao.details=dao.details.replace(/• 주력 스킬:[^\n]*/, '• 주력 스킬: 찍기 (공격력의20~30% 추가 고정 피해, 같은 대상에게 찍기 시전 시 중첩, 대상 변경까지 유지)');
 dao.skillTables=[[['레벨','효과'],...dao.stats.map((s,i)=>[String(i+1),`찍기: 공격력의 ${20+2*i}% 추가 고정 피해. 동일 대상에게 찍기를 시전하면 중첩, 대상 변경까지 유지.`])]];
 unit('화궁').weapon.description='요원: 화염 발동 시 주변 아군의 화염을 추가 발동. 1회 추가 발동마다 해당 회차 화염 피해20% 증가. 연쇄 범위·중복 제한은 미확인.';
 unit('중기병').weapon.description='충돌: 부딪친 최대4명의 대상을1턴 동안 추가로 기절시킨다.';
 const lu=d.heroes.find(h=>(h.entity||'').startsWith('육손'));if(lu){lu.ability_summary='불화살 발사 후 아군 땅의 불이15~30%확률로 적군 방향1칸 확산';lu.evidence_kind='사용자 제공 2026-10-19 패치';}
 if(d.opponents?.leader){d.opponents.leader.hp=1034;d.opponents.leader.auditNote='기본HP1034 사용자 정정. 공격106/공속4는 구원장값이며 영상역산공격110·표시공속6과 충돌';}
 d.combatRules={...d.combatRules,bossTarget:'두목 최근접 후보 중 무작위, 같은 대상3연타(사용자 확정)',beginnerRageRetention:'초급 스킬후40%확률 분노1보류; 확정1 또는 평균0.4분노를 실제문턱과 동일시하지 않음'};
 d.damageProcessingRules={source:'사용자 직접 확정',hpReference:'immediatelyBeforeAttack',damageFormulaSource:'https://acer-wiki.web.app/guides/?id=CcWfP51JNscjVenmONyd',resolution:'calculateThenApplyTogetherPerAttack',dartConversion:'simultaneous',shields:{differentTypes:'independent',sameType:'nonstacking',sameTypeRefresh:'unspecified',consumptionPriority:'unspecified'},engineFullyImplements:false};
 return d;
};
