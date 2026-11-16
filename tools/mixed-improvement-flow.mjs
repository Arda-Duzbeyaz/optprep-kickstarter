// Exercise public controls and persisted state; all accounts/progress are synthetic.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom = new JSDOM('<main id="view"></main><div id="live"></div><div id="rail"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const k of ['window','document','Node','HTMLElement','Element','Event']) Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true});
globalThis.matchMedia = dom.window.matchMedia = () => ({ matches: true });
globalThis.requestAnimationFrame = () => 1; globalThis.cancelAnimationFrame = () => {};
let now=0, checks=0, stop=()=>{};
Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
const { makeStore, memoryBackend } = await import('../src/core/store.js');
const { runFeedbackSession } = await import('../src/ui/runner.js');
const { progressPage } = await import('../src/ui/pages/progress.js');
const { finiteVariants } = await import('../src/practice/finite-variants.js');
const { PRACTICE_MODULES } = await import('../src/practice/index.js');
const { recognitionStep } = await import('../src/core/recognition.js');
const { questionKey } = await import('../src/core/questions.js');
const { activatePreset } = await import('../config/presets.js');
activatePreset({id:'kickstarter'});
const root=document.getElementById('view'), button=(text)=>[...root.querySelectorAll('button')].find((b)=>b.textContent===text);
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;}, ok=(v,message)=>{assert.ok(v,message);checks++;};
function start(store,family,scope='covered'){stop();stop=runFeedbackSession(root,{sectionId:'bto',mode:'practice',family,scope,store});}
function answer(store,ms=3000){const item=store.practiceSession('bto').current.item;root.querySelectorAll('[role=radio]')[item.answerIndex].click();now+=ms;button('Submit').click();return item;}
function next(index){button(index===9?'Finish':'Next (Enter)').click();}
try {
  const backend=memoryBackend();let store=makeStore(backend);
  store.markCovered('bto','two-dice-sum');store.markCovered('bto','card-symmetry');
  store.state.mastery['bto:legacy']={lv:4,prun:2};store.state.mixedEvidence['bto:legacy']={run:3};
  const legacy=JSON.parse(store.exportJSON());delete legacy.mixedTraining;backend.setItem('optprep:v2',JSON.stringify(legacy));store=makeStore(backend);
  eq(store.mastery()['bto:legacy'],legacy.mastery['bto:legacy']);eq(store.mixedTraining('bto').turn,0);
  start(store);const seen=new Set();
  for(let i=0;i<10;i++){
    const item=store.practiceSession('bto').current.item,key=questionKey(item);eq(seen.has(key),false);seen.add(key);
    ok(!root.querySelector('.qhead').textContent.includes(item.family),'method identifier is hidden');
    if(i===1)button('Used outside help').click();
    if(i===3){const prompt=root.querySelector('.prompt').textContent,turn=store.mixedTraining('bto').turn;stop();stop=()=>{};store=makeStore(backend);start(store);eq(root.querySelector('.prompt').textContent,prompt);eq(store.mixedTraining('bto').turn,turn);}
    if(i===4)[...root.querySelectorAll('button')].find((b)=>b.textContent.startsWith('Hint (')).click();
    answer(store,i===2?90001:3000);
    const row=store.practiceSession('bto').log.at(-1);eq(row.evidenceVersion,1);eq(row.key,key);eq(row.difficulty,item.difficulty);ok(Array.isArray(row.operations));
    eq(row.aided,i===1);eq(row.interrupted,i===3);eq(row.budgetMs,90000);next(i);
  }
  eq(store.mixedTraining('bto').turn,10);ok(root.textContent.includes('6/10 independent within training pace'));ok(root.textContent.includes('2 helped'));
  const run=store.runs('bto','practice').at(-1);eq(run.items.length,10);eq(run.score,10);eq(run.completed,true);
  eq(store.mastery()['bto:legacy'],legacy.mastery['bto:legacy']);eq(store.mixedEvidence()['bto:legacy'],legacy.mixedEvidence['bto:legacy']);
  store.recordRun({section:'bto',mode:'practice',scope:'all',family:null,score:1,max:1,items:[{family:'two-dice-sum',correct:true,ms:2000,score:1,hints:0}]});
  progressPage(root,{store,tab:'pace'});ok(root.textContent.includes('6/10 independent within training pace'));ok(root.textContent.includes('1 earlier answer'));
  start(store);eq(store.mixedTraining('bto').turn,10,'opening a question does not invent an attempted skill');answer(store);eq(store.mixedTraining('bto').turn,11);button('End session').click();
  // Extra-time accuracy remains distinct from independent standard-time evidence.
  store.setSetting('extraTime',1.5);start(store);answer(store);button('End session').click();ok(root.textContent.includes('0/1 independent within training pace'));store.setSetting('extraTime',1);
  // The audit's actual dead end: twenty focused exposures, then fresh mixed proof.
  stop();stop=()=>{};store=makeStore(memoryBackend());
  const history=new Set();
  for(let block=0;block<2;block++){
    start(store,'two-dice-sum');
    for(let i=0;i<10;i++){const item=store.practiceSession('bto').current.item;ok(!history.has(questionKey(item)));history.add(questionKey(item));answer(store);next(i);}
  }
  eq(store.coverage('bto','two-dice-sum').completedBlocks,2);eq(store.recognition(),{},'learning does not grant cold credit');
  store.markCovered('bto','card-symmetry');start(store);
  for(let i=0;i<10;i++){const item=store.practiceSession('bto').current.item;ok(!history.has(questionKey(item)));history.add(questionKey(item));answer(store);next(i);}
  ok(store.recognition()['bto:two-dice-sum'].passed.includes(1),'fresh level-1 proof remains possible after twenty focused exposures');
  eq(store.coverage('bto','two-dice-sum').completedBlocks,2,'mixed work does not change the learning ledger');
  // A genuinely depleted domain is labelled; it neither erases nor fabricates proofs.
  const f=PRACTICE_MODULES.bto.families.find((f)=>f.id==='card-draws');
  let proof;for(let i=0;i<3;i++)proof=recognitionStep(proof,{key:`old-proof:${i}`,difficulty:1,levels:f.levels,correct:true,ms:1000,budgetMs:90000});
  store.state.recognition['bto:card-draws']=proof;store.markCovered('bto',f.id);
  for(const item of finiteVariants(f,2).slice(1))store.rememberQuestion(item);
  progressPage(root,{store,tab:'skills'});ok(root.querySelector('[data-skill="bto:card-draws"]').textContent.includes('Fresh checkpoint evidence unavailable'));
  eq(store.recognition()['bto:card-draws'].passed,[1]);
  console.log(`${checks} mixed-improvement UI assertions passed: old progress, ten-question blocks, exposure ledger reload, real cold gates, detailed results, twenty-exposure checkpoint recovery and honest finite shortage.`);
} finally {stop();dom.window.close();}
