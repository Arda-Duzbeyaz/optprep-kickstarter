import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_MODULES } from '../../src/practice/index.js';
import { finiteVariants } from '../../src/practice/finite-variants.js';
import { makeRng } from '../../src/core/rng.js';
import { validateItem } from '../../src/core/contract.js';

const get = (section, id) => PRACTICE_MODULES[section].families.find((f) => f.id === id);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('all repeated-die inputs agree with direct outcome counting, including impossible all-distinct events', () => {
  const f = get('bto', 'die-repeats'), kinds = new Set();
  for (const difficulty of f.levels) for (const q of finiteVariants(f, difficulty)) {
    const { kind, n, k, face } = q.params; kinds.add(kind);
    let hits = 0;
    for (let code = 0; code < k ** n; code++) {
      let value = code; const rolls = [];
      for (let i = 0; i < n; i++) { rolls.push(value % k + 1); value = Math.floor(value / k); }
      const distinct = new Set(rolls).size, neighbouring = rolls.slice(1).some((r, i) => r === rolls[i]);
      const predicates = { allDiff: distinct === n, allSame: distinct === 1, allTarget: rolls.every((r) => r === (face ?? (k === 6 ? 6 : 1))),
        noAdjacent: !neighbouring, adjacentRepeat: neighbouring, someRepeat: distinct < n,
        returnFirst: new Set(rolls.slice(0, -1)).size === n - 1 && rolls[0] === rolls.at(-1) };
      hits += Number(predicates[kind]);
    }
    near(q.answer.value, hits / k ** n); assert.deepEqual(validateItem(q), []);
    assert.ok(f.verify(q).ok);
  }
  assert.equal(kinds.size, 7);
});

for (const [section, id] of [['bto', 'at-least-one'], ['bto', 'conditional-dice'], ['nl', 'multiply-index'], ['nl', 'primes'], ['iv', 'coupon'], ['iv', 'waiting-time']]) {
  test(`${section}/${id}: expanded inputs have valid contracts and independent answers at every supported difficulty`, () => {
    const f = get(section, id);
    for (const difficulty of f.levels) for (let seed = 0; seed < 200; seed++) {
      const q = f.generate(makeRng(`expanded-check:${id}:${difficulty}:${seed}`), { difficulty });
      assert.deepEqual(validateItem(q), []); const result = f.verify(q); assert.ok(result.ok, `${difficulty}/${seed}: ${result.detail}`);
      if (q.kind === 'mcq') {
        assert.equal(q.options.filter((o) => Math.abs(o.value - q.answer.value) < 1e-10).length, 1);
        near(q.options[q.answerIndex].value, q.answer.value);
      }
    }
  });
}

for (const id of ['multiply-index', 'primes']) test(`nl/${id}: missing terms and forward terms agree with a separate arithmetic implementation`, () => {
  const f = get('nl', id), seen = new Set();
  for (const difficulty of f.levels) for (let seed = 0; seed < 300; seed++) {
    const q = f.generate(makeRng(`direction:${id}:${difficulty}:${seed}`), { difficulty }), p = q.params.coeffs;
    let expected;
    if (id === 'multiply-index') {
      expected = [p.a]; for (let i = 1; i < q.answer.full.length; i++) expected.push(expected.at(-1) * (i + p.s) + p.c);
    } else {
      const primes = [];
      for (let candidate = 2; primes.length < p.s + q.answer.full.length; candidate++) {
        let prime = true;
        for (let factor = 2; factor * factor <= candidate; factor++) if (candidate % factor === 0) { prime = false; break; }
        if (prime) primes.push(candidate);
      }
      expected = primes.slice(p.s).map((prime) => p.sq ? prime ** 2 : p.al * prime + p.be);
    }
    assert.deepEqual(q.answer.full.map((value) => Number(value.replace(/−/g, '-'))), expected); near(q.answer.value, expected[q.answer.position]);
    const direction = q.prompt.sequence.at(-1) === '?' ? 'forward' : 'missing'; seen.add(`${difficulty}:${direction}`);
    if (direction === 'missing') assert.ok(q.answer.position >= 3 && q.answer.position < expected.length - 1);
  }
  assert.equal(seen.size, f.levels.length * 2);
});

test('all 75 uniform coupon starting states use remaining stages; one missing face still takes n rolls', () => {
  const f = get('iv', 'coupon');
  for (let n = 3; n <= 12; n++) for (let collected = 0; collected < n; collected++) {
    const rng = makeRng(`coupon-state:${n}:${collected}`), ints = [n, collected];
    const q = f.generate({ ...rng, int: (lo, hi) => ints.length ? ints.shift() : rng.int(lo, hi) }, { difficulty: 3 });
    const e = Array(n + 1).fill(0);
    for (let c = n - 1; c >= 0; c--) e[c] = (1 + (n - c) / n * e[c + 1]) / (1 - c / n);
    near(q.truth, e[collected]); assert.ok(f.verify(q).ok);
    assert.equal(q.params.collected, collected);
    if (collected === n - 1) near(q.truth, n);
  }
});

test('waiting-time hard cases cover distinct partial-overlap structures, with known exact benchmarks', () => {
  const f = get('iv', 'waiting-time'), found = new Map();
  for (let seed = 0; seed < 800; seed++) {
    const q = f.generate(makeRng(`hard-pattern:${seed}`), { difficulty: 4 }); found.set(q.params.pattern, q);
  }
  for (const [pattern, truth] of [['1212', 1332], ['1231', 1302], ['1111', 1554], ['1234', 1296]]) {
    assert.ok(found.has(pattern), pattern); near(found.get(pattern).truth, truth); assert.ok(f.verify(found.get(pattern)).ok);
  }
});
