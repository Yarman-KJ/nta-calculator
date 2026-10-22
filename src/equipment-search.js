/* 이름과 효과 검색. 방어 효과를 무시하는 공격 장비는 피감 검색에서 제외한다. */
const EquipmentSearch=(()=>{
 const norm=s=>String(s||'').toLowerCase().replace(/\s/g,'');
 const groups=[
  {words:['피감','피해감소','데미지감소','피해감쇄'],pattern:/피감|피해감소|피해감쇄/},
  {words:['치명','치명타','크리','크리티컬'],pattern:/치명/},
  {words:['공증','공격력증가'],pattern:/공증|공격력증가/},
  {words:['실드','쉴드','보호막'],pattern:/실드|쉴드|보호막/},
  {words:['고정딜','고정뎀','고정데미지','고정피해','고정전환'],pattern:/고정/},
  {words:['피흡','흡혈'],pattern:/흡혈/},
  {words:['체증','체력증가','hp증가'],pattern:/체력증가|hp증가/}
 ];
 function matches(item,query){const q=norm(query);if(!q)return true;if(norm(item.name).includes(q))return true;const cut=norm(item.cut),description=norm(item.description),group=groups.find(g=>g.words.includes(q));if(group)return group.pattern.test(cut);return (cut+description).includes(q);}
 return {matches};
})();
if(typeof module!=='undefined')module.exports=EquipmentSearch;
