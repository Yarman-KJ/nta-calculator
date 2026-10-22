const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source='references/NTA_통합소스_V6.md';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const topics=['읽기와 패치','이동·타깃·겹사','피해 계산','분노·회복·보호막','보스','장비·제련','공타·거점','파밍·성장','병종','영웅·재능','장비 도감','정책','추천·개인 기록','영상·검증','계산기·분석 방법','사이트 아이디어'];
function plan(buffer){
 const lines=buffer.toString('utf8').match(/[^\n]*\n|[^\n]+$/g)||[],cuts=[];let layer='v6';
 const add=(i,file,topic)=>cuts.push({startLine:i+1,file,title:lines[i].trim().replace(/^#+\s*/,''),layer,topic});
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();
  if(i===0)add(i,'v6/00-introduction.md','읽기와 우선순위');
  else if(line==='# 기존 통합 마스터 원문 — 아래 내용은 삭제·재작성 없이 보존'){layer='master';add(i,'master/00-introduction.md','읽기와 우선순위')}
  else if(line==='# 보존 부록: 동기화된 소스 마스터 원문 — 버전 차이 보존'){layer='historical';add(i,'historical/00-introduction.md','버전 차이')}
  else if(/^# 보존 부록:/.test(line)){layer='appendix';const n=cuts.filter(c=>c.layer==='appendix').length+1;add(i,`appendices/${String(n).padStart(2,'0')}.md`,line.slice(2))}
  else if(line==='# 복원용 자료 위치'){layer='recovery';add(i,'recovery/locations.md','복원 위치')}
  else if(layer==='v6'&&/^## [1-7]\. /.test(line)){const n=Number(line.match(/^## (\d)/)[1]);add(i,`v6/${String(n).padStart(2,'0')}.md`,['장비 추천','재제련','피해·분노·보호막·이동','파밍·성장·공타','충돌·미확인','답변 절차','보존 범위'][n-1])}
  else if(['master','historical'].includes(layer)&&/^## 제\d+장\./.test(line)){const n=Number(line.match(/^## 제(\d+)/)[1]);add(i,`${layer}/${String(n).padStart(2,'0')}.md`,topics[n-1])}
  else if(['master','historical'].includes(layer)&&line==='## 부록. 정정 색인·출처·통합 대응표')add(i,`${layer}/17-corrections.md`,'정정·출처');
 }
 let byte=0;
 return cuts.map((c,i)=>{const endLine=cuts[i+1]?cuts[i+1].startLine-1:lines.length,body=Buffer.from(lines.slice(c.startLine-1,endLine).join(''),'utf8');const row={...c,file:'knowledge/sections/'+c.file,endLine,startByte:byte,endByte:byte+body.length,sha256:hash(body),body};byte+=body.length;return row});
}
function validate(buffer,rows,read){let end=0;const files=new Set();for(const r of rows){if(files.has(r.file)||r.startByte!==end||r.endByte<=r.startByte)throw Error('중복 또는 누락 범위');files.add(r.file);const b=read(r.file);if(!b.equals(buffer.subarray(r.startByte,r.endByte))||hash(b)!==r.sha256)throw Error('원문 불일치: '+r.file);end=r.endByte}if(end!==buffer.length)throw Error('원문 끝 누락')}
function outputs(buffer){const rows=plan(buffer),out=new Map(rows.map(r=>[r.file,r.body]));
 const metadata=rows.map(({body,...r})=>r);
 out.set('knowledge/manifest.json',Buffer.from(JSON.stringify({schemaVersion:1,source,sourceSha256:hash(buffer),sourceBytes:buffer.length,meaning:'원문을 범위별로 자른 사본. 확정 수준과 최신성은 원문 그대로이며 신규 검증 아님.',sections:metadata},null,2)+'\n'));
 let index='# NTA 주제별 소스 찾아보기\n\n이 폴더는 V6 전체를 누락 없이 나눈 읽기용 사본입니다. 요약이나 새 게임 판정이 아닙니다. 사이트 화면에 게시한 자료가 아니라 저장소에서 필요한 부분만 읽기 위한 구조입니다.\n\n먼저 [읽기와 우선순위](sections/v6/00-introduction.md), [충돌·미확인](sections/v6/05.md)을 확인하세요. 같은 대상·조건·버전에서만 최신 사용자 정정을 우선합니다. 사용자 확정·운영 정책·미확인은 원문의 표시와 범위를 그대로 유지합니다.\n\n## 빠른 선택\n\n|주제|먼저 읽을 V6 보강|상세 본문|과거 버전 대조|\n|---|---|---|---|\n';
 const route=[[ '장비 추천·제련',[1,2],[6,11,13] ],['이동·타깃·겹사',[3],[2]],['피해·분노·보호막',[3],[3,4]],['보스',[4],[5]],['공타·거점',[4],[7]],['파밍·성장',[4],[8]],['병종',[1],[9]],['영웅·재능',[3],[10]],['정책',[4],[12]],['영상·검증',[5],[14]],['패치·분석 절차',[5,6],[1,15]],['사이트 아이디어',[6],[16]]];
 const link=(layer,n)=>{const r=rows.find(r=>r.layer===layer&&r.file===`knowledge/sections/${layer}/${String(n).padStart(2,'0')}.md`);return `[${r.topic}](${r.file.replace('knowledge/','')})`};
 for(const [name,v,m]of route)index+=`|${name}|${v.map(n=>link('v6',n)).join(' · ')}|${m.map(n=>link('master',n)).join(' · ')}|${m.map(n=>link('historical',n)).join(' · ')}|\n`;
 index+='\n## 전체 범위와 출처\n\n과거 버전은 비교할 때만 읽으며 현행 판단과 합치지 않습니다. 아래의 줄 번호는 보존된 V6 기준입니다. 각 파일은 원문 조각이므로 원문에 있던 다른 파일·이미지·문서 내부 링크가 분리본에서 바로 열리지 않을 수 있습니다. 링크를 임의로 고치지 않았습니다. 문서 내부 연결은 이 색인 또는 원문을 사용하고, 동봉되지 않은 외부 자료는 미확인으로 남깁니다.\n\n';
 for(const layer of ['v6','master','historical','appendix','recovery']){index+=`### ${{v6:'V6 현행 보강',master:'기존 통합 마스터 본문',historical:'과거 동기화 소스 — 버전 차이 보존',appendix:'원문 부록',recovery:'복원 위치'}[layer]}\n\n`;for(const r of rows.filter(r=>r.layer===layer))index+=`- [${r.title}](${r.file.replace('knowledge/','')}) — 원문 ${r.startLine}~${r.endLine}행\n`;index+='\n'}
 index+='## 관리 방법\n\n원문 조각을 직접 수정하지 않습니다. 새 분석과 판정은 현행 데이터·근거 기록에 별도로 반영합니다. 새 원문이 생기면 기존 V6를 덮어쓰지 말고 별도 버전으로 보존합니다. `node tools/split-knowledge.cjs --check`로 원문과 분리본을 검사합니다. `manifest.json`에 각 파일의 범위와 해시가 있습니다.\n';
 out.set('knowledge/README.md',Buffer.from(index.replace('全文','전체')));return {rows,out};
}
if(require.main===module){const buffer=fs.readFileSync(path.join(root,source)),{rows,out}=outputs(buffer);for(const [file,b]of out){const p=path.join(root,file);if(process.argv.includes('--check')){if(!fs.existsSync(p)||!fs.readFileSync(p).equals(b))throw Error('분리본 갱신 필요: '+file)}else{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b)}}validate(buffer,rows,p=>fs.readFileSync(path.join(root,p)));console.log(`원문 ${buffer.length}바이트 → ${rows.length}개 파일: 누락·변경 없이 일치`)}
module.exports={plan,validate,outputs};
