const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {plan,validate,outputs}=require('../tools/split-knowledge.cjs'),root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p)),original=read('references/NTA_통합소스_V6.md'),manifest=JSON.parse(read('knowledge/manifest.json'));
const {rows,out}=outputs(original);assert.equal(rows.length,51);assert.equal(rows.filter(r=>r.layer==='v6').length,8);assert.equal(rows.filter(r=>r.layer==='master').length,18);assert.equal(rows.filter(r=>r.layer==='historical').length,18);assert.equal(rows.filter(r=>r.layer==='appendix').length,6);
assert.deepEqual(manifest.sections,rows.map(({body,...r})=>r));
for(const [p,b]of out)assert.ok(read(p).equals(b),'분리본 또는 색인 불일치: '+p);
validate(original,manifest.sections,read);
assert.ok(Buffer.concat(rows.map(r=>read(r.file))).equals(original),'전체 원문 재조립');
const actual=fs.readdirSync(path.join(root,'knowledge/sections'),{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).length;assert.equal(actual,rows.length,'예상 밖 파일 또는 누락');
assert.throws(()=>validate(original,rows.slice(1),read),'첫 부분 누락 탐지');
assert.throws(()=>validate(original,rows.slice(0,-1),read),'끝 부분 누락 탐지');
assert.throws(()=>validate(original,[rows[0],rows[0],...rows.slice(1)],read),'중복 범위 탐지');
assert.throws(()=>validate(original,rows,p=>p===rows[0].file?Buffer.from('변조'):read(p)),'본문 변경 탐지');
for(const r of rows){const text=read(r.file).toString('utf8');assert.ok(text.includes(r.title));assert.ok(r.startLine<=r.endLine)}
console.log('주제별 51개 파일·범위·해시·색인·전체 재조립 및 누락/중복/변조 탐지 통과');
