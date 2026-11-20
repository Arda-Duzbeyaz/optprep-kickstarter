import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { makeStore, memoryBackend } from '../src/core/store.js';
import { SECTIONS } from '../config/sections.js';
import { activatePreset } from '../config/presets.js';
import { SECTION_MODULES } from '../src/sections/index.js';
import { buildPaper } from '../src/scenarios/paper.js';
const require=createRequire(import.meta.url);
const {JSDOM}=require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'http://localhost/'});
for(const k of ['window','document','Node','HTMLElement','Element','localStorage','location','navigator','Event','CustomEvent'])
  Object.defineProperty(globalThis,k,{configurable:true,value:dom.window[k]});
globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
globalThis.matchMedia=dom.window.matchMedia=()=>({matches:true,addEventListener(){}});
globalThis.confirm=()=>true;window.HTMLElement.prototype.scrollIntoView=()=>{};
const {runExam}=await import('../src/ui/runner.js');
const root=document.querySelector('#view'),store=makeStore(memoryBackend());
activatePreset({id:'kickstarter'});
store.setSetting('numericalMix','broad');
const button=label=>[...root.querySelectorAll('button')].find(b=>b.textContent===label);
const results={};
for(const id of ['bto','nl','ll','iv','ob']){
  const seed='timed-controls-19',cfg={count:SECTIONS[id].exam.count,ramp:id==='nl',bankRatio:.2};
  const items=buildPaper(SECTION_MODULES[id],cfg,seed,'broad');
  let wrongPass=0,correctPass=0;
  const stop=runExam(root,{sectionId:id,store,seed});
  button('Start the clock').click();
  for(const [i,q] of items.entries()){
    assert.ok(root.querySelector('.qhead').textContent.includes('Question '+(i+1)+' of '+items.length));
    if(id==='nl'||id==='bto'){root.querySelectorAll('[role=radio]')[q.answerIndex].click();button('Next').click();}
    if(id==='ll'){
      for(const [target,si] of q.answerOrder.entries()){
        while([...root.querySelectorAll('.rank-row')].findIndex(row=>Number(row.dataset.si)===si)>target)
          root.querySelector('.rank-row[data-si="'+si+'"] [aria-label="Move up"]').click();
      }
      button('Next').click();
    }
    if(id==='iv'){
      const bounds=i===0?[q.truth*2,q.truth*3]:[q.truth*.9,q.truth*1.1];
      const inputs=root.querySelectorAll('.interval input');
      bounds.forEach((x,k)=>{inputs[k].value=String(x);inputs[k].dispatchEvent(new Event('input',{bubbles:true}));});button('Next').click();
    }
    if(id==='ob'){
      if(!q.best || !wrongPass){
        root.querySelector('.ob input[type=checkbox]').click();if(!q.best)correctPass++;else wrongPass++;
      }else{
        for(const trade of q.best.trades){
          const index=q.board.instruments.findIndex(x=>x.id===trade.id);
          root.querySelectorAll('.ob-'+trade.side)[index].click();
        }
      }
      button('Submit position').click();
    }
  }
  if(id==='nl') button('Finish exam').click();
  const run=store.runs(id,'exam').at(-1);
  assert.equal(run.generatorEdition,'2.0');assert.equal(run.repeatCount,0);assert.equal(run.items.length,items.length);
  if(id==='bto'||id==='ll')assert.equal(run.score,items.length);
  if(id==='nl'){assert.equal(run.score,items.length);assert.equal(run.numericalMix,'broad');}
  if(id==='iv'){assert.equal(run.items[0].outcome,'below');assert.equal(run.items[0].widthRatio,1.5);assert.ok(run.items.slice(1).every(i=>i.outcome==='right'));}
  if(id==='ob'){assert.equal(wrongPass,1);assert.ok(correctPass>0);assert.equal(run.score,items.length-1);}
  results[id]={submissions:items.length,...(id==='ob'?{correctPass,wrongPass}:{})};
  stop();
}
console.log(JSON.stringify(results));dom.window.close();
