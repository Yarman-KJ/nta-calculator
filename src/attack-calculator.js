/* 공타 초소 HP 컷: 사용자 기준식과 영상 마지막 49초 실측을 분리 적용한다. */
(()=>{
 const $=id=>document.getElementById(id);
 const tileTime=$('attack-tile-time'),result=$('attack-result'),summary=$('attack-condition-summary');
 const formations=[...document.querySelectorAll('input[name="attack-formation"]')];
 const siegeMaster=$('attack-siege-master'),trebuchetPolicy=$('attack-trebuchet-policy');
 if(!tileTime||!result||!summary||!formations.length||!siegeMaster||!trebuchetPolicy)return;

 // Tank-only: use the saved measured reference directly: 28 damage in 36 seconds.
 // Bow and trebuchet: use the final normal 49-second windows reconstructed from videos.
 const profiles={
  tank:{label:'탱커만',dps:28/36,hitsPerSecond:28/36,trebuchetHitsPerSecond:0,source:'확인된 탱커 기준: 28 피해 / 36초 = 7/9 HP/초',caveat:'이 값은 기록된 탱커 기준의 평균 화력입니다. 9명 편제의 동시 타격이나 인원수 비례 증가는 검증되지 않아 반영하지 않습니다.'},
  'tank-bow':{label:'탱커 + 궁병',dps:31/49,hitsPerSecond:31/49,trebuchetHitsPerSecond:0,source:'창&방패+화궁 영상 마지막 49초: HP 31 감소',caveat:'영상의 편제 인원 미확인; 인원수 비례 환산 불가'},
  'tank-trebuchet':{label:'탱커 + 투석차',dps:75/49,hitsPerSecond:33/49,trebuchetHitsPerSecond:21/49,source:'망치&방패+투석차 영상 마지막 49초: HP 75 감소',caveat:'같은 영상 구간의 피해 표시 33회 중 피해 3이 21회'}
 };
 const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
 const formatTime=seconds=>{
  const whole=Math.round(seconds),minutes=Math.floor(whole/60),remaining=whole%60;
  return minutes?`${minutes}분 ${remaining}초`:`${whole}초`;
 };
 function resolveProfile(key){
  const source=profiles[key];if(!source)return null;
  return {...source};
 }
 function estimate(profile,policies={}){
  if(!profile)return null;
  let dps=profile.dps;
  // Siege Master level 1: expected +0.3 damage per building hit.
  if(policies.siegeMaster)dps+=profile.hitsPerSecond*.3;
  // The recording showed 21 trebuchet hits dealing 3 in the final 49 seconds.
  if(policies.trebuchet)dps+=profile.trebuchetHitsPerSecond;
  return dps;
 }
 function calculate(){
  const selected=formations.find(input=>input.checked);
  const conditions=[];
  if(selected)conditions.push(profiles[selected.value]?.label||selected.parentElement.textContent.trim());
  if(siegeMaster.checked)conditions.push('공성의 달인 30%');
  if(trebuchetPolicy.checked)conditions.push('투석차 건물 피해 3 → 4');
  summary.textContent=conditions.length?`선택 조건: ${conditions.join(' · ')}`:'편제와 정책을 선택하면 조건이 표시됩니다.';
  const raw=tileTime.value.trim(),perTile=Number(raw);
  if(!selected){result.innerHTML='<p>먼저 공격 편제를 하나 선택하세요.</p>';return;}
  if(!raw){result.innerHTML='<p>1칸 이동시간을 입력하면 1~5칸의 초소 출격 HP를 계산합니다.</p>';return;}
  if(!Number.isFinite(perTile)||perTile<1){result.innerHTML='<strong>1칸 이동시간은 1초 이상 입력하세요.</strong>';return;}
  const profile=resolveProfile(selected.value);
  if(!profile){result.innerHTML='<p>편제 기준 자료를 확인할 수 없습니다.</p>';return;}
  const dps=estimate(profile,{siegeMaster:siegeMaster.checked,trebuchet:trebuchetPolicy.checked&&selected.value==='tank-trebuchet'});
  const rows=Array.from({length:5},(_,index)=>{
   const tiles=index+1,total=perTile*tiles,activeSeconds=Math.max(0,total-2),cut=Math.max(0,Math.round(dps*activeSeconds));
   return `<tr><th scope="row">${tiles}칸</th><td>${formatTime(total)}</td><td><strong>${cut} HP</strong></td></tr>`;
  }).join('');
  const warning=trebuchetPolicy.checked&&selected.value!=='tank-trebuchet'?'<p class="muted">투석차 정책은 투석차 편제에만 반영됩니다.</p>':'';
  const exactAnchor=perTile===51&&selected.value!=='tank'&&!siegeMaster.checked&&!trebuchetPolicy.checked
    ?`<p class="muted">영상 직접 역산 확인: 총 이동 51초 조건에서 ${Math.round(profile.dps*49)} HP (마지막 49초 관측값)</p>`:'';
  const tankNote=selected.value==='tank'?profile.caveat:'';
  const bowNote=selected.value==='tank-bow'?'이 값은 특정 영상 편제의 전체 피해입니다. 탱커 4마리 기준과 같은 조건의 비교가 아니므로, 궁병이 탱커보다 약하다는 뜻이 아닙니다. 궁병 수에 따른 정확한 환산 자료는 아직 없습니다.':'';
  result.innerHTML=`<h3>거리별 초소 출격 HP</h3><p><strong>계산 기준 화력: ${dps.toFixed(3)} HP/초</strong> · ${profile.source}</p><p class="muted">${tankNote||profile.caveat}</p>${bowNote?`<p class="muted">${bowNote}</p>`:''}<div class="table-wrap"><table><thead><tr><th>거리</th><th>총 이동시간</th><th>출발할 초소 HP</th></tr></thead><tbody>${rows}</tbody></table></div>${exactAnchor}<p class="muted">출격 HP는 평균 피해로 반올림한 예상치입니다. 공격 간격과 초소 점유 판정에 따라 실제 결과는 달라질 수 있습니다.</p>${warning}`;
 }
 formations.forEach(input=>input.addEventListener('change',()=>{
  if(input.checked)formations.filter(other=>other!==input).forEach(other=>{other.checked=false;});
  calculate();
 }));
 [tileTime,siegeMaster,trebuchetPolicy].forEach(input=>input.addEventListener('input',calculate));
 [siegeMaster,trebuchetPolicy].forEach(input=>input.addEventListener('change',calculate));
 calculate();
 window.NTAAttackCalculator={
  calculate:(secondsPerTile,formation='tank',policies={})=>{
   const profile=resolveProfile(formation);
   if(!profile||!Number.isFinite(Number(secondsPerTile)))return [];
   const dps=estimate(profile,policies);
   return Array.from({length:5},(_,index)=>Math.max(0,Math.round(dps*Math.max(0,Number(secondsPerTile)*(index+1)-2))));
  },
  estimateDps:(formation='tank',policies={})=>estimate(resolveProfile(formation),policies),
  formatTime
 };
})();
