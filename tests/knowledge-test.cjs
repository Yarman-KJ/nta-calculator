const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p));
const manifest=JSON.parse(read('references/manifest.json')),original=read('references/'+manifest.file);
assert.equal(original.length,manifest.bytes);assert.equal(crypto.createHash('sha256').update(original).digest('hex'),manifest.sha256);
const records=JSON.parse(read('data/current/evidence.json')).records,classes=new Set(['source-evidence','user-confirmed','operating-policy','unverified']),ids=new Set();
for(const r of records){assert.ok(!ids.has(r.id));ids.add(r.id);assert.ok(classes.has(r.classification));assert.ok(r.scope&&r.verification);assert.ok(Object.hasOwn(r,'gameVersion'));assert.equal(r.source.file,'references/'+manifest.file);assert.ok(original.toString('utf8').includes(r.source.quote),'근거 인용 누락: '+r.id)}
assert.deepEqual(new Set(records.map(r=>r.classification)),classes);
assert.equal(records.find(r=>r.id==='bounce-trigger').classification,'unverified');
assert.equal(records.find(r=>r.id==='fixed-damage-count').classification,'operating-policy');
assert.equal(require('../tools/build.cjs').render(),read('index.html').toString('utf8'));
console.log('원문 해시·근거 인용·판정 분리·배포 HTML 바이트 일치 통과');
