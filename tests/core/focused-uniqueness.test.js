import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_MODULES } from '../../src/practice/index.js';
import { finiteVariants } from '../../src/practice/finite-variants.js';
import { practiceItem, FreshQuestionsUnavailable } from '../../src/core/draw.js';
import { questionKey } from '../../src/core/questions.js';
import { structureKey } from '../../src/transfer/profile.js';
import { validateItem } from '../../src/core/contract.js';
import { makeRng } from '../../src/core/rng.js';

// Includes the optional arithmetic task as well as every Kickstarter skill.
for (const [sectionId, section] of Object.entries(PRACTICE_MODULES)) for (const f of section.families) {
  test(`${sectionId}/${f.id}: ten fresh focused questions at every supported level, without escaping topic or difficulty`, () => {
    for (const difficulty of f.levels) for (let seed = 0; seed < 5; seed++) {
      const history = new Set(), structures = new Set(), rng = makeRng(`focused-ten:${sectionId}:${f.id}:${difficulty}:${seed}`);
      for (let index = 0; index < 10; index++) {
        const item = practiceItem(section, rng, {}, { family: f.id, difficulty, requireFresh: true,
          excludeKeys: history, preferStructures: structures, shuffleOptions: true });
        assert.equal(item.family, f.id); assert.equal(item.difficulty, difficulty);
        assert.equal(history.has(questionKey(item)), false, `repeat at seed ${seed}, question ${index + 1}`);
        assert.deepEqual(validateItem(item), []);
        history.add(questionKey(item)); structures.add(structureKey(item));
      }
      assert.equal(history.size, 10);
    }
  });
}

for (const section of Object.values(PRACTICE_MODULES)) for (const f of section.families) for (const difficulty of f.levels) {
  const variants = finiteVariants(f, difficulty);
  if (!variants) continue;
  test(`${f.id}/${difficulty}: complete configured catalogue is reachable and independently verified`, () => {
    assert.equal(new Set(variants.map(questionKey)).size, variants.length);
    const keys = new Set(variants.map(questionKey)), reached = new Set();
    for (const item of variants) {
      assert.deepEqual(validateItem(item), []);
      const verified = f.verify(item, makeRng(`catalogue-check:${questionKey(item)}`));
      assert.ok(verified.ok, `${item.prompt.text}: ${verified.detail}`);
    }
    // Larger catalogues require more random draws to exercise their rare inputs.
    // Keep exact equality with the complete enumerated domain; do not drop cases.
    for (let seed = 0; seed < Math.max(2048, variants.length * 64); seed++) {
      const item = f.generate(makeRng(`catalogue-membership:${f.id}:${difficulty}:${seed}`), { difficulty });
      const key = questionKey(item); assert.ok(keys.has(key), `${f.id}: unenumerated input`); reached.add(key);
    }
    assert.deepEqual(reached, keys);
  });

  test(`${f.id}/${difficulty}: last unseen item is found and real exhaustion never returns a repeat`, () => {
    const history = new Set(variants.slice(1).map(questionKey));
    for (let seed = 0; seed < 5; seed++) {
      const item = practiceItem(section, makeRng(`one-left:${seed}`), {}, {
        family: f.id, difficulty, requireFresh: true, excludeKeys: history, preferStructures: variants.map(structureKey),
      });
      assert.equal(questionKey(item), questionKey(variants[0]));
    }
    history.add(questionKey(variants[0]));
    assert.throws(() => practiceItem(section, makeRng('fully-used'), {}, {
      family: f.id, difficulty, requireFresh: true, excludeKeys: history, preferStructures: [],
    }), (error) => error instanceof FreshQuestionsUnavailable && error.catalogueExhausted === true && error.catalogueSize === variants.length && error.difficulty === difficulty);
  });
}

test('a bounded-search failure is never described as proven catalogue exhaustion', () => {
  const old = { section: 'bto', family: 'synthetic', difficulty: 1, prompt: { text: 'old' } };
  const section = { id: 'bto', families: [{ id: 'synthetic', levels: [1], generate: () => old }] };
  assert.throws(() => practiceItem(section, makeRng('bounded'), {}, { family: 'synthetic', difficulty: 1, requireFresh: true,
    excludeKeys: [questionKey(old)], preferStructures: [] }), (error) => error instanceof FreshQuestionsUnavailable && error.catalogueExhausted === false && error.catalogueSize === null);
});

test('more numeric target faces do not crowd out the other repeated-die methods', () => {
  for (let seed = 0; seed < 20; seed++) {
    const history = new Set(), structures = new Set(), kinds = new Set(), rng = makeRng(`balanced-branches:${seed}`);
    for (let index = 0; index < 3; index++) {
      const item = practiceItem(PRACTICE_MODULES.bto, rng, {}, { family: 'die-repeats', difficulty: 1, requireFresh: true, excludeKeys: history, preferStructures: structures });
      kinds.add(item.params.kind); history.add(questionKey(item)); structures.add(structureKey(item));
    }
    assert.equal(kinds.size, 3);
  }
});

