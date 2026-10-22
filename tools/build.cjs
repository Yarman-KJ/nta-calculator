const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function render(){return fs.readFileSync(path.join(root,'src/index.template.html'),'utf8').replace(/<!-- NTA_MODULE:([a-z-]+) -->/g,(_,name)=>'<script>\n'+fs.readFileSync(path.join(root,name==='project-data'?'data/current/project-data.js':'src/'+name+'.js'),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>')}
if(require.main===module){const html=render();if(process.argv.includes('--check')){if(html!==fs.readFileSync(path.join(root,'index.html'),'utf8'))throw Error('index.html 재생성 필요');console.log('배포 HTML 바이트 일치')}else fs.writeFileSync(path.join(root,'index.html'),html)}
module.exports={render};
