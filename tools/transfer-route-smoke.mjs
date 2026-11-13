// Exercise the real app router, page controls and browser storage in a DOM.
// Optional development dependency: npm install --no-save jsdom
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url), { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const appRoot = process.env.OPTPREP_QA_ROOT || fileURLToPath(new URL('../', import.meta.url));
const load = (p) => import(pathToFileURL(resolve(appRoot, p)).href);
const dom = new JSDOM(readFileSync(resolve(appRoot, 'index.html'), 'utf8'), { url: 'http://localhost/#/transfer' });
for (const name of ['window','document','Node','HTMLElement','Element','localStorage','location','navigator','Event','CustomEvent','Blob','File']) Object.defineProperty(globalThis,name,{value:dom.window[name],configurable:true});
globalThis.matchMedia = dom.window.matchMedia = () => ({ matches:true, addEventListener(){} });
dom.window.scrollTo = () => {};
globalThis.confirm = () => true;
globalThis.fetch = async () => ({ ok:false, json:async()=>({ok:false}) }); // no live accounts or backend
let now = 0, frame = 0; const frames = new Map(), intervals = new Set();
Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
globalThis.requestAnimationFrame = (f) => { frames.set(++frame,f); return frame; };
globalThis.cancelAnimationFrame = (id) => frames.delete(id);
const originalInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const id=originalInterval(...args); intervals.add(id); return id; };
const originalDateNow = Date.now, fixedDate = Date.UTC(2026,10,12,12);
Date.now = () => fixedDate;
const { blankV2 } = await load('src/core/migrate.js');
const { makeStore } = await load('src/core/store.js');
const { transferItems } = await load('src/transfer/draw.js');
const { SECTION_MODULES } = await load('src/sections/index.js');
const oldSave = blankV2();
delete oldSave.recentStructures; delete oldSave.transferRuns;
oldSave.settings.preset={id:'kickstarter'};
oldSave.stats['bto:two-dice-sum']={n:2,correct:1,ms:1000};
localStorage.setItem('optprep:v2',JSON.stringify(oldSave));
const root = document.getElementById('view');
const button=(label)=>[...root.querySelectorAll('button')].find(b=>b.textContent===label);
const snapshot=()=>JSON.parse(localStorage.getItem('optprep:v2'));
const nextTurn=()=>new Promise(r=>setTimeout(r,10));
async function until(predicate,label){for(let i=0;i<200;i++){if(predicate())return;await nextTurn();}throw new Error(`Timeout: ${label}; ${root.textContent.slice(0,150)}`);}
async function route(hash,heading){location.hash=hash;await until(()=>root.querySelector('h1')?.textContent===heading,hash);}
function advance(ms){now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(f=>f(now));}
function key(key,repeat=false){document.activeElement.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key,repeat,bubbles:true,cancelable:true}));}
function answer(row){const item=row.item;
 if(item.kind==='mcq'){key(String(item.answerIndex+1));assert.equal(root.querySelectorAll('.option')[item.answerIndex].getAttribute('aria-checked'),'true');}
 else if(item.kind==='rank'){for(let target=0;target<3;target++){const si=item.answerOrder[target];while([...root.querySelectorAll('.rank-row')].findIndex(r=>Number(r.dataset.si)===si)>target)root.querySelector(`.rank-row[data-si="${si}"] button[aria-label="Move up"]`).click();}}
 else if(item.kind==='interval'){const inputs=root.querySelectorAll('input');for(const [i,v] of [item.truth*.999,item.truth*1.001].entries()){inputs[i].value=v;inputs[i].dispatchEvent(new Event('input',{bubbles:true}));}}
 else for(const trade of item.best.trades){const i=item.board.instruments.findIndex(x=>x.id===trade.id);root.querySelectorAll('.ob-table tbody tr')[i].querySelector(`.ob-${trade.side}`).click();}
}
try {
 await load('app.js');
 await until(()=>root.querySelector('h1')?.textContent==='Transfer Challenge','initial route');
 assert.ok(document.querySelector('#nav a[href="#/transfer"]'),'sidebar link works');
 root.querySelector('#transfer-scope').value='all';
 root.querySelector('#transfer-timing').value='untimed';
 const plan=transferItems(SECTION_MODULES,{seed:fixedDate,questionHistory:oldSave.recentQuestions,structureHistory:{}});
 button('Start Transfer Challenge').click();
 advance(1500000);assert.match(root.querySelector('.qhead').textContent,/Question 1 of 15/,'page timing selection really starts untimed');
 for(let i=0;i<plan.length;i++){
  assert.equal(root.querySelectorAll('details').length,0,'no solution leaked before review');
  answer(plan[i]);advance(1000);
  if(i<14){button('Submit and next').click();const header=root.querySelector('.qhead').textContent;key('Enter',true);assert.equal(root.querySelector('.qhead').textContent,header,'held Enter cannot skip the next question');}
  else button('Finish session').click();
 }
 assert.match(root.textContent,/Transfer Challenge: review/);
 const completed=snapshot();
 assert.equal(completed.transferRuns.length,1);
 assert.equal(completed.transferRuns[0].items.length,15);
 assert.equal(completed.transferRuns[0].summary.all.regularCorrect,12);
 assert.ok(completed.transferRuns[0].summary.all.intervalMean>.99);
 assert.equal(completed.transferRuns[0].completed,true,'finishing on the last displayed question is a completed session');
 assert.deepEqual(completed.stats,oldSave.stats);
 assert.deepEqual(completed.mastery,oldSave.mastery);
 assert.deepEqual(completed.srs,oldSave.srs);
 assert.equal(completed.runs.length,oldSave.runs.length);
 document.querySelector('#nav a[href="#/transfer"]').click();
 await until(()=>root.querySelector('h1')?.textContent==='Transfer Challenge','current Transfer sidebar link');
 assert.match(root.textContent,/Recent transfer sessions/);
 assert.match(root.textContent,/12\/12 non-interval questions correct/);
 const reloaded=makeStore(localStorage);assert.equal(reloaded.transferRuns().length,1);
 const backup=reloaded.exportJSON();assert.ok(JSON.parse(backup).recentStructures);
 // Start again, leave, and make sure the abandoned session's handlers are gone.
 button('Start Transfer Challenge').click();
 await route('#/s/bto','Beat the Odds');
 const before=root.textContent;key('Enter');advance(2000000);assert.equal(root.textContent,before);
 assert.equal(snapshot().transferRuns.length,1,'abandoned run is not silently completed');
 await route('#/mock','Full mock');assert.equal(root.querySelectorAll('tbody tr').length,5);
 assert.ok(!root.textContent.includes('80-in-8'));
 console.log('Full-router DOM passed: delivered entry point, old-save migration, timing dropdown, all answer controls, keyboard repeat, complete result, history/reload, cleanup and Kickstarter mock.');
} finally {
 Date.now=originalDateNow;globalThis.setInterval=originalInterval;
 for(const id of intervals)clearInterval(id);
 dom.window.close();
}