test('new two-dice constraints have independently known boundary values', () => {
  const f = PRACTICE_MODULES.bto.families.find((f) => f.id === 'dice-order-stats');
  const items = f.levels.flatMap((d) => finiteVariants(f, d));
  for (const [kind, field, value, answer] of [
    ['namedDouble', 'k', 4, 1 / 36], ['notDoubles', null, null, 5 / 6], ['notLower', null, null, 7 / 12],
    ['maxAtMost', 'k', 4, 4 / 9], ['minAtLeast', 'k', 4, 1 / 4], ['signedDiff', 'd', 2, 1 / 9],
    ['diffAtLeast', 'd', 2, 5 / 9], ['diffAtMost', 'd', 2, 2 / 3],
  ]) {
    const item = items.find((q) => q.params.kind === kind && (!field || q.params[field] === value));
    assert.ok(item, kind); assert.ok(Math.abs(item.answer.value - answer) < 1e-12, item.prompt.text);
  }
});

test('uniform-product thresholds agree with independent numerical area integration', () => {
  const f = PRACTICE_MODULES.bto.families.find((f) => f.id === 'uniform-geometry');
  const items = finiteVariants(f, 4).filter((item) => item.params.kind === 'product');
  assert.equal(items.length, 19);
  for (const item of items) {
    const a = item.params.a, segments = 4096, step = (1 - a) / segments;
    let sum = 0;
    for (let i = 0; i <= segments; i++) sum += (i === 0 || i === segments ? 1 : i % 2 ? 4 : 2) * a / (a + i * step);
    const area = a + sum * step / 3;
    assert.ok(Math.abs(item.answer.value - area) < 1e-8, `${a}: ${item.answer.value} != ${area}`);
  }
});

test('distinct-face expectations retain exhaustive checks and agree with an independent count-state recurrence', () => {
  const f = PRACTICE_MODULES.iv.families.find((f) => f.id === 'expected-dice');
  for (const item of finiteVariants(f, 3).filter((item) => item.params.scenario === 'distinct')) {
    const n = item.params.n; let counts = [1, 0, 0, 0, 0, 0, 0];
    for (let roll = 0; roll < n; roll++) {
      const next = Array(7).fill(0);
      for (let seen = 0; seen <= 6; seen++) { next[seen] += counts[seen] * seen; if (seen < 6) next[seen + 1] += counts[seen] * (6 - seen); }
      counts = next;
    }
    const expected = counts.reduce((sum, ways, count) => sum + count * ways, 0) / 6 ** n;
    assert.ok(Math.abs(item.truth - expected) < 1e-10); assert.ok(f.verify(item).ok);
    assert.equal(f.verify({ ...item, truth: item.truth + 0.1 }).ok, false);
    if (n <= 6) {
      let sum = 0;
      for (let code = 0; code < 6 ** n; code++) { let value = code; const faces = new Set(); for (let i = 0; i < n; i++) { faces.add(value % 6); value = Math.floor(value / 6); } sum += faces.size; }
      assert.ok(Math.abs(item.truth - sum / 6 ** n) < 1e-10);
    }
  }
});

test('distractor explanations and small-domain sanity checks match their actual arithmetic', () => {
  const games = PRACTICE_MODULES.bto.families.find((f) => f.id === 'dice-games-ev');
  const base = makeRng('product-distractor'); let first = true;
  const product = games.generate({ ...base, pick: (array) => { if (first) { first = false; return array[2]; } return base.pick(array); } }, { difficulty: 2 });
  const extremes = product.options.find((option) => option.misconception?.startsWith('Averaged the extreme products'));
  assert.ok(extremes); assert.equal(extremes.value, (1 + 36) / 2); assert.equal(product.answer.value, 3.5 ** 2);
  const coupon = PRACTICE_MODULES.bto.families.find((f) => f.id === 'coupon-collector');
  const coin = finiteVariants(coupon, 2).find((item) => item.params.s === 2);
  assert.equal(coin.answer.value, 3); assert.ok(coin.solution.check.includes('exactly 3'));
  const order = PRACTICE_MODULES.bto.families.find((f) => f.id === 'dice-order-stats');
  const minimumOne = finiteVariants(order, 2).find((item) => item.params.kind === 'min' && item.params.k === 1);
  const unordered = minimumOne.options.find((option) => option.misconception?.startsWith('Divided an ordered'));
  assert.ok(unordered); assert.equal(unordered.value, 11 / 21); assert.equal(minimumOne.answer.value, 11 / 36);
});
