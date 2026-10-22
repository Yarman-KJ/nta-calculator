/* 병종 추천 탭의 랜덤 풀과 제련 후보에서 이름·효과를 검색한다. */
(()=>{
 const targets=[
  {id:'match-pool',label:'이번 판 장비 찾기',aria:'이번 판 장비 풀 검색'},
  {id:'craft-candidates',label:'후보 장비 찾기',aria:'제작·제련 후보 검색'}
 ];
 for(const target of targets){
  const box=document.getElementById(target.id);
  if(!box||box.dataset.searchReady)return;
  box.dataset.searchReady='true';
  const label=document.createElement('label');
  label.className='item-search';
  label.innerHTML=target.label+'<input type="search" placeholder="장비 이름·효과 (예: 치명, 피감)" aria-label="'+target.aria+'">';
  const input=label.querySelector('input');
  const empty=document.createElement('p');
  empty.className='muted item-search-empty';
  empty.setAttribute('role','status');
  empty.textContent='검색 결과가 없습니다.';
  empty.hidden=true;
  box.before(label);
  box.after(empty);
  const apply=()=>{
   const query=input.value.trim();
   let visible=0;
   for(const button of box.querySelectorAll('button[data-name]')){
    const item=Planner.itemMap[button.dataset.name]||Planner.data.equipment.find(x=>x.name===button.dataset.name);
    const match=!query||(item?EquipmentSearch.matches(item,query):button.textContent.includes(query));
    button.hidden=!match;
    if(match)visible++;
   }
   empty.hidden=!query||visible>0;
  };
  input.addEventListener('input',apply);
  new MutationObserver(apply).observe(box,{childList:true});
  apply();
 }
})();
