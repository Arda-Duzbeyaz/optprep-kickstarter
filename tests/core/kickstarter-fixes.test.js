import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCountdown, examClockStatus } from '../../src/core/timer.js';
import { checkItem } from '../../src/core/check.js';
import { makeStore, memoryBackend } from '../../src/core/store.js';
import { blankV2, migrate } from '../../src/core/migrate.js';
import { makeRng } from '../../src/core/rng.js';
import { questionKey } from '../../src/core/questions.js';
import { examItems, practiceItem } from '../../src/core/draw.js';
import { readiness } from '../../src/core/readiness.js';
import { SECTIONS } from '../../config/sections.js';
import { activatePreset, timingAtLeastAsStrict } from '../../config/presets.js';
import { formatLine } from '../../src/ui/pages/format.js';
import funds from '../../src/sections/ll/families/fund-returns.js';

test('Kickstarter enforces an outer 25-minute BTO cap alongside the item clock', () => {
  activatePreset({ id: 'kickstarter' });
  assert.equal(SECTIONS.bto.exam.totalSeconds, 1500);
  assert.equal(SECTIONS.bto.exam.perItemSeconds, 90);
  const line = formatLine(SECTIONS.bto);
  assert.ok(line.includes('90 s each') && line.includes('25 min total'));
  let now = 0;
  const total = makeCountdown(1500000, () => now);
  let item = makeCountdown(90000, () => now);
  now = 90000;
  assert.equal(examClockStatus(total, item).expired, 'item');
  item = makeCountdown(90000, () => now);
  assert.equal(examClockStatus(total, item).expired, null);
  now = 1499000;
  item = makeCountdown(90000, () => now);
  assert.equal(examClockStatus(total, item).remaining, 1000);
  now = 1500000;
  assert.equal(examClockStatus(total, item).expired, 'total');
  activatePreset({ id: 'full' });
});

test('a 30-minute or unstamped BTO run cannot count under a 25-minute cap', () => {
  const exam = { count: 20, perItemSeconds: 90, totalSeconds: 1500 };
  const loose = { finishedAt: 1, score: 20, max: 20, timing: { count: 20, perItemSeconds: 90 } };
  assert.equal(timingAtLeastAsStrict(loose, exam), false);
  const good = { ...loose, timing: exam, freshnessChecked: true };
  assert.equal(timingAtLeastAsStrict(good, exam), true);
  assert.equal(readiness([loose, loose, loose], { metric: 'net', value: 12 }, 3, exam).ready, false);
  assert.equal(readiness([good, good, good], { metric: 'net', value: 12 }, 3, exam).ready, true);
  assert.equal(readiness([good, good, { ...good, repeatCount: 1 }], { metric: 'net', value: 12 }, 3, exam).ready, false);
});

test('wide covering intervals earn their score without claiming mastery', () => {
  const store = makeStore(memoryBackend());
  for (let i = 0; i < 15; i++) {
    const result = checkItem({ kind: 'interval', truth: 30 + i }, { lower: 1, upper: 1000 });
    assert.equal(result.score, 0.001);
    assert.equal(result.correct, true, 'coverage is separate from training success');
    store.recordAnswer('iv', 'dots-count', { ...result, ms: 5000, budgetMs: 45000, mixed:true, levels:[1,2],difficulty:1,key:`wide${i}` });
  }
  assert.equal(store.mastery()['iv:dots-count'], undefined);
  assert.deepEqual(store.recognition()['iv:dots-count'].passed, []);
  const stats = store.stats()['iv:dots-count'];
  assert.equal(stats.correct, 0);
  assert.equal(stats.covered, 15);
  assert.equal(stats.scoreN, 15);
  assert.ok(Math.abs(stats.scoreSum / stats.scoreN - 0.001) < 1e-12);
  for (let i = 0; i < 3; i++) store.recordAnswer('iv', 'dots-count', {
    correct: true, score: 0.8, ms: 5000, budgetMs: 45000, mixed:true,levels:[1,2],difficulty:1,key:`tight${i}`,
  });
  assert.deepEqual(store.recognition()['iv:dots-count'].passed, [1]);
  assert.equal(store.mastery()['iv:dots-count'], undefined);
});

test('old interval mastery is reassessed while answers, lessons, other mastery and XP survive', () => {
  const old = blankV2();
  delete old.practiceRuleVersion;
  old.stats['iv:dots-count'] = { n: 15, correct: 15, ms: 75000 };
  old.mastery = { 'iv:dots-count': { lv: 5, run: 0, prun: 0 }, 'bto:bayes': { lv: 4 } };
  old.activity.xpBase = 150;
  old.study = { lesson: { status: 'mastered' } };
  const state = migrate(old).state;
  assert.equal(state.mastery['iv:dots-count'].lv, 0);
  assert.deepEqual(state.mastery['bto:bayes'], old.mastery['bto:bayes']);
  assert.deepEqual(state.stats, old.stats);
  assert.deepEqual(state.study, old.study);
  assert.equal(state.activity.xpBase, 150);
  assert.deepEqual(migrate(state).state, state, 'the reassessment runs only once');
});

const question = (text) => ({ section: 'bto', family: 'toy', difficulty: 1, prompt: { text } });
const toy = { id: 'bto', bank: [question('bank')], families: [{ id: 'toy', levels: [1],
  generate: (rng) => question(`new ${rng.int(0, 1e9)}`) }] };

test('fresh exam and adaptive draws avoid questions actually seen in earlier sessions', () => {
  const cfg = { count: 20, bankRatio: 0.2 };
  const first = examItems(toy, cfg, 'seed');
  const excluded = new Set(first.map(questionKey));
  const second = examItems(toy, { ...cfg, excludeKeys: excluded }, 'seed');
  assert.ok(second.every((q) => !excluded.has(questionKey(q))));
  const seen = practiceItem(toy, makeRng('practice'), {});
  const next = practiceItem(toy, makeRng('practice'), {}, { excludeKeys: [questionKey(seen)] });
  assert.notEqual(questionKey(next), questionKey(seen));
});

test('visible question history persists and shuffling ranking answers does not make a question fresh', () => {
  const backend = memoryBackend();
  const store = makeStore(backend);
  const q = { ...question('rank'), kind: 'rank', statements: [{ text: 'A', p: 0.2 }, { text: 'B', p: 0.8 }] };
  store.rememberQuestion(q);
  const back = makeStore(backend);
  const shuffled = { ...q, statements: [...q.statements].reverse(), answerOrder: [1, 0] };
  assert.equal(questionKey(q), questionKey(shuffled));
  assert.ok(back.recentQuestionKeys('bto').has(questionKey(shuffled)));
  const imported = makeStore(memoryBackend());
  imported.importJSON(back.exportJSON());
  assert.ok(imported.recentQuestionKeys('bto').has(questionKey(q)));
});

test('the fund explanation stays valid when the volatile fund is positive more often', () => {
  const item = funds.generate(makeRng('independent-fund:52'), { difficulty: 2 });
  const rates = item.params.returns.map((r) => r.filter((x) => x > 0).length / r.length);
  assert.ok(rates[1] > rates[0], 'this reproduces the audited counterexample');
  assert.ok(funds.verify(item).ok);
  assert.ok(item.solution.steps.at(-1).why.includes('observed years'));
  assert.ok(!item.solution.steps.at(-1).why.includes('dominates'));
});
