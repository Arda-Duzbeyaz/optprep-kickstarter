import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finiteVariants } from '../../src/practice/finite-variants.js';
import { practiceItem, PRACTICE_FRESH_SEARCH } from '../../src/core/draw.js';
import { PRACTICE_MODULES } from '../../src/practice/index.js';
import { makeRng } from '../../src/core/rng.js';
import { questionKey } from '../../src/core/questions.js';
import { structureKey } from '../../src/transfer/profile.js';
import { validateItem } from '../../src/core/contract.js';

const domains = [['two-dice-sum', 1, 66], ['two-dice-sum', 2, 91], ['die-repeats', 1, 48], ['die-repeats', 2, 60]];
const generator = (id) => PRACTICE_MODULES.bto.families.find((f) => f.id === id);
const remember = (history, item) => { const key = questionKey(item); history.delete(key); history.add(key); return key; };

for (const [family, difficulty, count] of domains) {
  test(`${family}/${difficulty}: finite catalogue covers the current generator domain with independently verified answers`, () => {
    const f = generator(family), variants = finiteVariants(f, difficulty), keys = new Set(variants.map(questionKey));
    assert.equal(variants.length, count); assert.equal(keys.size, count);
    for (const item of variants) {
      assert.deepEqual(validateItem(item), []); assert.equal(item.family, family); assert.equal(item.difficulty, difficulty);
      const result = f.verify(item); assert.ok(result === true || result?.ok === true, JSON.stringify(result));
      assert.doesNotThrow(() => JSON.stringify(item));
    }
    const original = new Set();
    for (let seed = 0; seed < 4096; seed++) {
      const item = f.generate(makeRng(`original-domain:${family}:${difficulty}:${seed}`), { difficulty });
      assert.ok(keys.has(questionKey(item)), 'catalogue must not invent a new prompt or domain'); original.add(questionKey(item));
    }
    assert.deepEqual(original, keys, 'all enumerated inputs are also reachable through the original random generator');
  });

  test(`${family}/${difficulty}: every unseen variant is drawn before revision across many deterministic seeds`, () => {
    for (let seed = 0; seed < 20; seed++) {
      const history = new Set(), structures = new Set(), rng = makeRng(`no-repeat:${seed}`);
      for (let i = 0; i < count; i++) {
        const item = practiceItem(PRACTICE_MODULES.bto, rng, {}, { family, difficulty, excludeKeys: history, preferStructures: structures, shuffleOptions: true });
        assert.equal(history.has(questionKey(item)), false, `${family}/${difficulty}, seed ${seed}, question ${i + 1}`);
        remember(history, item); structures.add(structureKey(item));
      }
      assert.equal(history.size, count);
      const oldest = [...history][0];
      const repeat = practiceItem(PRACTICE_MODULES.bto, rng, {}, { family, difficulty, excludeKeys: history, preferStructures: structures });
      assert.equal(questionKey(repeat), oldest, 'after true exhaustion choose the least recently shown variant');
    }
  });
}

test('a single remaining unseen dice question is always selected, even when its structure is familiar', () => {
  const variants = finiteVariants(generator('two-dice-sum'), 1);
  for (const heldOut of variants) for (let seed = 0; seed < 12; seed++) {
    const history = variants.filter((v) => v !== heldOut).map(questionKey);
    const item = practiceItem(PRACTICE_MODULES.bto, makeRng(`last-unseen:${seed}`), {}, {
      family: 'two-dice-sum', difficulty: 1, excludeKeys: history, preferStructures: variants.map(structureKey),
    });
    assert.equal(questionKey(item), questionKey(heldOut));
  }
});

test('the expanded easy die domain cycles least-recently-shown questions after exhaustion', () => {
  const f = generator('die-repeats'), history = new Set(finiteVariants(f, 1).map(questionKey)), rng = makeRng('tiny-domain-cycle');
  const expected = [...history];
  for (let i = 0; i < expected.length * 3; i++) {
    const item = practiceItem(PRACTICE_MODULES.bto, rng, {}, { family: f.id, difficulty: 1, excludeKeys: history, preferStructures: [] });
    assert.equal(remember(history, item), expected[i % expected.length]);
  }
});

