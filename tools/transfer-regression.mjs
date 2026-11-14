// Focused interface regressions beyond the original smoke check.
// Optional development dependency: npm install --no-save jsdom
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom = new JSDOM('<main id="view"></main><div id="live"></div>', { url: 'http://localhost/#/transfer' });
for (const name of ['window','document','Node','HTMLElement','Element','localStorage']) Object.defineProperty(globalThis,name,{value:dom.window[name],configurable:true});
globalThis.matchMedia=()=>({matches:true}); dom.window.matchMedia=globalThis.matchMedia; globalThis.confirm=()=>true;
let now=0,frame=0;const frames=new Map();
Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
globalThis.requestAnimationFrame=(fn)=>{frames.set(++frame,fn);return frame;};globalThis.cancelAnimationFrame=(id)=>frames.delete(id);
const {runTransfer}=await import('../src/ui/pages/transfer.js');
const {makeStore,memoryBackend}=await import('../src/core/store.js');
const {EXTRA_FAMILIES}=await import('../src/transfer/index.js');
const {SECTION_MODULES}=await import('../src/sections/index.js');
const {makeRng}=await import('../src/core/rng.js');
const {questionKey}=await import('../src/core/questions.js');
const {structureKey}=await import('../src/transfer/profile.js');
const {presetPicker}=await import('../src/ui/pages/path.js');
const {activatePreset,activePreset,presetSections}=await import('../config/presets.js');
const root=document.getElementById('view'),button=(label)=>[...root.querySelectorAll('button')].find(b=>b.textContent===label);
const generate=(id,difficulty=3)=>EXTRA_FAMILIES.find(f=>f.id===id).generate(makeRng(`regression:${id}`),{difficulty});
const rows=(items)=>items.map(item=>({item,key:questionKey(item),structure:structureKey(item),repeat:false,newStructure:true,extended:!!item.transfer}));
let stop=()=>{};
function start(items,timed=false){stop();const store=makeStore(memoryBackend());stop=runTransfer(root,{store,timed,items:rows(items),seed:'regression'});return store;}
const mcq=generate('information-protocols'),rank=generate('selection-weights'),interval=generate('rates-weights');
const wrong=(mcq.answerIndex+1)%5;
function reviewMcq(){start([mcq]);root.querySelectorAll('.option')[wrong].click();button('Submit and next').click();}
const tests=[
 ['review restores and locks the submitted MCQ',()=>{reviewMcq();assert.equal(root.querySelectorAll('.option:not(:disabled)').length,0);assert.equal(root.querySelector('.option[aria-checked="true"] .val').textContent,mcq.options[wrong].label);assert.equal(root.querySelectorAll('.option.is-correct').length,1);assert.equal(root.querySelectorAll('.option.is-wrong').length,1);} ],
 ['additional-family review links into the shared ordinary-practice library',()=>{reviewMcq();assert.ok([...root.querySelectorAll('a')].some(a=>a.getAttribute('href')===`#/run/bto/practice/${mcq.family}`));}],
 ['ranking review shows probabilities and retains the submitted order',()=>{start([rank]);const expected=[...root.querySelectorAll('.rank-row')].map(r=>Number(r.dataset.si));button('Submit and next').click();assert.deepEqual([...root.querySelectorAll('.rank-row')].map(r=>Number(r.dataset.si)),expected);assert.equal(root.querySelectorAll('.rank-p:not([hidden])').length,3);assert.equal(root.querySelectorAll('.rank-move button:not(:disabled)').length,0);}],
 ['interval review restores bounds and disables its controls',()=>{start([interval]);const values=[interval.truth*.9,interval.truth*1.1];root.querySelectorAll('input').forEach((el,i)=>{el.value=values[i];el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});button('Submit and next').click();const fields=root.querySelectorAll('input');assert.equal(Number(fields[0].value),values[0]);assert.equal(Number(fields[1].value),values[1]);assert.ok([...fields].every(el=>el.disabled));}],
 ['orderbook review restores the submitted position and locks controls',()=>{const item=SECTION_MODULES.ob.families.find(f=>f.id==='hidden').generate(makeRng('regression:board'),{difficulty:4});start([item]);for(const t of item.best.trades){const i=item.board.instruments.findIndex(x=>x.id===t.id);root.querySelectorAll('.ob-table tbody tr')[i].querySelector(`.ob-${t.side}`).click();}button('Submit and next').click();assert.match(root.querySelector('.ob-net').textContent,/Net:/);assert.equal(root.querySelectorAll('.ob button:not(:disabled)').length,0);}],
 ['answers changed after the item deadline do not replace the last valid answer',()=>{const store=start([mcq,rank],true);root.querySelectorAll('.option')[wrong].click();now+=91000;root.querySelectorAll('.option')[mcq.answerIndex].click();button('Submit and next').click();button('Finish session').click();assert.equal(store.transferRuns()[0].items[0].score,-1);}],
 ['the overall deadline is enforced before submitting or showing another item',()=>{const store=start([mcq,rank],true);root.querySelectorAll('.option')[wrong].click();now+=1200001;button('Submit and next').click();assert.match(root.textContent,/Batch check: review/);assert.equal(store.transferRuns()[0].items.length,1);assert.equal([...store.recentQuestionKeys('bto')].length,1);}],
 ['a late skip cannot erase an answer already committed before timeout',()=>{const store=start([mcq,rank],true);root.querySelectorAll('.option')[wrong].click();now+=91000;button('Skip').click();button('Finish session').click();assert.equal(store.transferRuns()[0].items[0].score,-1);assert.equal(store.transferRuns()[0].items[0].skipped,false);}],
 ['keyboard answers after the deadline are ignored',()=>{const store=start([mcq,rank],true);root.querySelectorAll('.option')[wrong].click();now+=91000;document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ABCDE'[mcq.answerIndex],bubbles:true,cancelable:true}));button('Finish session').click();assert.equal(store.transferRuns()[0].items[0].score,-1);}],
 ['finishing on the last displayed question records a complete session',()=>{const store=start([mcq]);root.querySelectorAll('.option')[mcq.answerIndex].click();button('Finish session').click();assert.equal(store.transferRuns()[0].completed,true);}],
 ['saving an unchanged fresh battery picker preserves the active Kickstarter preset',()=>{const store=makeStore(memoryBackend());activatePreset(store.settings().preset);const before=activePreset().id;root.replaceChildren(presetPicker(store,{compact:true}));button('Save').click();assert.equal(activePreset().id,before,'Save must not silently switch a new browser to Everything');assert.equal(store.settings().preset.id,'kickstarter');assert.equal(root.querySelector('input[value="kickstarter"]').checked,true);assert.ok(!presetSections(activePreset()).includes('mm'));}],
];
let failures=0;
for(const [name,fn] of tests){try{fn();console.log(`PASS ${name}`);}catch(e){failures++;console.log(`FAIL ${name}: ${e.message}`);}finally{stop();}}
dom.window.close();console.log(`${tests.length-failures}/${tests.length} focused interface regressions passed`);if(failures)process.exitCode=1;
