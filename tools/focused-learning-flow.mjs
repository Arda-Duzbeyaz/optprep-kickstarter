import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom = new JSDOM('<main id="view"></main><div id="live"></div><div id="rail"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'Node', 'HTMLElement', 'Element', 'localStorage', 'Event']) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
globalThis.matchMedia = dom.window.matchMedia = () => ({ matches: true });
globalThis.requestAnimationFrame = () => 1; globalThis.cancelAnimationFrame = () => {};
let now = 0;
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
const { makeStore, memoryBackend } = await import('../src/core/store.js');
const { runFeedbackSession } = await import('../src/ui/runner.js');
const { PRACTICE_MODULES } = await import('../src/practice/index.js');
const { finiteVariants } = await import('../src/practice/finite-variants.js');
const { questionKey } = await import('../src/core/questions.js');
const { recognitionStep, recognitionProgress } = await import('../src/core/recognition.js');
const root = document.getElementById('view');
let checks = 0, stop = () => {};
const eq = (a, b, message) => { assert.deepEqual(a, b, message); checks++; };
const ok = (a, message) => { assert.ok(a, message); checks++; };
const button = (label) => [...root.querySelectorAll('button')].find((b) => b.textContent === label);
const start = (store, family) => { stop(); stop = runFeedbackSession(root, { sectionId: 'bto', mode: 'practice', family, store }); };
function answer(store, { help = false } = {}) {
  const current = store.practiceSession('bto').current;
  if (help) [...root.querySelectorAll('button')].find((button) => button.textContent.startsWith('Hint (0/')).click();
  root.querySelectorAll('[role=radio]')[current.item.answerIndex].click(); now += 3000; button('Submit').click();
}
try {
  // The user's exact example: a real ten-question easy block, across a reload.
  const backend = memoryBackend(); let store = makeStore(backend); const seen = new Set();
  start(store, 'dice-order-stats');
  for (let index = 0; index < 10; index++) {
    let current = store.practiceSession('bto').current;
    eq(current.item.family, 'dice-order-stats'); eq(current.item.difficulty, 1); eq(current.fresh, true);
    eq(seen.has(questionKey(current.item)), false); seen.add(questionKey(current.item)); eq(root.querySelector('.practice-repeat-note'), null);
    if (index === 5) {
      const question = current.item.prompt.text; stop(); stop = () => {}; store = makeStore(backend); start(store, 'dice-order-stats');
      eq(store.practiceSession('bto').current.item.prompt.text, question); eq(store.practiceSession('bto').difficulty, 1);
    }
    answer(store, { help: index === 2 }); if (index < 9) button('Next (Enter)').click();
  }
  eq(store.coverage('bto', 'dice-order-stats').covered, true); eq(store.coverage('bto', 'dice-order-stats').completedBlocks, 1);
  eq(store.recognition(), {}); button('Finish').click(); eq(store.practiceSession('bto'), null); eq(store.runs('bto', 'practice').at(-1).max, 10);

  // A block's selected level remains fixed even if a separate proof becomes available.
  stop(); stop = () => {}; store = makeStore(memoryBackend()); start(store, 'dice-order-stats');
  let proof;
  for (let i = 0; i < 3; i++) proof = recognitionStep(proof, { key: `other-session-proof-${i}`, difficulty: 1, levels: [1, 2], correct: true, ms: 2000, budgetMs: 90000 });
  store.state.recognition['bto:dice-order-stats'] = proof; eq(recognitionProgress(proof, [1, 2]).target, 2);
  answer(store); button('Next (Enter)').click(); eq(store.practiceSession('bto').current.item.difficulty, 1); eq(store.practiceSession('bto').difficulty, 1);
  stop(); stop = () => {};

  // Only three unseen questions remain in a known finite domain: save three, never repeat.
  store = makeStore(memoryBackend()); const f = PRACTICE_MODULES.bto.families.find((f) => f.id === 'two-dice-sum');
  for (const item of finiteVariants(f, 1).slice(3)) store.rememberQuestion(item);
  start(store, 'two-dice-sum');
  for (let i = 0; i < 3; i++) { eq(store.practiceSession('bto').current.fresh, true); answer(store); button('Next (Enter)').click(); }
  eq(store.practiceSession('bto'), null); ok(root.textContent.includes(`All ${finiteVariants(f,1).length} variants`));
  eq(store.runs('bto', 'practice').at(-1).max, 3); eq(store.runs('bto', 'practice').at(-1).completed, false);
  eq(store.coverage('bto', 'two-dice-sum').covered, false); eq(store.coverage('bto', 'two-dice-sum').completedBlocks, 0);
  eq(store.recognition(), {}); eq(root.querySelector('.prompt'), null);

  // An unknown-domain failure must not be relabelled as true exhaustion.
  stop(); stop = () => {}; const original = PRACTICE_MODULES.bto, only = finiteVariants(f, 1)[0];
  PRACTICE_MODULES.bto = { ...original, families: [{ ...f, generate: () => structuredClone(only) }] };
  try {
    store = makeStore(memoryBackend()); store.rememberQuestion(only); start(store, 'two-dice-sum');
    ok(root.textContent.includes('More variants may exist')); ok(!root.textContent.includes(`All ${finiteVariants(f,1).length} variants`));
    eq(store.practiceSession('bto'), null); eq(store.state.runs.length, 0); eq(store.xpTotal(), 0);
  } finally { stop(); stop = () => {}; PRACTICE_MODULES.bto = original; }
  console.log(`${checks} focused-learning assertions passed: unique ten-question user example, saved-question resume, assisted coverage without cold credit, frozen level, honest finite exhaustion and unknown search failure.`);
} finally { stop(); dom.window.close(); }
