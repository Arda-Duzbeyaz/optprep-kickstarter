// Optional development check: npm install --no-save jsdom
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom = new JSDOM('<main id="view"></main><div id="live"></div>', { url: 'http://localhost/#/transfer' });
for (const name of ['window', 'document', 'Node', 'HTMLElement', 'Element', 'localStorage']) Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true });
globalThis.matchMedia = () => ({ matches: true }); dom.window.matchMedia = globalThis.matchMedia; globalThis.confirm = () => true;
let now = 0, frameId = 0; const frames = new Map();
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
globalThis.requestAnimationFrame = (fn) => { frames.set(++frameId, fn); return frameId; }; globalThis.cancelAnimationFrame = (id) => frames.delete(id);
function advance(ms) { now += ms; const pending = [...frames.values()]; frames.clear(); pending.forEach((fn) => fn(now)); }
const { makeStore, memoryBackend } = await import('../src/core/store.js');
const { transferPage, runTransfer } = await import('../src/ui/pages/transfer.js');
const { transferItems } = await import('../src/transfer/draw.js');
const { SECTION_MODULES } = await import('../src/sections/index.js');
const { activatePreset, activePreset } = await import('../config/presets.js');
const root = document.getElementById('view'), button = (label) => [...root.querySelectorAll('button')].find((b) => b.textContent === label);
const store = makeStore(memoryBackend()); store.setSetting('preset', { id: 'kickstarter' }); activatePreset(store.settings().preset);
const preset = JSON.stringify(activePreset()), pageCleanup = transferPage(root, { store });
assert.match(root.textContent, /not an official Optiver assessment replica/);
assert.match(root.textContent, /10 questions from one assessment.*15 minutes overall.*90 seconds per question/);
root.querySelector('#transfer-scope').value='all';root.querySelector('#transfer-scope').dispatchEvent(new dom.window.Event('change'));
assert.match(root.textContent,/15 questions.*20 minutes overall.*90 seconds per question/);
button('Start Transfer Challenge').click(); assert.match(root.querySelector('.qhead').textContent, /Question 1 of 15/); pageCleanup();
const rows = transferItems(SECTION_MODULES, { seed: 'dom-transfer-complete' });
let stop = runTransfer(root, { store, seed: 'dom-transfer-complete', timed: false, items: rows });
for (const row of rows) {
  const item = row.item; assert.equal(root.querySelectorAll('details').length, 0); assert.ok(!root.querySelector('.qhead').textContent.includes(item.family));
  if (item.kind === 'mcq') root.querySelectorAll('.option')[item.answerIndex].click();
  else if (item.kind === 'rank') {
    for (let target = 0; target < 3; target++) { const si = item.answerOrder[target]; while ([...root.querySelectorAll('.rank-row')].findIndex((r) => Number(r.dataset.si) === si) > target) root.querySelector(`.rank-row[data-si="${si}"] button[aria-label="Move up"]`).click(); }
  } else if (item.kind === 'interval') {
    const inputs = root.querySelectorAll('input'); for (const [i, value] of [item.truth * .999, item.truth * 1.001].entries()) { inputs[i].value = value; inputs[i].dispatchEvent(new dom.window.Event('input', { bubbles: true })); }
  } else if (item.kind === 'orderbook') {
    for (const trade of item.best.trades) { const i = item.board.instruments.findIndex((ins) => ins.id === trade.id); root.querySelectorAll('.ob-table tbody tr')[i].querySelector(`.ob-${trade.side}`).click(); }
  }
  advance(5000); button('Submit and next').click();
}
assert.match(root.textContent, /Transfer Challenge: review/); assert.equal(root.querySelectorAll('details').length, 15);
const run = store.transferRuns()[0]; assert.ok(run.completed && !run.timed); assert.equal(run.summary.all.regularCorrect, 12); assert.ok(run.summary.all.intervalMean > .99);
assert.equal(store.state.runs.length, 0); assert.deepEqual(store.stats(), {}); assert.deepEqual(store.mastery(), {}); assert.deepEqual(store.srs, {}); assert.equal(JSON.stringify(activePreset()), preset); stop();
const clockStore = makeStore(memoryBackend()); stop = runTransfer(root, { store: clockStore, seed: 'dom-transfer-clock', timed: true });
advance(91000); assert.match(root.querySelector('.qhead').textContent, /Question 2 of 15/); advance(1200000); assert.match(root.textContent, /Partial session/);
assert.equal(clockStore.transferRuns()[0].items.length, 2); assert.equal(Object.values(clockStore.state.recentQuestions).reduce((n, xs) => n + xs.length, 0), 2); stop();
const extraStore = makeStore(memoryBackend()); extraStore.setSetting('extraTime', 2); const extraCleanup = transferPage(root, { store: extraStore }); assert.match(root.textContent, /extra-time setting ×2/); extraCleanup();
stop = runTransfer(root, { store: extraStore, seed: 'dom-extra-time', timed: true }); advance(91000); assert.match(root.querySelector('.qhead').textContent, /Question 1 of 15/); button('Finish session').click(); assert.equal(extraStore.transferRuns()[0].extraTime, 2); assert.match(root.textContent, /timed ×2/); stop();
const abortStore = makeStore(memoryBackend()); stop = runTransfer(root, { store: abortStore, seed: 'dom-transfer-cleanup', timed: false }); advance(3000000); assert.match(root.querySelector('.qhead').textContent, /Question 1 of 15/); stop(); assert.equal(abortStore.transferRuns().length, 0); assert.equal(frames.size, 0);
dom.window.close(); console.log('Transfer DOM passed: all response kinds, hidden methods, isolated results, preset, both clocks, extra time, displayed-only history and cleanup.');
