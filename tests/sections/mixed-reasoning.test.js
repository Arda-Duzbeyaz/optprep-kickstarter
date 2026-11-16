import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_MODULES } from '../../src/practice/index.js';
import { finiteVariants } from '../../src/practice/finite-variants.js';
import { makeRng } from '../../src/core/rng.js';
import { questionKey } from '../../src/core/questions.js';
import { practiceItem } from '../../src/core/draw.js';
import { recognitionStep, recognitionProgress } from '../../src/core/recognition.js';
import { structureKey, legacyStructureKey, structureStatus, structureOperations } from '../../src/transfer/profile.js';
import { checkpointAvailability } from '../../src/practice/availability.js';
import { validateItem } from '../../src/core/contract.js';
const family = (id) => PRACTICE_MODULES.bto.families.find((f) => f.id === id);

test('expanded sum pools retain old prompts and support a fresh cold pass after twenty learning exposures', () => {
  const f = family('two-dice-sum');
  for (const [difficulty, expected] of [[1,66],[2,91]]) {
    const items = finiteVariants(f, difficulty); assert.equal(items.length, expected);
    const oldPrompts = difficulty === 1 ? [
      ...Array.from({ length: 11 }, (_, i) => `You throw two fair six-sided dice. What is the probability that the sum is exactly ${i + 2}?`),
      ...Array.from({ length: 10 }, (_, i) => `You throw two fair six-sided dice. What is the probability that the sum is ${i + 2} or ${i + 3}?`),
    ] : [];
    for (const text of oldPrompts) assert.ok(items.some((item) => item.prompt.text === text), text);
    const history = new Set(items.slice(0,20).map(questionKey)); let progress;
    const rng = makeRng(`post-learning:${difficulty}`);
    for (let i = 0; i < 3; i++) {
      const item = practiceItem(PRACTICE_MODULES.bto, rng, {}, { family: f.id, difficulty, requireFresh: true, excludeKeys: history });
      assert.equal(history.has(questionKey(item)), false); history.add(questionKey(item));
      progress = recognitionStep(progress, { key: questionKey(item), difficulty, levels: [difficulty], correct: true, ms: 1000, budgetMs: 90000 });
    }
    assert.ok(progress.passed.includes(difficulty));
  }
});

test('every new sum union, bounded interval and outside event agrees with independently parsed ordered outcomes', () => {
  const f = family('two-dice-sum');
  for (const difficulty of f.levels) for (const item of finiteVariants(f, difficulty)) {
    const text = item.prompt.text; let event;
    let m;
    if ((m = text.match(/exactly (\d+)/))) event = (s) => s === +m[1];
    else if ((m = text.match(/less than (\d+) or greater than (\d+)/))) event = (s) => s < +m[1] || s > +m[2];
    else if ((m = text.match(/between (\d+) and (\d+), inclusive/))) event = (s) => s >= +m[1] && s <= +m[2];
    else if ((m = text.match(/sum is (\d+) or (\d+)/))) event = (s) => s === +m[1] || s === +m[2];
    else if ((m = text.match(/at least (\d+)/))) event = (s) => s >= +m[1];
    else if ((m = text.match(/at most (\d+)/))) event = (s) => s <= +m[1];
    else if ((m = text.match(/divisible by (\d+)/))) event = (s) => s % +m[1] === 0;
    else if ((m = text.match(/sum is (odd|even)/))) event = (s) => s % 2 === Number(m[1] === 'odd');
    assert.ok(event, text); let hits = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) hits += Number(event(a + b));
    assert.ok(Math.abs(item.answer.value - hits/36) < 1e-12); assert.ok(f.verify(item).ok); assert.deepEqual(validateItem(item), []);
  }
});

