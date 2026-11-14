// Shared library and prominent mixed-practice controls through the real views.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require(process.env.OPTPREP_TEST_JSDOM||'jsdom');
const dom=new JSDOM('<main id="view"></main><div id="live"></div><div id="rail"></div>',{url:'http://localhost/',pretendToBeVisual:true});
for(const k of ['window','document','Node','HTMLElement','Element','localStorage','Event'])Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true});
globalThis.matchMedia=dom.window.matchMedia=()=>({matches:true});
globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
let now=0,checks=0,stop=()=>{};Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
const {makeStore,memoryBackend}=await import('../src/core/store.js');
const {runFeedbackSession}=await import('../src/ui/runner.js');
const {sectionPage}=await import('../src/ui/pages/section.js');
const {PRACTICE_MODULES}=await import('../src/practice/index.js');
const {EXTRA_FAMILIES}=await import('../src/transfer/index.js');
const {activatePreset}=await import('../config/presets.js');
activatePreset({id:'kickstarter'});
const root=document.getElementById('view'),button=label=>[...root.querySelectorAll('button')].find(b=>b.textContent===label);
function ok(v,label){assert.ok(v,label);checks++;}function eq(a,b,label){assert.deepEqual(a,b,label);checks++;}
function answer(store,section){const item=store.practiceSession(section).current.item;
 if(item.kind==='mcq')root.querySelectorAll('[role=radio]')[item.answerIndex].click();
 else if(item.kind==='rank')for(const si of item.answerOrder){const target=item.answerOrder.indexOf(si);while([...root.querySelectorAll('.rank-row')].findIndex(r=>Number(r.dataset.si)===si)>target)root.querySelector(`.rank-row[data-si="${si}"] [aria-label="Move up"]`).click();}
 else if(item.kind==='interval')for(const [i,value]of [item.truth*.999,item.truth*1.001].entries()){const input=root.querySelectorAll('input')[i];input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}
 now+=2000;button('Submit').click();return item;}
try{
 for(const section of ['bto','nl','ll','iv','ob']){
  const store=makeStore(memoryBackend());sectionPage(root,{store,id:section});
  const start=root.querySelector('[data-action="mixed-practice"]'),pool=root.querySelector('[aria-label="Mixed practice question pool"]');
  ok(start&&!start.closest('details'),'main action is outside optional tools');eq(start.getAttribute('href'),`#/run/${section}/mixed/all`);
  eq(pool.options[0].textContent,`All ${PRACTICE_MODULES[section].families.length} skills`);
  for(const f of PRACTICE_MODULES[section].families.slice(0,2))store.markCovered(section,f.id);
  sectionPage(root,{store,id:section});const choice=root.querySelector('[aria-label="Mixed practice question pool"]');
  choice.value='all';choice.dispatchEvent(new Event('change'));eq(store.settings().mixedPool[section],'all');
  choice.value='covered';choice.dispatchEvent(new Event('change'));eq(root.querySelector('[data-action="mixed-practice"]').getAttribute('href'),`#/run/${section}/mixed/covered`);
 }
 for(const family of EXTRA_FAMILIES){
  const backend=memoryBackend();let store=makeStore(backend);
  stop=runFeedbackSession(root,{store,sectionId:family.section,mode:'practice',family:family.id});
  eq(store.practiceSession(family.section).current.item.family,family.id);ok(root.textContent.includes(family.title));
  answer(store,family.section);const saved=JSON.parse(store.exportJSON());stop();store=makeStore(backend);
  stop=runFeedbackSession(root,{store,sectionId:family.section,mode:'practice',family:family.id});
  ok(root.querySelector('.solution'),'extended-family feedback resumes');
  // Save timestamps legitimately change on resume; answer evidence must not.
  eq(store.stats(),saved.stats,'feedback does not double-count');eq(store.state.activity,saved.activity,'XP is unchanged');eq(store.srs,saved.srs,'revision schedule is unchanged');
  eq(store.practiceSession(family.section).current.item,saved.activePractice[family.section].current.item,'the same extended question resumes');
  eq(store.recognition(),{},'learning extended maths is still learning-only');stop();stop=()=>{};
 }
 // Both formerly exclusive BTO families can now earn ordinary mixed checkpoints.
 const store=makeStore(memoryBackend()),pool=EXTRA_FAMILIES.filter(f=>f.section==='bto').map(f=>f.id);
 for(const f of pool)store.markCovered('bto',f);
 stop=runFeedbackSession(root,{store,sectionId:'bto',mode:'practice',scope:'covered'});
 eq(store.practiceSession('bto').familyPool,pool);
 for(let i=0;i<10;i++){const item=answer(store,'bto');ok(pool.includes(item.family));if(i<9)button('Next (Enter)').click();}
 for(const family of pool)eq(store.recognition()[`bto:${family}`].passed,[2]);
 button('Finish').click();ok(root.textContent.includes('Next:'));
 console.log(`${checks} shared-practice assertions passed: prominent actions, all/covered pool settings, every extended family in learning, feedback/resume, cold mixed progression and next-step guidance.`);
}finally{stop();dom.window.close();}
