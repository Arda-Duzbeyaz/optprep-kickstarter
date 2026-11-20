// Reproduce topic/mixed switching through the real app router and response controls.
// Isolated synthetic storage only; no accounts or user assessment pages.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom = new JSDOM(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), { url: 'http://localhost/#/' });
for (const k of ['window','document','Node','HTMLElement','Element','localStorage','location','navigator','Event','CustomEvent','Blob','File'])
  Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true });
globalThis.matchMedia = dom.window.matchMedia = () => ({ matches: true, addEventListener() {} });
dom.window.scrollTo = () => {}; dom.window.HTMLElement.prototype.scrollIntoView = () => {};
globalThis.fetch = async () => ({ ok: false, json: async () => ({ ok: false }) });
let now = 0, id = 0, checks = 0; const frames = new Map(), errors = [];
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
const wallNow = Date.now; Date.now = () => Date.UTC(2026,10,17,12) + now;
globalThis.requestAnimationFrame = f => { frames.set(++id,f); return id; }; globalThis.cancelAnimationFrame = i => frames.delete(i);
const intervals = [], originalInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const i=originalInterval(...args); intervals.push(i); return i; };
window.addEventListener('error', e => errors.push(e.error?.stack || e.message));
const { blankV2 } = await import('../src/core/migrate.js');
const { practiceSlot } = await import('../src/core/practice.js');
const { PRACTICE_MODULES } = await import('../src/practice/index.js');
const { SECTIONS } = await import('../config/sections.js');
const initial = blankV2(); initial.settings.preset = { id: 'kickstarter' }; initial.activity.xpBase = 37;
for (const section of ['bto','nl','ll','iv','ob']) for (const f of PRACTICE_MODULES[section].families.slice(0,2))
  initial.learningCoverage[`${section}:${f.id}`] = { covered: true, coveredBy: 'manual', at: Date.now() };
