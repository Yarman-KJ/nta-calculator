/* 이번 판 입력만 저장한다. 개인 추천 기준과 공략 체크리스트는 별도로 보존한다. */
(()=>{
 const key='nta-current-game-v1',status=document.getElementById('session-save-status');
 let restoring=true,resetting=false,timer;
 const fields=()=>[...document.querySelectorAll('input[id],select[id],input[data-policy],input[name="attack-formation"]')].filter(e=>!['file','search'].includes(e.type)&&!e.id.startsWith('editor-')&&e.id!=='language-select');
 function readFields(){return fields().map(e=>({id:e.id,policy:e.dataset.policy,name:e.name,value:e.value,checked:e.checked}));}
 function applyFields(rows){for(const row of rows||[]){const e=row.id?document.getElementById(row.id):fields().find(x=>row.policy?x.dataset.policy===row.policy:x.name===row.name&&x.value===row.value);if(!e||e.type==='file')continue;if(e.type==='checkbox'||e.type==='radio')e.checked=!!row.checked;else if(e.tagName!=='SELECT'||[...e.options].some(o=>o.value===row.value))e.value=row.value;}}
 function readPanels(){return [...document.querySelectorAll('.panel')].map((e,i)=>({id:e.id,index:i,open:e.querySelector('.panel-collapse-button')?.getAttribute('aria-expanded')!=='false'}));}
 function applyPanels(rows){for(const r of rows||[]){const panel=r.id?document.getElementById(r.id):document.querySelectorAll('.panel')[r.index],button=panel?.querySelector('.panel-collapse-button');if(button&&(button.getAttribute('aria-expanded')==='true')!==r.open)button.click();}}
 function save(){clearTimeout(timer);if(restoring||resetting)return;try{localStorage.setItem(key,JSON.stringify({version:1,hub:Hub.exportSession(),squads:window.NTASquads?.exportSession(),fields:readFields(),panels:readPanels(),page:document.querySelector('[data-page][aria-pressed="true"]')?.dataset.page||'units'}));if(status)status.textContent='자동 저장됨';}catch(e){if(status)status.textContent='브라우저 저장 공간을 확인하세요';}}
 function schedule(){if(restoring||resetting)return;clearTimeout(timer);timer=setTimeout(save,150);}
 try{const raw=localStorage.getItem(key);if(raw){const data=JSON.parse(raw);if(data.version===1&&data.hub){applyFields(data.fields);Hub.restoreSession(data.hub);window.NTASquads?.restoreSession(data.squads);applyFields(data.fields);Hub.refreshGearSummary();applyPanels(data.panels);Hub.showPage(data.page||'units');const policy=document.getElementById('policy-summary');if(policy)policy.textContent='공격 정책 · 1단계 · '+document.querySelectorAll('[data-policy]:checked').length+'개 선택';document.getElementById('attack-tile-time')?.dispatchEvent(new Event('input',{bubbles:true}));if(status)status.textContent='이전 설정 복원됨 · 자동 저장';}}}catch(e){if(status)status.textContent='이전 설정을 복원하지 못했습니다';console.warn('이번 판 설정 복원 실패',e);}
 restoring=false;
 for(const event of ['input','change','click','toggle','nta-unit-transfer'])document.addEventListener(event,schedule,true);
 window.addEventListener('pagehide',save);window.addEventListener('beforeunload',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
 document.getElementById('reset-current-game')?.addEventListener('click',()=>{if(!confirm('이번 판 장비와 보스 편성을 초기화할까요? 직접 편집한 추천 기준과 공략 체크리스트는 유지됩니다.'))return;resetting=true;clearTimeout(timer);try{localStorage.removeItem(key);location.reload();}catch(e){resetting=false;if(status)status.textContent='브라우저 저장 공간을 확인하세요';}});
 window.NTASession={save};
})();
