// Full entry-point walkthrough with isolated storage, synthetic answers and time.
// Exercises every one of the 103 learning families through the real form controls.
// OPTPREP_TEST_JSDOM=/path/to/jsdom node tools/learning-completion-flow.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), { JSDOM } = require(process.env.OPTPREP_TEST_JSDOM || 'jsdom');
const dom = new JSDOM(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), { url: 'http://localhost/#/' });
for (const k of ['window', 'document', 'Node', 'HTMLElement', 'Element', 'localStorage', 'location', 'navigator', 'Event', 'CustomEvent', 'Blob', 'File'])
  Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true });
globalThis.matchMedia = dom.window.matchMedia = () => ({ matches: true, addEventListener() {} });
dom.window.scrollTo = () => {}; dom.window.HTMLElement.prototype.scrollIntoView = () => {};
globalThis.confirm = () => true; globalThis.fetch = async () => ({ ok: false, json: async () => ({ ok: false }) });
let now = 0, frame = 0, checks = 0, learningQuestions = 0;
const frames = new Map(), intervals = [], errors = [];
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
globalThis.requestAnimationFrame = (f) => { frames.set(++frame, f); return frame; };
globalThis.cancelAnimationFrame = (id) => frames.delete(id);
const originalInterval = globalThis.setInterval, originalNow = Date.now;
globalThis.setInterval = (...a) => { const id = originalInterval(...a); intervals.push(id); return id; };
Date.now = () => Date.UTC(2026, 10, 14, 12) + now;
window.addEventListener('error', (e) => errors.push(e.error?.stack || e.message));
const { blankV2 } = await import('../src/core/migrate.js');
const { PRACTICE_FAMILIES } = await import('../src/practice/catalog.js');
const { SECTIONS } = await import('../config/sections.js');
const initial = blankV2(); initial.settings.preset = { id: 'kickstarter' };
localStorage.setItem('optprep:v2', JSON.stringify(initial));
const root = document.getElementById('view'), state = () => JSON.parse(localStorage.getItem('optprep:v2'));
const button = (label) => [...root.querySelectorAll('button')].find((b) => b.textContent === label);
function ok(value, label) { assert.ok(value, label); checks++; }
function eq(a, b, label) { assert.deepEqual(a, b, label); checks++; }
async function until(fn, label) {
  for (let i = 0; i < 200; i++) { if (fn()) return; await new Promise((r) => setTimeout(r, 10)); }
  throw Error(`Timeout ${label}: ${root.textContent.slice(0, 350)}`);
}
async function route(hash, heading) {
  location.hash = hash; await until(() => root.querySelector('h1')?.textContent === heading, hash);
}
async function learn(section, family) {
  await route(`#/run/${section}/practice/${family}`, `${SECTIONS[section].title}: Practice`);
  if (button('Start new 10-question block')) button('Start new 10-question block').click();
  await until(() => !!root.querySelector('.prompt'), `prompt ${section}:${family}`);
}
function advance(ms = 3000) { now += ms; const pending = [...frames.values()]; frames.clear(); pending.forEach((f) => f(now)); }
function answer(section, { wrong = false, skip = false } = {}) {
  const item = state().activePractice[section].current.item;
  if (skip) { advance(); button('Skip').click(); return item; }
  if (item.kind === 'mcq') root.querySelectorAll('[role=radio]')[wrong ? (item.answerIndex + 1) % item.options.length : item.answerIndex].click();
  else if (item.kind === 'rank') for (const si of item.answerOrder) {
    const target = item.answerOrder.indexOf(si);
    while ([...root.querySelectorAll('.rank-row')].findIndex((r) => Number(r.dataset.si) === si) > target)
      root.querySelector(`.rank-row[data-si="${si}"] [aria-label="Move up"]`).click();
  } else if (item.kind === 'interval') {
    const delta = Math.max(Math.abs(item.truth) * 1e-6, 1e-10);
    for (const [i, value] of [item.truth - delta, item.truth + delta].entries()) {
      const input = root.querySelectorAll('input')[i]; input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else for (const trade of item.best.trades) {
    const index = item.board.instruments.findIndex((x) => x.id === trade.id);
    root.querySelectorAll('.ob-table tbody tr')[index].querySelector(`.ob-${trade.side}`).click();
  }
  advance(); button('Submit').click(); return item;
}
function finishLearning(section, options = {}) {
  for (let i = 0; i < 10; i++) { answer(section, { wrong: options.twoWrong && i < 2, skip: options.skip }); learningQuestions++; if (i < 9) button('Next (Enter)').click(); }
}

try {
  await import('../app.js'); await until(() => root.querySelector('h1')?.textContent === 'Today', 'initial Today');
  // Reproduce the user's 8/10 two-dice block; they earned activity but no tick.
  await learn('bto', 'two-dice-sum'); finishLearning('bto', { twoWrong: true });
  const before = state(); eq(before.learningCoverage['bto:two-dice-sum'].completedBlocks, 1);
  eq(before.learningCoverage['bto:two-dice-sum'].covered, true, 'saved on answer ten without Finish');
  eq(before.recognition, {}, 'learning never manufactures cold successes');
  ok(root.textContent.includes('Learning block complete · 10/10 saved'));
  const counters = root.querySelector('.cold-next-stage'); ok(counters && !counters.open, 'cold counters have an explanatory collapsed next stage');
  await route('#/progress/skills', 'Progress');
  const record = root.querySelector('[data-skill="bto:two-dice-sum"]');
  ok(record.textContent.includes('Learning complete')); ok(record.textContent.includes('1 learning block completed · 10 focused answers'));
  ok(record.textContent.includes('8/10 correct')); ok(record.textContent.includes('Mixed checks not started'));
  const coldTotals = [...root.querySelector('.skill-overview').querySelectorAll('details')].find((d) => d.querySelector('summary')?.textContent === 'Cold mixed-check totals');
  ok(coldTotals && !coldTotals.open, 'aggregate cold totals are clearly secondary');
  ok(record.compareDocumentPosition(coldTotals) & Node.DOCUMENT_POSITION_FOLLOWING, 'completed learning is displayed before cold totals');
  await route('#/s/bto', 'Beat the Odds');
  const row = [...root.querySelectorAll('.grid-row')].find((r) => r.textContent.includes('Two dice: sum events'));
  ok(row?.classList.contains('is-done'), 'completed learning row is visibly done'); ok(!row.classList.contains('is-current'), 'completed skill is no longer suggested');
  ok(root.textContent.includes('1/34 skills covered'));
  await route('#/', 'Today'); ok(root.querySelector('a[href="#/s/bto"]').textContent.includes('1/34 covered'));
  await learn('bto', 'two-dice-sum'); ok(button('Finish'), 'last feedback still resumes');
  eq(state().stats, before.stats); eq(state().activity.days, before.activity.days, 'no duplicate XP on feedback resume');
  button('Finish').click(); ok(root.textContent.includes('Learning complete and saved to Progress'));
  ok(root.querySelector('a.btn.primary')?.textContent.startsWith('Next skill:'), 'next learning action is primary after the first block');
  eq(state().learningCoverage['bto:two-dice-sum'].completedBlocks, 1);
  await learn('bto', 'die-repeats'); finishLearning('bto'); button('Finish').click();
  eq(root.querySelector('a.btn.primary')?.textContent, 'Test in mixed practice', 'two covered skills lead to a mixed check');
  await route('#/run/bto/mixed/covered', 'Beat the Odds: Practice');
  eq(state().activePractice.bto.familyPool, ['two-dice-sum', 'die-repeats']);
  const freshCounts = {}, revisionCounts = {};
  for (let i = 0; i < 10; i++) {
    const current = state().activePractice.bto.current;
    const counts = current.fresh ? freshCounts : revisionCounts; counts[current.item.family] = (counts[current.item.family] || 0) + 1;
    if (!current.fresh) ok(root.querySelector('.revision-notice'), 'repeat eligibility is explained before answering');
    answer('bto'); if (i < 9) button('Next (Enter)').click();
  }
  button('Finish').click();
  for (const family of ['two-dice-sum', 'die-repeats']) {
    const p = state().recognition[`bto:${family}`];
    eq(p?.attempts || 0, freshCounts[family] || 0, 'only genuinely fresh mixed questions enter recognition');
    eq(state().learningCoverage[`bto:${family}`].revisionAttempts, revisionCounts[family] || 0);
  }
  ok((revisionCounts['die-repeats'] || 0) > 0, 'the four-instance easy die pool exposes repeat-only revision after learning');
  const cold = structuredClone(state().recognition);

  // Every shipped family, every form kind, actual route, tenth-answer commit,
  // finished history, Progress row and next skill. Includes the four extensions.
  let families = 2;
  for (const section of ['bto', 'nl', 'll', 'iv', 'ob']) {
    for (const family of PRACTICE_FAMILIES[section]) {
      if (section === 'bto' && ['two-dice-sum', 'die-repeats'].includes(family.id)) continue;
      await learn(section, family.id); finishLearning(section);
      const entry = state().learningCoverage[`${section}:${family.id}`];
      eq(entry.completedBlocks, 1, `${section}:${family.id}: exactly one completed block`);
      eq(entry.covered, true, `${section}:${family.id}: auto coverage`);
      ok(root.textContent.includes('Learning block complete · 10/10 saved'), `${family.id}: final feedback acknowledges learning`);
      button('Finish').click(); eq(state().activePractice[section], undefined); families++;
      ok(root.textContent.includes('Learning complete and saved to Progress'));
    }
    await route('#/progress/skills', 'Progress');
    for (const family of PRACTICE_FAMILIES[section]) {
      const entry = root.querySelector(`[data-skill="${section}:${family.id}"]`);
      ok(entry?.textContent.includes('Learning complete'), `${section}:${family.id}: visible Progress record`);
    }
    console.log(`Walkthrough: ${section} ${PRACTICE_FAMILIES[section].length} learning families completed.`);
  }
  eq(families, 103); eq(state().recognition, cold, '101 further guided blocks cannot inflate cold mastery');

  // Skip completion and explicit repair remain honest even after earlier coverage.
  await learn('bto', 'two-dice-sum'); button('Mark for learning').click(); finishLearning('bto', { skip: true }); button('Finish').click();
  eq(state().learningCoverage['bto:two-dice-sum'].covered, false); ok(root.textContent.includes('Revisit the skipped questions'));
  await route('#/progress/skills', 'Progress'); ok(root.querySelector('[data-skill="bto:two-dice-sum"]').textContent.includes('10 skipped'));
  for (const tab of ['patterns', 'mistakes', 'pace']) { location.hash = `#/progress/${tab}`; await until(() => root.querySelector('.tabs [aria-current="page"]')?.getAttribute('href') === `#/progress/${tab}`, tab); ok(root.querySelector('.tab-panel')); }
  await route('#/settings', 'Settings'); ok(root.textContent.includes('Backup')); ok(root.textContent.includes('6 December') || root.querySelector('#prep-deadline'));
  await route('#/study', 'Study guide'); ok(root.querySelector('a[href^="#/study/"]'), 'study remains reachable');
  for (const section of ['bto', 'nl', 'll', 'iv', 'ob']) {
    await route(`#/s/${section}`, SECTIONS[section].title); ok(root.querySelector('[data-action="mixed-practice"]'));
    await route(`#/transfer/${section}`, 'Batch check');
    const ordinary = JSON.stringify({ learning: state().learningCoverage, stats: state().stats, cold: state().recognition });
    root.querySelector('#transfer-timing').value = 'untimed'; button('Start batch check').click();
    for (let i = 0; i < 10; i++) button('Skip').click();
    ok(root.textContent.includes('Batch check: review')); eq(state().transferRuns.at(-1).section, section);
    eq(JSON.stringify({ learning: state().learningCoverage, stats: state().stats, cold: state().recognition }), ordinary, `${section}: batch checks stay separate`);
    await route(`#/run/${section}/exam`, `${SECTIONS[section].title}: timed practice`);
    button('Start the clock').click(); ok(button('Finish exam'), `${section}: mock starts`); button('Finish exam').click();
    advance(2000); ok(root.querySelector('.exam-review'), `${section}: mock reviews`);
  }
  await route('#/zapn', 'Zap-N games'); ok(root.querySelector('a[href^="#/zapn/"]'), 'existing games remain reachable');
  eq(errors, [], 'no uncaught application errors during walkthrough');
  console.log(JSON.stringify({ assertions: checks, learningFamilies: families, learningQuestions, assessments: 5, batchChecks: 5, mockReviews: 5, uncaughtErrors: errors.length }));
} finally {
  Date.now = originalNow; globalThis.setInterval = originalInterval; for (const id of intervals) clearInterval(id); dom.window.close();
}
