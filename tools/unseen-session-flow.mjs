// Exercise the real session UI at finite exhaustion, not just the sampler API.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom = new JSDOM('<main id="view"></main><div id="live"></div><div id="rail"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'Node', 'HTMLElement', 'Element', 'localStorage', 'Event']) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
globalThis.matchMedia = dom.window.matchMedia = () => ({ matches: true });
let frameRequests = 0;
globalThis.requestAnimationFrame = () => ++frameRequests; globalThis.cancelAnimationFrame = () => {};
const { makeStore, memoryBackend } = await import('../src/core/store.js');
const { PRACTICE_MODULES } = await import('../src/practice/index.js');
const { SECTION_MODULES } = await import('../src/sections/index.js');
const { finiteVariants } = await import('../src/practice/finite-variants.js');
const { runFeedbackSession, runExam } = await import('../src/ui/runner.js');
const { runTransfer } = await import('../src/ui/pages/transfer.js');
const { TRANSFER_FAMILIES } = await import('../src/transfer/index.js');
const root = document.getElementById('view');
let checks = 0, stop = () => {};
const eq = (a, b, message) => { assert.deepEqual(a, b, message); checks++; };
const ok = (a, message) => { assert.ok(a, message); checks++; };
try {
  let store = makeStore(memoryBackend());
  for (const id of ['two-dice-sum', 'die-repeats']) {
    store.markCovered('bto', id, true);
    const f = PRACTICE_MODULES.bto.families.find((f) => f.id === id);
    for (const item of finiteVariants(f, 1)) store.rememberQuestion(item);
  }
  const xp = store.xpTotal(), history = [...store.recentQuestionKeys('bto')];
  stop = runFeedbackSession(root, { sectionId: 'bto', mode: 'practice', scope: 'covered', store });
  ok(root.textContent.includes('This mixed batch stopped')); eq(root.querySelector('.prompt'), null);
  eq(store.practiceSession('bto'), null); eq(store.state.runs.length, 0); eq(store.xpTotal(), xp);
  eq([...store.recentQuestionKeys('bto')], history); eq(store.recognition(), {});
  ok(root.querySelector('a[href="#/run/bto/mixed/all"]'));
  stop();
  // The same exhausted selected skills do not block fresh diagnostic practice in other skills.
  stop = runFeedbackSession(root, { sectionId: 'bto', mode: 'practice', scope: 'all', store });
  ok(root.querySelector('.prompt')); eq(store.practiceSession('bto').current.fresh, true);
  eq(root.querySelector('.practice-repeat-note'), null); stop();

  // Force the real mock and batch UI to receive an exhausted one-question source.
  // Restore the shared registry even on failure; never persist a test fixture.
  const original = SECTION_MODULES.bto, f = PRACTICE_MODULES.bto.families.find((f) => f.id === 'two-dice-sum');
  const only = finiteVariants(f, 1)[0];
  SECTION_MODULES.bto = { ...original, bank: [], families: [{ ...f, generate: () => structuredClone(only) }] };
  const extras = TRANSFER_FAMILIES.bto;
  TRANSFER_FAMILIES.bto = [];
  try {
    store = makeStore(memoryBackend()); store.rememberQuestion(only);
    const before = JSON.stringify(store.state), frames = frameRequests; let done = 0;
    stop = runExam(root, { sectionId: 'bto', store, mock: true, onDone: () => done++ });
    ok(root.textContent.includes('no fresh paper available')); eq(root.querySelector('.prompt'), null);
    eq(JSON.stringify(store.state), before); eq(frameRequests, frames); eq(done, 0); stop();
    stop = runTransfer(root, { section: 'bto', store, seed: 'exhausted-batch-flow', timed: true });
      ok(root.textContent.includes('No fresh batch available')); eq(root.querySelector('.prompt'), null);
      eq(JSON.stringify(store.state), before); eq(frameRequests, frames); eq(store.transferRuns().length, 0); stop();
  } finally { SECTION_MODULES.bto = original; TRANSFER_FAMILIES.bto = extras; }
  store = makeStore(memoryBackend());
  stop = runTransfer(root, { section: 'bto', store, seed: 'new-batch-flow', timed: true });
  ok(root.querySelector('.prompt')); eq(store.transferRuns().length, 0); ok(frameRequests > 0); stop();
  console.log(`${checks} unseen-session UI assertions passed: exhausted mixed block, fresh all-skills fallback, mock and batch preflight without clock/score/history mutation, and fresh batch start.`);
} finally { stop(); dom.window.close(); }
