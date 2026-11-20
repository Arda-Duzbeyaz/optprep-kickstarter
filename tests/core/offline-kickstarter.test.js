import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const root=new URL('../../',import.meta.url);
const script=readFileSync(new URL('sw.js',root),'utf8');
const files=JSON.parse(readFileSync(new URL('assets/offline-files.json',root)));
test('raw ZIP includes every offline app module, stylesheet and media asset',()=>{
  const actual=[];
  for(const folder of ['src','config','assets']){
    for(const name of readdirSync(new URL(folder+'/',root),{recursive:true})){
      if(/\.(js|css|svg|woff2|png)$/.test(name))actual.push(folder+'/'+name.split('\\').join('/'));
    }
  }
  assert.deepEqual(files,[...new Set(actual)].sort());
});
for(const fromPages of [false,true])test('service worker installs complete cache '+(fromPages?'from Pages manifest':'from local archive'),async()=>{
  let install,requests=0,precached=[];
  const worker=fromPages?script.replace('[/*FILES*/]',JSON.stringify(files)):script;
  runInNewContext(worker,{self:{addEventListener:(k,f)=>{if(k==='install') install=f;}},
    fetch:async path=>{assert.equal(path,'assets/offline-files.json');requests++;return {ok:true,json:async()=>files};},
    caches:{open:async name=>{assert.equal(name,'optprep-kickstarter-2.0.0');return {addAll:async arr=>{precached=[...arr];}};}}});
  let pending;install({waitUntil:p=>{pending=p;}});await pending;
  assert.equal(requests,fromPages?0:1);
  assert.deepEqual(precached,['index.html','app.js','manifest.webmanifest',...files]);
});
