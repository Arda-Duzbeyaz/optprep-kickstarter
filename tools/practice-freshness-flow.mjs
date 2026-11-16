// Real practice controls: ten-question blocks, cross-block history, resumed drafts,
// genuine finite exhaustion without repeats, and legacy saved revision notes.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom = new JSDOM('<main id="view"></main><div id="live"></div><div id="rail"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const k of ['window', 'document', 'Node', 'HTMLElement', 'Element', 'localStorage', 'Event']) Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true });
globalThis.matchMedia = dom.window.matchMedia = () => ({ matches: true });
globalThis.requestAnimationFrame = () => 1; globalThis.cancelAnimationFrame = () => {};
let now = 0, checks = 0, stop = () => {};
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
const { makeStore, memoryBackend } = await import('../src/core/store.js');
const { questionKey } = await import('../src/core/questions.js');
const { runFeedbackSession } = await import('../src/ui/runner.js');
const { activatePreset } = await import('../config/presets.js');
const { finiteVariants } = await import('../src/practice/finite-variants.js');
const { PRACTICE_MODULES } = await import('../src/practice/index.js');
activatePreset({ id: 'kickstarter' });
const root = document.getElementById('view'), button = (label) => [...root.querySelectorAll('button')].find((b) => b.textContent === label);
function ok(value, label) { assert.ok(value, label); checks++; }
function eq(a, b, label) { assert.deepEqual(a, b, label); checks++; }
function start(store, family) { stop(); stop = runFeedbackSession(root, { sectionId: 'bto', mode: 'practice', family, store }); }
function answer(store) {
  const item = store.practiceSession('bto').current.item;
  root.querySelectorAll('[role=radio]')[item.answerIndex].click(); now += 3000; button('Submit').click(); return item;
}
try {
  const backend = memoryBackend(); let store = makeStore(backend); const seen = new Set();
  start(store, 'two-dice-sum');
  const total = finiteVariants(PRACTICE_MODULES.bto.families.find((f) => f.id === 'two-dice-sum'), 1).length;
  for (let index = 0; index < total; index++) {
    const current = store.practiceSession('bto').current, key = questionKey(current.item);
    eq(seen.has(key), false, 'all configured easy sum events are fresh, including across finished blocks');
    const note = root.querySelector('.practice-repeat-note');
    eq(!!note, false); ok(!root.querySelector('.revision-notice'), 'no prominent revision banner');
    if (index === 12 || index === total - 1) {
      const prompt = root.querySelector('.prompt').textContent, previousFresh = current.fresh;
      stop(); stop = () => {}; store = makeStore(backend); start(store, 'two-dice-sum');
      eq(root.querySelector('.prompt').textContent, prompt); eq(store.practiceSession('bto').current.fresh, previousFresh);
      eq(!!root.querySelector('.practice-repeat-note'), false, 'saved eligibility survives resume');
    }
    seen.add(key); answer(store);
    if ((index + 1) % 10) button('Next (Enter)').click();
    else {
      button('Finish').click(); eq(store.coverage('bto', 'two-dice-sum').completedBlocks, (index + 1) / 10);
      button('Start another 10 questions').click();
    }
  }
  eq(seen.size, total); eq(store.stats()['bto:two-dice-sum'].n, total); eq(store.recognition(), {}, 'focused learning cannot manufacture a cold pass');
  eq(store.practiceSession('bto'), null); ok(root.textContent.includes(`All ${total} variants`));
  eq(store.coverage('bto', 'two-dice-sum').completedBlocks, Math.floor(total/10)); eq(store.runs('bto', 'practice').at(-1).max, total%10);
  eq(store.runs('bto', 'practice').at(-1).completed, false); eq(button('Start another 10 questions'), undefined);
  stop(); stop = () => {}; store = makeStore(memoryBackend()); start(store, 'die-repeats');
  const sequence = [];
  for (let index = 0; index < 10; index++) {
    const item = store.practiceSession('bto').current.item; sequence.push(questionKey(item));
    eq(!!root.querySelector('.practice-repeat-note'), false);
    eq(new Set(sequence).size, index + 1, 'expanded easy die pool supplies a fresh ten-question block');
    answer(store); if (index < 9) button('Next (Enter)').click();
  }
  button('Finish').click(); eq(store.coverage('bto', 'die-repeats').covered, true); eq(store.coverage('bto', 'die-repeats').completedBlocks, 1);
  // A saved old question is preserved on upgrade even if it was previously revision.
  stop(); stop = () => {}; const legacyBackend = memoryBackend(); store = makeStore(legacyBackend); start(store, 'die-repeats');
  stop(); stop = () => {}; const legacy = store.practiceSession('bto'); legacy.current.fresh = false; delete legacy.difficulty; store.savePractice(legacy);
  store = makeStore(legacyBackend); start(store, 'die-repeats');
  const note = root.querySelector('.practice-repeat-note'); ok(note); eq(note.tagName, 'SMALL'); eq(note.textContent, 'Previously seen · revision'); eq(note.getAttribute('role'), null);
  eq(root.querySelector('.prompt').textContent.includes(legacy.current.item.prompt.text), true); answer(store); button('Next (Enter)').click(); eq(root.querySelector('.practice-repeat-note'), null);
  console.log(`${checks} freshness-flow assertions passed: no repeats through finite exhaustion, cross-block/reload history, quiet legacy note, expanded die pool and preserved completion/cold rules.`);
} finally { stop(); dom.window.close(); }
