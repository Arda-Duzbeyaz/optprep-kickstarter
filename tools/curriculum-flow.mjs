// New-family integration using public controls and isolated, synthetic old progress.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require(process.env.OPTPREP_TEST_JSDOM||'jsdom');
const dom=new JSDOM('<main id="view"></main><div id="live"></div><div id="rail"></div>',{url:'http://localhost/',pretendToBeVisual:true});
for(const k of ['window','document','Node','HTMLElement','Element','Event'])Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true});
globalThis.matchMedia=dom.window.matchMedia=()=>({matches:true});globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
let now=0,checks=0,stop=()=>{};Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
const {makeStore,memoryBackend}=await import('../src/core/store.js');
const {runFeedbackSession}=await import('../src/ui/runner.js');
const {progressPage}=await import('../src/ui/pages/progress.js');
const {PRACTICE_MODULES}=await import('../src/practice/index.js');
const {questionKey}=await import('../src/core/questions.js');
const {activatePreset}=await import('../config/presets.js');
const {lessonForFamily}=await import('../src/study/catalog.js');
const {blankV2}=await import('../src/core/migrate.js');
activatePreset({id:'kickstarter'});
const root=document.getElementById('view'),button=t=>[...root.querySelectorAll('button')].find(b=>b.textContent===t);
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;},ok=(v,m)=>{assert.ok(v,m);checks++;};
function start(store,family){stop();stop=runFeedbackSession(root,{sectionId:'bto',mode:'practice',family,scope:'covered',store});}
function answer(store,{wrong=false}={}){const item=store.practiceSession('bto').current.item;root.querySelectorAll('[role=radio]')[wrong?(item.answerIndex+1)%5:item.answerIndex].click();now+=2000;button('Submit').click();return item;}
const ids=['event-algebra','success-counts','payout-models','restricted-counting','variance-dependence','discrete-sums'];
try {
  const backend=memoryBackend(),old=blankV2();old.settings.preset={id:'kickstarter'};old.mastery['bto:two-dice-sum']={lv:4,prun:2};
  old.learningCoverage['bto:two-dice-sum']={covered:true,completedBlocks:2,answers:20};
  old.recognition['bto:two-dice-sum']={attempts:8,passed:[1],streak:2};
  backend.setItem('optprep:v2',JSON.stringify(old));let store=makeStore(backend);
  const preserved={mastery:structuredClone(store.mastery()),coverage:structuredClone(store.state.learningCoverage['bto:two-dice-sum']),recognition:structuredClone(store.recognition())};
  const history=new Set();
  for(const id of ids){
    ok(lessonForFamily('bto',id),`${id} has a real linked lesson`);start(store,id);
    const first=store.practiceSession('bto').current.item;eq(first.family,id);
    // A saved new-family question, including draft, resumes verbatim after reload.
    root.querySelectorAll('[role=radio]')[2].click();const saved=structuredClone(store.practiceSession('bto').current);stop();stop=()=>{};store=makeStore(backend);start(store,id);
    eq(store.practiceSession('bto').current.item,saved.item);eq(store.practiceSession('bto').current.response,saved.response);
    for(let i=0;i<10;i++){
      const item=store.practiceSession('bto').current.item;eq(item.difficulty,PRACTICE_MODULES.bto.families.find(f=>f.id===id).levels[0]);ok(!history.has(questionKey(item)));history.add(questionKey(item));
      if(i===0)[...root.querySelectorAll('button')].find(b=>b.textContent.startsWith('Hint (')).click();answer(store,{wrong:i===1});if(i<9)button('Next (Enter)').click();
    }
    eq(store.coverage('bto',id).completedBlocks,1);eq(store.coverage('bto',id).covered,true);eq(store.recognition()[`bto:${id}`],undefined,'guided work does not grant cold passes');button('Finish').click();
  }
  eq(store.mastery(),preserved.mastery);eq(store.state.learningCoverage['bto:two-dice-sum'],preserved.coverage);eq(store.recognition(),preserved.recognition);
  progressPage(root,{store,tab:'skills'});for(const id of ids)ok(root.querySelector(`[data-skill="bto:${id}"]`).textContent.includes('Learning complete'));
  start(store);const pool=store.practiceSession('bto').familyPool;for(const id of ids)ok(pool.includes(id));
  for(let i=0;i<10;i++){
    const item=store.practiceSession('bto').current.item;ok(!root.querySelector('.qhead').textContent.includes(item.family));ok(!history.has(questionKey(item)));history.add(questionKey(item));answer(store);button(i===9?'Finish':'Next (Enter)').click();
  }
  eq(store.runs('bto','practice').at(-1).items.length,10);eq(store.mixedTraining('bto').turn,10);
  ok(ids.some(id=>store.recognition()[`bto:${id}`]?.attempts>0),'new families accrue independent mixed evidence');
  console.log(`${checks} curriculum integration assertions passed: six real lessons, sixty fresh focused answers, saved-question/draft reload, preserved old progress, assisted coverage and a ten-question hidden-method mixed block.`);
}finally{stop();dom.window.close();}