test('generic freshness search continues beyond the old 16-candidate structure window', () => {
  let calls = 0;
  const old = { section: 'bto', family: 'toy', difficulty: 1, prompt: { text: 'old' } };
  const rare = { ...old, prompt: { text: 'unseen after candidate 32' } };
  const section = { id: 'bto', families: [{ id: 'toy', levels: [1], generate: () => ++calls === 33 ? rare : old }] };
  const item = practiceItem(section, makeRng('rare-unseen'), {}, { family: 'toy', difficulty: 1, excludeKeys: [questionKey(old)], preferStructures: [structureKey(old)] });
  assert.equal(questionKey(item), questionKey(rare)); assert.equal(calls, 33);
});

test('generic exhausted searches are bounded and prefer an older exposed question', () => {
  const items = ['oldest', 'middle', 'newest'].map((text) => ({ section: 'bto', family: 'toy', difficulty: 1, prompt: { text } }));
  let calls = 0;
  const section = { id: 'bto', families: [{ id: 'toy', levels: [1], generate: () => items[calls++ % 3] }] };
  const item = practiceItem(section, makeRng('bounded-search'), {}, { family: 'toy', difficulty: 1, excludeKeys: items.map(questionKey), preferStructures: [] });
  assert.equal(calls, PRACTICE_FRESH_SEARCH); assert.equal(questionKey(item), questionKey(items[0]));
});

test('returning a variant clones the frozen catalogue so later questions cannot be mutated by a view', () => {
  const f = generator('two-dice-sum'), history = new Set(finiteVariants(f, 1).slice(1).map(questionKey));
  const first = practiceItem(PRACTICE_MODULES.bto, makeRng('clone-one'), {}, { family: f.id, difficulty: 1, excludeKeys: history, preferStructures: [] });
  const expected = questionKey(first); first.prompt.text = 'changed by caller'; first.options[0].label = 'changed';
  const next = practiceItem(PRACTICE_MODULES.bto, makeRng('clone-two'), {}, { family: f.id, difficulty: 1, excludeKeys: history, preferStructures: [] });
  assert.equal(questionKey(next), expected); assert.deepEqual(validateItem(next), []);
});

test('unsupported family objects do not receive an unrelated finite catalogue', () => {
  assert.equal(finiteVariants({ ...generator('two-dice-sum') }, 1), null);
  assert.equal(finiteVariants(generator('two-dice-sum'), 5), null);
});

test('freshness selection preserves the chosen family and checkpoint difficulty', () => {
  const f = generator('die-repeats'), history = finiteVariants(f, 1).map(questionKey);
  const item = practiceItem(PRACTICE_MODULES.bto, makeRng('no-silent-level-jump'), {}, { family: f.id, targets: { [f.id]: 1 }, excludeKeys: history, preferStructures: [] });
  assert.equal(item.family, f.id); assert.equal(item.difficulty, 1); assert.ok(history.includes(questionKey(item)));
});

test('restoring RNG state and exposure history reproduces the next finite selection exactly', () => {
  const rng = makeRng('saved-finite-selection'), history = new Set();
  for (let i = 0; i < 10; i++) remember(history, practiceItem(PRACTICE_MODULES.bto, rng, {}, { family: 'two-dice-sum', difficulty: 1, excludeKeys: history, preferStructures: [], shuffleOptions: true }));
  const state = rng.getState(), historyCopy = new Set(history);
  const expected = practiceItem(PRACTICE_MODULES.bto, rng, {}, { family: 'two-dice-sum', difficulty: 1, excludeKeys: history, preferStructures: [], shuffleOptions: true });
  const restored = makeRng('saved-finite-selection'); restored.setState(state);
  assert.deepEqual(practiceItem(PRACTICE_MODULES.bto, restored, {}, { family: 'two-dice-sum', difficulty: 1, excludeKeys: historyCopy, preferStructures: [], shuffleOptions: true }), expected);
});