test('all expanded card-hand answers agree with weighted colour-order enumeration, with real labelled-card counts', () => {
  const f = family('card-draws');
  const has = {
    aces: (c) => c % 13 === 0, face: (c) => c % 13 >= 10,
    hearts: (c) => c < 13, red: (c) => c < 26, numbered: (c) => c % 13 >= 1 && c % 13 <= 9,
    redFace: (c) => c < 26 && c % 13 >= 10,
  };
  assert.equal(finiteVariants(f,2).length, 57); assert.equal(finiteVariants(f,3).length, 49);
  let checked = 0;
  for (const difficulty of [2,3]) for (const item of finiteVariants(f,difficulty)) {
    assert.deepEqual(validateItem(item), []); assert.ok(f.verify(item).ok);
    if (item.params.kind !== 'handGroup') continue;
    checked++;
    assert.ok(structureKey(item).endsWith(`authored:hand:${item.params.mode}`));
    assert.ok(structureOperations(item).includes('without-replacement'));
    const p = item.params, good = Array.from({ length: 52 }, (_, i) => i).filter(has[p.group]).length;
    let expected = 0;
    for (let pattern = 0; pattern < 2 ** p.k; pattern++) {
      let reds = 0, blues = 0, probability = 1;
      for (let draw = 0; draw < p.k; draw++) {
        if (pattern >> draw & 1) { probability *= (good - reds)/(52 - draw); reds++; }
        else { probability *= (52 - good - blues)/(52 - draw); blues++; }
      }
      const hit = p.mode === 'all' ? reds === p.k : p.mode === 'none' ? reds === 0 : p.mode === 'atLeast' ? reds >= 1 : reds === (p.mode === 'exactOne' ? 1 : 2);
      if (hit) expected += probability;
    }
    assert.ok(Math.abs(item.answer.value - expected) < 1e-12, item.prompt.text);
    assert.equal(f.verify({ ...item, answer: { ...item.answer, value: item.answer.value + .01 } }).ok, false);
  }
  assert.equal(checked, 80, 'every newly configured hand event reaches the independent checker');
});

test('observed discards preserve the unseen-versus-observed contrast, including zero remaining aces', () => {
  const f = family('card-symmetry'); let count = 0;
  for (const kind of ['seenRed','seenAce']) for (let d = 2; d <= 10; d++) for (let seen = 0; seen <= Math.min(kind === 'seenRed' ? 26 : 4, d); seen++) {
    const base = makeRng(`observed:${kind}:${d}:${seen}`), ints = [d,seen];
    const item = f.generate({ ...base, pick: (array) => array.includes(kind) ? kind : base.pick(array), int: () => ints.shift() }, { difficulty: 2 });
    assert.equal(ints.length, 0); assert.ok(f.verify(item).ok); assert.deepEqual(validateItem(item), []);
    assert.equal(item.difficulty, 2); assert.equal(item.params.kind, kind);
    const expected = ((kind === 'seenRed' ? 26 : 4) - seen)/(52-d); assert.ok(Math.abs(expected-item.answer.value) < 1e-12);
    if (kind === 'seenAce' && seen === 4) assert.equal(item.answer.value, 0);
    count++;
  }
  assert.equal(count, 105);
});

test('authored structures distinguish actual event changes, ignore cosmetic relabelling, and preserve legacy uncertainty', () => {
  const sums = finiteVariants(family('two-dice-sum'),2);
  const lower = sums.find((i) => i.params.eventKind === 'atLeast'), upper = sums.find((i) => i.params.eventKind === 'atMost');
  assert.notEqual(structureKey(lower), structureKey(upper)); assert.equal(legacyStructureKey(lower), legacyStructureKey(upper));
  assert.equal(structureStatus([legacyStructureKey(lower)], upper), 'legacy-unknown');
  assert.equal(structureStatus([structureKey(upper)], upper), 'seen');
  const f = family('pattern-waiting'); const found = {};
  for (let seed = 0; seed < 2000 && Object.keys(found).length < 3; seed++) {
    const item = f.generate(makeRng(`pattern-structure:${seed}`), { difficulty: 3 });
    if (['HH','TT','HT'].includes(item.params.A)) found[item.params.A] = item;
  }
  assert.equal(structureKey(found.HH), structureKey(found.TT)); assert.notEqual(structureKey(found.HH), structureKey(found.HT));
  assert.ok(structureOperations(found.HH).includes('self-overlap'));
  const card = family('card-symmetry'); let red, ace;
  for (let seed = 0; seed < 50 && (!red || !ace); seed++) { const item = card.generate(makeRng(`unseen:${seed}`), { difficulty: 1 }); if (item.params.kind === 'discardRed') red = item; else ace = item; }
  assert.equal(structureKey(red), structureKey(ace), 'same symmetry principle is not relabelled as two techniques');
});

test('true checkpoint shortages are visible without changing coverage, checkpoint targets or fresh-only drawing', () => {
  const f = family('card-draws'), variants = finiteVariants(f,2), p = recognitionProgress({ target: 2, run: 0 }, f.levels);
  // Ask directly for level 2 to reproduce an exhausted later checkpoint.
  p.target = 2; p.remaining = 3;
  const availability = checkpointAvailability('bto',f.id,p,variants.slice(1).map(questionKey));
  assert.equal(availability.remaining, 1); assert.equal(availability.blocked, true);
  assert.equal(checkpointAvailability('bto','card-symmetry',p,[]), null, 'an unknown domain is not declared exhausted');
});
