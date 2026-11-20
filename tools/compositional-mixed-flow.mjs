import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {makeStore,memoryBackend} from '../src/core/store.js';
import {modelCatalog} from '../src/scenarios/composite/catalog.js';
const require=createRequire(import.meta.url);
const {JSDOM}=require(process.env.OPTPREP_TEST_JSDOM||'jsdom');
const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'http://localhost/'});
for(const k of ['window','document','Node','HTMLElement','Element','Event','localStorage','location','navigator'])Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true});
globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};globalThis.confirm=()=>true;
globalThis.matchMedia=dom.window.matchMedia=()=>({matches:true,addEventListener(){}});
window.HTMLElement.prototype.scrollIntoView=()=>{};
const {runFeedbackSession}=await import('../src/ui/runner.js');
const {activatePreset}=await import('../config/presets.js');activatePreset({id:'kickstarter'});
const root=document.querySelector('#view'),button=name=>[...root.querySelectorAll('button')].find(b=>b.textContent===name);
const results={};
for(const section of Object.keys(modelCatalog)){
  let store=makeStore(memoryBackend()); const models=new Set(modelCatalog[section].map(m=>m.id));models.add('linked-sequences');
  const options={sectionId:section,mode:'practice',scope:'all',store};
  let stop=runFeedbackSession(root,options),composite=0;
  for(let i=0;i<10;i++){
    const active=store.practiceSession(section,null,'all');
    assert.ok(active.current.fresh);
    const q=active.current.item;
    if(models.has(q.family))composite++;
    if(i===4){stop();const backup=store.exportJSON();store=makeStore(memoryBackend());store.importJSON(backup);options.store=store;stop=runFeedbackSession(root,options);assert.deepEqual(store.practiceSession(section,null,'all').current.item,q);}
    if(q.kind==='mcq')root.querySelectorAll('[role=radio]')[q.answerIndex].click();
    if(q.kind==='interval'){
      const fields=root.querySelectorAll('.interval input');
      [q.truth*.9,q.truth*1.1].forEach((v,k)=>{fields[k].value=String(v);fields[k].dispatchEvent(new Event('input',{bubbles:true}));});
    }
    if(q.kind==='orderbook')root.querySelector('.ob input[type=checkbox]').click();
    button('Submit').click();
    if(i<9)button('Next (Enter)').click();else button('Finish').click();
  }
  assert.ok(composite>=3,section+' needs regular composite slots');
  assert.equal(store.practiceSession(section,null,'all'),null);
  assert.ok(store.state.runs.some(r=>r.completed && r.items.length===10));
  results[section]={answered:10,composite,reloaded:true};stop();
}
dom.window.close();console.log(JSON.stringify(results));
