// DOM integration checks. Optional development dependency: npm install --no-save jsdom
// Then: node tools/ui-smoke.mjs. These execute the real views and event handlers;
// they do not substitute for a visual browser/layout check.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom = new JSDOM('<main id="view"></main><div id="live"></div>', { url: 'http://localhost/' });
for (const name of ['window', 'document', 'Node', 'HTMLElement', 'Element', 'localStorage']) {
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true });
}
globalThis.matchMedia = () => ({ matches: true });
dom.window.matchMedia = globalThis.matchMedia;
globalThis.confirm = () => true;
let now = 0, nextFrame = 0;
const frames = new Map();
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
globalThis.requestAnimationFrame = (fn) => { frames.set(++nextFrame, fn); return nextFrame; };
globalThis.cancelAnimationFrame = (id) => frames.delete(id);
function advance(ms) {
  now += ms;
  const pending = [...frames.entries()];
  frames.clear();
  for (const [, fn] of pending) fn(now);
}

const { runExam, runFeedbackSession } = await import('../src/ui/runner.js');
const { makeStore, memoryBackend } = await import('../src/core/store.js');
const { activatePreset } = await import('../config/presets.js');
const { mockPage } = await import('../src/ui/pages/mock.js');
const { progressPage } = await import('../src/ui/pages/progress.js');
const { examItems } = await import('../src/core/draw.js');
const { SECTION_MODULES } = await import('../src/sections/index.js');
const root = document.getElementById('view');
const button = (text) => [...root.querySelectorAll('button')].find((b) => b.textContent === text);
const store = makeStore(memoryBackend());
store.setSetting('preset', { id: 'kickstarter' });
activatePreset({ id: 'kickstarter' });

let stop = runExam(root, { sectionId: 'bto', store, seed: 'ui-clock' });
assert.match(root.textContent, /25 minutes overall; 90 seconds per question/);
button('Start the clock').click();
assert.match(root.querySelector('.qhead').textContent, /Question 1 of 20/);
advance(91000);
assert.match(root.querySelector('.qhead').textContent, /Question 2 of 20/);
advance(1500000);
assert.match(root.textContent, /Beat the Odds: result/);
assert.equal(store.runs('bto', 'exam').length, 1);
assert.equal(store.recentQuestionKeys('bto').size, 2, 'only displayed questions enter the history');
stop();

mockPage(root, { store });
assert.equal(root.querySelectorAll('tbody tr').length, 5);
assert.ok(!root.textContent.includes('80-in-8'));

const interval = { section: 'iv', family: 'dots-count', kind: 'interval', difficulty: 1,
  id: 'smoke-interval', prompt: { text: 'Estimate this count.' }, truth: 42,
  solution: { steps: [{ say: 'Count', why: 'Count the objects', math: '42' }], rule: 'Count', anchor: 'Count' }, hints: [] };
const intervalStore = makeStore(memoryBackend());
stop = runFeedbackSession(root, { sectionId: 'iv', mode: 'practice', store: intervalStore, items: [interval] });
const inputs = root.querySelectorAll('input');
inputs[0].value = '1'; inputs[0].dispatchEvent(new dom.window.Event('input', { bubbles: true }));
inputs[1].value = '1000'; inputs[1].dispatchEvent(new dom.window.Event('input', { bubbles: true }));
advance(5000);
button('Submit').click();
const stats = intervalStore.stats()['iv:dots-count'];
assert.equal(stats.correct, 0);
assert.equal(stats.covered, 1);
assert.equal(stats.scoreSum, .001);
assert.equal(intervalStore.mastery()['iv:dots-count'], undefined);
assert.deepEqual(intervalStore.recognition(), {});
stop();
progressPage(root, { store: intervalStore, tab: 'pace' });
assert.match(root.textContent, /coverage 100%.*mean score 0\.001/);

const repeatedStore = makeStore(memoryBackend());
const items = examItems(SECTION_MODULES.bto, { count: 20 }, 'ui-repeats');
items.forEach((it) => repeatedStore.rememberQuestion(it));
stop = runExam(root, { sectionId: 'bto', store: repeatedStore, items });
button('Start the clock').click();
button('Finish exam').click();
assert.match(root.textContent, /20 repeated question\(s\)/);
assert.equal(repeatedStore.runs('bto', 'exam').length, 0);
assert.equal(repeatedStore.runs('bto', 'exam-variant')[0].repeatCount, 20);
stop();
await Promise.resolve();
dom.window.close();
console.log('DOM integration passed: both clocks, Kickstarter mock selection, interval coverage/mastery, repeat exclusion.');
