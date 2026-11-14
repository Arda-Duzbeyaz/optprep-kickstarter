// Execute the real practice views in an isolated DOM with synthetic storage/time.
// No user progress, live accounts or assessment pages are accessed.
// Run: OPTPREP_TEST_JSDOM=/path/to/jsdom node tools/practice-flow-smoke.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom = new JSDOM('<main id="view"></main><div id="live"></div><div id="rail"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const k of ['window', 'document', 'Node', 'HTMLElement', 'Element', 'localStorage', 'Event'])
  Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true });
globalThis.matchMedia = dom.window.matchMedia = () => ({ matches: true });
let now = 0, wall = 1794528000000, nextFrame = 0;
Date.now = () => wall;
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
globalThis.requestAnimationFrame = () => ++nextFrame;
globalThis.cancelAnimationFrame = () => {};
const { runFeedbackSession } = await import('../src/ui/runner.js');
const { makeStore, memoryBackend, KEY } = await import('../src/core/store.js');
const { sectionMap } = await import('../src/ui/pages/section-map.js');
const { sectionPage } = await import('../src/ui/pages/section.js');
const { pathPage } = await import('../src/ui/pages/path.js');
const { progressPage } = await import('../src/ui/pages/progress.js');
const { activatePreset } = await import('../config/presets.js');
const { SECTION_MODULES } = await import('../src/sections/index.js');
const root = document.getElementById('view');
const button = (label) => [...root.querySelectorAll('button')].find((b) => b.textContent === label);
const prompt = () => root.querySelector('.prompt')?.textContent;
const advance = (ms) => { now += ms; wall += ms; };
let checks = 0, stop = () => {};
function ok(v, label) { assert.ok(v, label); checks++; }
function eq(a, b, label) { assert.deepEqual(a, b, label); checks++; }
function start(store, section = 'bto', family, extra = {}) {
  stop(); stop = runFeedbackSession(root, { sectionId: section, family, mode: 'practice', store, ...extra });
}
function choose(item, correct = true) {
  if (item.kind === 'mcq') root.querySelectorAll('[role="radio"]')[correct ? item.answerIndex : (item.answerIndex + 1) % item.options.length].click();
  else if (item.kind === 'interval') {
    for (const [i, value] of [item.truth * .999, item.truth * 1.001].entries()) {
      const input = root.querySelectorAll('input')[i]; input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else if (item.kind === 'rank') {
    for (const si of item.answerOrder) {
      const target = item.answerOrder.indexOf(si);
      while ([...root.querySelectorAll('.rank-row')].findIndex((r) => Number(r.dataset.si) === si) > target)
        root.querySelector(`.rank-row[data-si="${si}"] [aria-label="Move up"]`).click();
    }
  } else for (const trade of item.best.trades) {
    const i = item.board.instruments.findIndex((x) => x.id === trade.id);
    root.querySelectorAll('.ob-table tbody tr')[i].querySelector(`.ob-${trade.side}`).click();
  }
}
function submit(store, section = 'bto', correct = true) {
  const item = store.practiceSession(section).current.item;
  choose(item, correct); advance(3000); button('Submit').click(); return item;
}

try {
  activatePreset({id:'kickstarter'});
  const backend = memoryBackend(); let store = makeStore(backend); store.setSetting('preset',{id:'kickstarter'});
  // Every answer kind: save draft, leave, reload storage, restore, submit once,
  // reopen feedback and verify there is no extra score, level, XP or SRS update.
  for (const section of ['bto','nl','ll','iv','ob']) {
    start(store, section);
    const item = store.practiceSession(section).current.item, before = prompt();
    ok(root.textContent.includes('0/10 answered'));
    choose(item); const draft = store.practiceSession(section).current.draft;
    advance(2200); stop(); stop = () => {}; advance(240000);
    store = makeStore(backend); start(store, section);
    eq(prompt(), before, `${section}: identical question`);
    eq(store.practiceSession(section).current.draft, draft, `${section}: exact draft`);
    eq(store.practiceSession(section).current.elapsedMs, 2200, `${section}: away-time excluded`);
    advance(3000); button('Submit').click();
    const saved = store.exportJSON(); stop(); stop=()=>{};
    store = makeStore(backend); const xp = store.xpTotal(), srs = structuredClone(store.srs), stats = structuredClone(store.stats());
    start(store,section);
    ok(root.querySelector('.solution'),`${section}: feedback restored`);
    eq(store.stats(), stats,`${section}: answer counted once`); eq(store.xpTotal(),xp); eq(store.srs,srs);
    ok(root.textContent.includes('1/10 answered'));
    button('Submit').click(); eq(store.stats(),stats,'locked answer cannot submit twice');
    button('Next (Enter)').click();
    const expected = store.practiceSession(section).current.item;
    stop(); stop=()=>{};
    backend.setItem(KEY,saved); store=makeStore(backend); start(store,section);
    button('Next (Enter)').click();
    eq(store.practiceSession(section).current.item,expected,`${section}: identical next RNG draw`);
  }
  stop();stop=()=>{};
  // Partial bounds and already viewed hints survive too.
  store=makeStore(memoryBackend());start(store,'iv');
  root.querySelector('input').value='42';root.querySelector('input').dispatchEvent(new Event('input',{bubbles:true}));
  start(store,'iv');eq([...root.querySelectorAll('input')].map(x=>x.value),['42','']);
  store=makeStore(memoryBackend());start(store,'bto','two-dice-sum');
  button('Hint (0/3)').click();start(store,'bto','two-dice-sum');
  ok(root.querySelector('.hints').textContent.includes('Hint 1.'));eq(store.practiceSession('bto').current.hints,1);
  submit(store);eq(store.recognition(),{},'a resumed hint cannot count as a cold answer');
  // Focused learning is now explicitly separate from cold mixed checkpoints.
  stop();stop=()=>{};store=makeStore(memoryBackend());start(store,'bto','two-dice-sum');
  for(let i=0;i<3;i++){submit(store);if(i<2)button('Next (Enter)').click();}
  eq(store.mastery()['bto:two-dice-sum'],undefined);ok(root.textContent.includes('Learning only · help allowed'));
  ok(root.textContent.includes('cannot earn mixed checkpoints'));ok(root.textContent.includes('0/3 cold successes'));
  button('Mark covered').click();eq(store.coverage('bto','two-dice-sum').covered,true);
  button('Next (Enter)').click();submit(store,'bto',false);eq(store.mastery()['bto:two-dice-sum'],undefined);
  eq(store.recognition(),{});eq(store.mixedEvidence(),{},'chosen-family practice does not earn mixed checks');
  // Ten answers stop at a finishable block; last-item feedback resumes and the
  // completed history and clear operation happen exactly once.
  stop();stop=()=>{};store=makeStore(memoryBackend());start(store);
  const firstFamily=store.practiceSession('bto').current.item.family;
  ok(!root.querySelector('.qhead').textContent.includes(firstFamily),'no method cue before answering');
  for(let i=0;i<10;i++){submit(store);if(i<9)button('Next (Enter)').click();}
  ok(root.textContent.includes('10/10 answered'));ok(button('Finish'));start(store);
  ok(button('Finish'),'last feedback remains resumable');button('Finish').click();
  eq(store.practiceSession('bto'),null);eq(store.runs('bto','practice').length,1);
  eq(store.runs('bto','practice')[0].completed,true);ok(root.textContent.includes('Block complete'));
  button('Start another 10 questions').click();ok(store.practiceSession('bto'));eq(store.practiceSession('bto').log.length,0);
  button('End session').click();eq(store.practiceSession('bto'),null);eq(store.runs('bto','practice').length,1,'zero-answer finish adds no fake history');
  // A different selected skill requires an explicit choice; other tasks stay saved.
  stop();stop=()=>{};store=makeStore(memoryBackend());start(store,'nl');stop();stop=()=>{};const nl=store.practiceSession('nl');
  eq(nl.current.interrupted,true,'leaving an unanswered question marks its pace attempt as interrupted');
  start(store,'bto','two-dice-sum');stop();stop=()=>{};const bto=store.practiceSession('bto');
  eq(bto.current.interrupted,true);
  start(store,'bto');ok(root.textContent.includes('You have a saved practice block'));
  eq(store.practiceSession('bto'),bto);eq(store.practiceSession('nl'),nl);
  ok(root.querySelector('a[href="#/run/bto/practice/two-dice-sum"]'));
  button('Start new 10-question block').click();eq(store.practiceSession('bto').family,null);eq(store.practiceSession('nl'),nl);
  // Autosave on pagehide, paused hidden time, and visible restoration.
  advance(2200);Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));
  const savedMs=store.practiceSession('bto').current.elapsedMs;advance(240000);
  Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));
  advance(1000);window.dispatchEvent(new Event('pagehide'));eq(store.practiceSession('bto').current.elapsedMs,savedMs+1000);
  delete document.hidden;
  // Unreadable saved sessions do not erase existing levels or other categories.
  stop();stop=()=>{};store.state.mastery['bto:two-dice-sum']={lv:4,run:0,prun:2};store.state.activePractice.bto={version:999};
  start(store);ok(root.textContent.includes('could not be restored'));eq(store.mastery()['bto:two-dice-sum'].lv,4);
  button('Start new 10-question block').click();eq(store.mastery()['bto:two-dice-sum'].prun,2);
  // Both the landing pages and skills dashboard expose resume and level criteria.
  stop();stop=()=>{};store.setSetting('preset',{id:'kickstarter'});
  sectionPage(root,{store,id:'bto'});ok(root.querySelector('[data-action="mixed-practice"]').textContent.startsWith('Resume mixed practice'));ok(root.textContent.includes('difficulties verified'));
  eq(store.mastery()['bto:two-dice-sum'].prun,2,'legacy levels preserved');ok(root.textContent.includes('How learning and mixed checkpoints work'));
  pathPage(root,{store});ok(root.textContent.includes('Resume practice'));
  progressPage(root,{store});ok(root.textContent.includes('Skills'));ok(root.textContent.includes('all supported difficulties verified'));ok(root.textContent.includes('skills started'));
  // Storage failure is visible rather than a false promise that data was saved.
  const blocked=memoryBackend();blocked.setItem=()=>{throw Error('QuotaExceededError')};
  const memoryOnly=makeStore(blocked);start(memoryOnly);ok(root.querySelector('.practice-save-note').textContent.includes('Autosave is unavailable'));
  // The reported checkpoint exploit is closed, and a genuine full drill passes.
  store=makeStore(memoryBackend());const fam=SECTION_MODULES.bto.families[0];
  for(const count of [1,10]){
    const {makeRng}=await import('../src/core/rng.js');
    const items=Array.from({length:10},(_,i)=>fam.generate(makeRng(`drill-fixture:${i}`),{difficulty:1}));
    start(store,'bto',undefined,{mode:'drill',items});
    eq(store.practiceSession('bto'),null,'timed drills remain non-resumable');
    for(let i=0;i<count;i++){choose(items[i]);advance(3000);button('Submit').click();if(i<count-1)button('Next (Enter)').click();}
    button(count===10?'Finish':'End session').click();
    const check=sectionMap(store,'bto').units.flatMap(u=>u.rows).find(r=>r.id==='drill');eq(check.done,count===10);
  }
  console.log(`${checks} practice-flow assertions passed: all answer kinds, drafts, feedback/RNG resume, levels, completion, mixed cues, visibility, recovery, dashboards and drill checkpoints.`);
} catch (error) { console.error('Practice-flow failure:',error); throw error; }
finally { try { stop(); } finally { dom.window.close(); } }