localStorage.setItem('optprep:v2',JSON.stringify(initial));
const root = document.getElementById('view'), state = () => JSON.parse(localStorage.getItem('optprep:v2'));
const saved = (section,family=null,scope='all') => state().activePractice[practiceSlot(section,family,scope)];
const button = text => [...root.querySelectorAll('button')].find(b=>b.textContent===text);
const ok = (v,m) => { assert.ok(v,m); checks++; }, eq = (a,b,m) => { assert.deepEqual(a,b,m); checks++; };
async function until(fn,label) { for(let n=0;n<200;n++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw Error(`Timeout: ${label}: ${root.textContent.slice(0,300)}`); }
async function navigate(hash) { if(location.hash!==hash){const old=root.firstElementChild;await new Promise(resolve=>{window.addEventListener('hashchange',resolve,{once:true});location.hash=hash;});await until(()=>root.firstElementChild!==old,'route rendered');} }
async function route(hash,title) { await navigate(hash); await until(()=>root.querySelector('h1')?.textContent===title,hash); }
async function run(section,family=null,scope='all') {
  await route(family?`#/run/${section}/practice/${family}`:`#/run/${section}/mixed/${scope}`,`${SECTIONS[section].title}: Practice`);
  await until(()=>root.querySelector('.prompt') && saved(section,family,scope) && root.querySelector('.qhead')?.textContent.includes(family ? PRACTICE_MODULES[section].families.find(f=>f.id===family).title : 'Mixed practice'),'selected question');
  eq(!!root.querySelector('.pace'),!family,'only mixed has its checkpoint stopwatch');
  ok(!root.textContent.includes('You have a saved practice block'),'no unrelated replacement prompt');
}
function advance(ms=3000) {now+=ms; const fs=[...frames.values()];frames.clear();fs.forEach(f=>f(now));}
function fill(item) {
  if(item.kind==='mcq') root.querySelectorAll('[role=radio]')[item.answerIndex].click();
  else if(item.kind==='rank') for(const si of item.answerOrder){const target=item.answerOrder.indexOf(si);while([...root.querySelectorAll('.rank-row')].findIndex(r=>+r.dataset.si===si)>target)root.querySelector(`.rank-row[data-si="${si}"] [aria-label="Move up"]`).click();}
  else if(item.kind==='interval') for(const [i,v] of [item.truth*.999999,item.truth*1.000001].entries()){const input=root.querySelectorAll('input')[i];input.value=String(v);input.dispatchEvent(new Event('input',{bubbles:true}));}
  else if(!item.best) root.querySelector('.ob input[type=checkbox]').click();
  else for(const t of item.best.trades){const i=item.board.instruments.findIndex(x=>x.id===t.id);root.querySelectorAll('.ob-table tbody tr')[i].querySelector(`.ob-${t.side}`).click();}
}
function answer(section,family=null,scope='all') {fill(saved(section,family,scope).current.item);advance();button('Submit').click();}
const results=[];
try {
  await import('../app.js');await until(()=>root.querySelector('h1')?.textContent==='Today','boot');
  for(const section of ['bto','nl','ll','iv','ob']){
    const [a,b]=PRACTICE_MODULES[section].families;
    await run(section,a.id);answer(section,a.id);button('Next (Enter)').click();fill(saved(section,a.id).current.item);
    await run(section,b.id);answer(section,b.id);const aSaved=saved(section,a.id);
    await run(section);answer(section);button('Next (Enter)').click();fill(saved(section).current.item);
    const bSaved=saved(section,b.id);
    await run(section,null,'covered');const allSaved=saved(section);
    await route(`#/s/${section}`,SECTIONS[section].title);
    const coveredSaved=saved(section,null,'covered');
    const link=root.querySelector(`.grid-actions a[href="#/run/${section}/practice/${a.id}"]`);
    eq(link.textContent,'Resume learning','topic row resumes its own learning');
    ok(root.querySelector('[data-action="mixed-practice"]').textContent.startsWith('Resume mixed practice'));
    const oldPage=root.firstElementChild;
    await new Promise(resolve=>{window.addEventListener('hashchange',resolve,{once:true});link.click();});await until(()=>root.firstElementChild!==oldPage&&!!root.querySelector('.prompt'),'topic link resume');
    const restored=saved(section,a.id);
    eq(restored.current.item,aSaved.current.item,'same topic question');eq(restored.current.draft,aSaved.current.draft,'same draft');
    eq(restored.log,aSaved.log,'same answered count');eq(restored.rngState,aSaved.rngState,'same next RNG draw');
    ok(!root.querySelector('.pace'),'learning resume cannot open mixed stopwatch');
    eq(root.querySelector('.qhead').textContent.includes(a.title),true,'correct topic label');
    const cold=structuredClone(state().recognition);
    for(let n=1;n<10;n++){answer(section,a.id);if(n<9)button('Next (Enter)').click();}
    eq(state().learningCoverage[`${section}:${a.id}`].completedBlocks,1,'complete original ten-question block');
    eq(state().recognition,cold,'learning creates no mixed credit');
    button('Finish').click();for(let n=0;n<15;n++)advance(100);
    eq(saved(section,a.id),undefined,'finish clears only that topic');
    eq(saved(section,b.id),bSaved,'other topic feedback retained');eq(saved(section),allSaved,'all mixed draft retained');
    eq(saved(section,null,'covered'),coveredSaved,'covered mixed draft retained');
    const runResult=state().runs.filter(r=>r.section===section&&r.family===a.id).at(-1);
    const xp=runResult.items.reduce((sum,r)=>sum+r.xp,0);
    eq(root.querySelector('.xp-tick').textContent,`+${xp}`,'block XP excludes other sessions');
    await run(section,b.id);ok(root.querySelector('.solution'),'other topic resumes feedback');
    eq(saved(section,b.id).log,bSaved.log,'feedback resume does not resubmit');
    await run(section);eq(saved(section).current.item,allSaved.current.item,'mixed resumes its own item');eq(saved(section).current.draft,allSaved.current.draft,'mixed draft exact');
    await run(section,null,'covered');eq(saved(section,null,'covered').current.item,coveredSaved.current.item,'covered pool has independent item');
    results.push({section,topicDraft:true,topicFeedback:true,mixedDraft:true,coveredPool:true,learningTimerAbsent:true,isolatedFinish:true});
  }
  eq(errors,[],'no uncaught app errors');
  const report={assertions:checks,sections:results,syntheticStateOnly:true,uncaughtErrors:errors};
  writeFileSync(new URL('../evaluation/separate-sessions-router.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
} finally {Date.now=wallNow;intervals.forEach(clearInterval);globalThis.setInterval=originalInterval;dom.window.close();}
