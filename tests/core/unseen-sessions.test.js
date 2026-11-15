import { test } from 'node:test';
import assert from 'node:assert/strict';
import { practiceItem, examItems, FreshQuestionsUnavailable } from '../../src/core/draw.js';
import { questionKey, questionSeen, legacyQuestionKey } from '../../src/core/questions.js';
import { makeRng } from '../../src/core/rng.js';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { promptText } from '../../src/sections/ob/lib.js';
import { makeStore, memoryBackend, KEY } from '../../src/core/store.js';

const item = (family, text, difficulty = 1) => ({ section: 'bto', family, difficulty, prompt: { text } });
const constant = (id, text = id) => ({ id, levels: [1], generate: () => item(id, text) });

test('fresh mixed selection searches other eligible skills instead of recycling the chosen skill', () => {
  const section = { id: 'bto', families: [constant('spent'), constant('new-a'), constant('new-b')] };
  for (let seed = 0; seed < 20; seed++) {
    const it = practiceItem(section, makeRng(seed), {}, { requireFresh: true, minFreshFamilies: 2,
      excludeKeys: [questionKey(item('spent', 'spent'))], avoidFamilies: ['new-a', 'new-b'] });
    assert.ok(['new-a', 'new-b'].includes(it.family));
  }
});

test('one remaining fresh skill is insufficient for a cold mixed session', () => {
  const section = { id: 'bto', families: [constant('spent'), constant('new')] };
  assert.throws(() => practiceItem(section, makeRng(1), {}, { requireFresh: true, minFreshFamilies: 2,
    excludeKeys: [questionKey(item('spent', 'spent'))] }), (error) => error instanceof FreshQuestionsUnavailable && error.freshFamilies === 1);
});

test('freshness does not silently advance the checkpoint difficulty or leave the selected pool', () => {
  const section = { id: 'bto', families: [
    { id: 'spent', levels: [1, 2], generate: (_, { difficulty }) => item('spent', `level-${difficulty}`, difficulty) }, constant('outside'),
  ] };
  assert.throws(() => practiceItem(section, makeRng(2), {}, { requireFresh: true, familyPool: ['spent'], targets: { spent: 1 },
    excludeKeys: [questionKey(item('spent', 'level-1'))] }), FreshQuestionsUnavailable);
});

test('exhausted mock generation throws instead of returning repeats or an incomplete paper', () => {
  const section = { id: 'bto', families: [constant('only')], bank: [] };
  assert.throws(() => examItems(section, { count: 2, bankRatio: 0 }, 'exhausted'), FreshQuestionsUnavailable);
  assert.throws(() => examItems(section, { count: 1, excludeKeys: [questionKey(item('only', 'only'))] }, 'seen'), FreshQuestionsUnavailable);
  assert.deepEqual(examItems(section, { count: 0 }, 'empty'), []);
});

test('duplicate bank entries cannot bypass mock freshness', () => {
  const bankItem = item('bank', 'one fixed question');
  const section = { id: 'bto', families: [], bank: [bankItem, structuredClone(bankItem)] };
  assert.throws(() => examItems(section, { count: 2, bankRatio: 1 }, 'bank-only'), FreshQuestionsUnavailable);
});

test('fresh mock fallback tries another family and preserves full count', () => {
  let n = 0;
  const section = { id: 'bto', families: [constant('spent'), { id: 'fresh', levels: [1], generate: () => item('fresh', `fresh-${++n}`) }], bank: [] };
  const history = new Set([questionKey(item('spent', 'spent'))]);
  const paper = examItems(section, { count: 10, excludeKeys: history }, 'fallback');
  assert.equal(paper.length, 10);
  for (const q of paper) { assert.equal(questionSeen(history, q), false); history.add(questionKey(q)); }
});

test('generated mock option letters are shuffled while the correct numerical answer stays keyed', () => {
  const section = { id: 'bto', bank: [], families: [{ id: 'sorted', levels: [1], generate: (rng) => ({
    ...item('sorted', `sorted-${rng.int(0, 1e9)}`), kind: 'mcq',
    options: [1, 2, 3, 4].map((value) => ({ label: String(value), value })), answerIndex: 3, answer: { value: 4 },
  }) }] };
  const paper = examItems(section, { count: 100, bankRatio: 0 }, 'option-order');
  const counts = [0, 0, 0, 0];
  for (const q of paper) { assert.equal(q.options[q.answerIndex].value, 4); counts[q.answerIndex]++; }
  assert.ok(counts.every((count) => count >= 10 && count <= 40), String(counts));
  assert.deepEqual(paper, examItems(section, { count: 100, bankRatio: 0 }, 'option-order'));
});

test('Orderbooks card permutations are one question, including legacy saved hashes', () => {
  const original = SECTION_MODULES.ob.families.find((f) => f.id === 'hidden').generate(makeRng('canonical-board'), { difficulty: 4 });
  const swapped = structuredClone(original);
  swapped.board.instruments.reverse(); swapped.prompt.text = promptText(swapped.board);
  assert.notEqual(legacyQuestionKey(original), legacyQuestionKey(swapped));
  assert.equal(questionKey(original), questionKey(swapped));
  assert.equal(questionSeen(new Set([legacyQuestionKey(original)]), swapped), true);
  assert.equal(questionSeen(new Set([questionKey(original)]), swapped), true);
  const altered = structuredClone(swapped); altered.board.instruments[0].bid -= 0.5; altered.prompt.text = promptText(altered.board);
  assert.equal(questionSeen(new Set([legacyQuestionKey(original), questionKey(original)]), altered), false);
  // Old opaque history survives reload, alongside all unrelated progress.
  const backend = memoryBackend(), store = makeStore(backend);
  store.state.recentQuestions.ob = [legacyQuestionKey(original)]; store.state.learningCoverage['bto:two-dice-sum'] = { covered: true, attempts: 10 };
  backend.setItem(KEY, JSON.stringify(store.state));
  const reloaded = makeStore(backend);
  assert.equal(questionSeen(reloaded.recentQuestionKeys('ob'), swapped), true);
  assert.equal(reloaded.coverage('bto', 'two-dice-sum').covered, true);
});
