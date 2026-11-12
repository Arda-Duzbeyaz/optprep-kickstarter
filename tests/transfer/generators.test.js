import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXTRA_FAMILIES } from '../../src/transfer/index.js';
import { makeRng } from '../../src/core/rng.js';
import { familySuite, itemKey } from '../helpers/harness.js';
import { structureKey } from '../../src/transfer/profile.js';
import { validateDiagram } from '../../src/study/diagrams/index.js';
import { PROTOCOLS } from '../../src/transfer/families/information-protocols.js';
import { SOURCE_TASKS } from '../../src/transfer/families/shared-source.js';
import { SELECTION_TASKS } from '../../src/transfer/families/selection-weights.js';
import { RATE_LEVELS } from '../../src/transfer/families/rates-weights.js';
for (const f of EXTRA_FAMILIES) familySuite(f.section, f, { seeds: 240, verifySeeds: 120 });
const byId = (id) => EXTRA_FAMILIES.find((f) => f.id === id);

test('all supported structural branches have valid solutions and independently checked answers', () => {
  const cases = [['information-protocols', PROTOCOLS, 4], ['shared-source', SOURCE_TASKS, 5], ['selection-weights', SELECTION_TASKS, 4], ['rates-weights', Object.values(RATE_LEVELS).flat(), 4]];
  for (const [id, variants, difficulty] of cases) for (const variant of variants) for (let s = 0; s < 30; s++) {
    const f = byId(id), seed = `branch:${id}:${variant}:${s}`, it = f.generate(makeRng(seed), { difficulty, variant });
    assert.ok(f.verify(it).ok, seed);
    if (it.solution.picture) assert.deepEqual(validateDiagram(it.solution.picture.diagram, it.solution.picture.spec), [], seed);
    assert.deepEqual(it, f.generate(makeRng(seed), { difficulty, variant }));
  }
});
test('distinct numeric questions are not counted as distinct structures', () => {
  for (const f of EXTRA_FAMILIES) {
    const exact = new Set(), structures = new Set();
    for (let s = 0; s < 300; s++) { const it = f.generate(makeRng(`variety:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] }); exact.add(itemKey(it)); structures.add(structureKey(it)); assert.ok(it.transfer.operations.length >= 2); }
    assert.ok(exact.size >= 150, f.id);
    assert.ok(structures.size >= 3 && structures.size < exact.size / 2, f.id);
  }
});
test('random and first reports agree while existence reports change the answer', () => {
  const f = byId('information-protocols');
  for (let s = 0; s < 40; s++) {
    const seed = `contrast:report:${s}`;
    const a = f.generate(makeRng(seed), { difficulty: 3, variant: 'first-red' });
    const b = f.generate(makeRng(seed), { difficulty: 3, variant: 'random-red' });
    const c = f.generate(makeRng(seed), { difficulty: 3, variant: 'any-red' });
    assert.equal(a.answer.value, b.answer.value); assert.notEqual(a.answer.value, c.answer.value);
    assert.deepEqual(a.params, { ...c.params, protocol: 'first-red' });
    assert.match(a.solution.steps.at(-1).math, /\)\/\(/, 'fraction quotients are parenthesised');
  }
});
test('history affects a fixed source but not a fresh source; corrupted keys are rejected', () => {
  const f = byId('shared-source'); let fixed = 0, fresh = 0;
  for (let s = 0; s < 100; s++) {
    const it = f.generate(makeRng(`history:${s}`), { difficulty: 4, variant: 'next' }), p = it.params;
    const marginal = (p.wa * p.a + p.wb * p.b) / ((p.wa + p.wb) * 10);
    assert.ok(it.answer.value >= p.a / 10 && it.answer.value <= p.b / 10);
    if (!p.shared) { fresh++; assert.ok(Math.abs(it.answer.value - marginal) < 1e-10); } else fixed++;
    const bad = structuredClone(it); bad.answer.value += .01; bad.options[bad.answerIndex].value = bad.answer.value;
    assert.equal(f.verify(bad).ok, false);
  }
  assert.ok(fixed > 20 && fresh > 20);
});
test('shared-group comparisons vary answer positions and the third comparator position', () => {
  const f = byId('selection-weights'), orders = new Set(), positions = new Set();
  for (let s = 0; s < 100; s++) {
    const it = f.generate(makeRng(`rank-order:${s}`), { difficulty: 4 }); orders.add(it.answerOrder.join(','));
    const ps = Object.fromEntries(it.params.statements.map((k, i) => [k, it.statements[i].p]));
    assert.ok(ps.shared > ps.independent);
    const comparator = it.params.statements.find((k) => !['shared', 'independent'].includes(k));
    positions.add(it.answerOrder.findIndex((i) => it.params.statements[i] === comparator));
  }
  assert.equal(orders.size, 6); assert.equal(positions.size, 3);
});
test('equal time and equal distance require different answers with identical speeds', () => {
  const f = byId('rates-weights');
  for (let s = 0; s < 40; s++) {
    const seed = `rate-contrast:${s}`, a = f.generate(makeRng(seed), { difficulty: 3, variant: 'equal-time' }), b = f.generate(makeRng(seed), { difficulty: 3, variant: 'equal-distance' });
    assert.equal(a.params.v1, b.params.v1); assert.ok(b.truth < a.truth);
    const bad = structuredClone(b); bad.truth = a.truth; assert.equal(f.verify(bad).ok, false);
  }
});
test('difficulty changes reasoning relationships rather than just number size', () => {
  const f = byId('shared-source');
  for (const [difficulty, tasks] of [[2, ['all']], [3, ['count']], [4, ['next', 'source']], [5, ['next', 'source']]]) for (let s = 0; s < 50; s++) {
    const it = f.generate(makeRng(`depth:${difficulty}:${s}`), { difficulty }); assert.ok(tasks.includes(it.params.task)); if (difficulty === 5) assert.ok(it.params.blue > 0);
  }
});
