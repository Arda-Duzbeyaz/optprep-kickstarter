import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeStore, memoryBackend } from '../../src/core/store.js';
import { blankV2, migrate } from '../../src/core/migrate.js';
import { makeRng } from '../../src/core/rng.js';
import { practiceItem, FreshQuestionsUnavailable } from '../../src/core/draw.js';
import { questionKey } from '../../src/core/questions.js';
import { familyWeights } from '../../src/core/adaptive.js';
import { mixedWeights, recordMixedAttempt, mixedSummary, boundMixedDetails, validMixedTraining, validMixedRow } from '../../src/core/mixed-training.js';

const toy = (count = 34) => ({ id: 'bto', families: Array.from({ length: count }, (_, i) => ({ id: `skill-${i}`, levels: [1],
  generate: (rng) => ({ section: 'bto', family: `skill-${i}`, difficulty: 1, prompt: { text: `skill ${i}: ${rng.seed}` }, params: { kind: 'one-method' } }) })) });
const event = (key, extra = {}) => ({ key, difficulty: 1, correct: true, fresh: true, standardTime: true, hints: 0, aided: false, uninterrupted: true, ms: 1000, budgetMs: 90000, ...extra });

test('coverage spans ten-question blocks, saves and reloads despite extreme weakness weights', () => {
  const section = toy(), ids = section.families.map((f) => f.id);
  for (let seed = 0; seed < 20; seed++) {
    const backend = memoryBackend(); let store = makeStore(backend), history = new Set(), all = [];
    const stats = Object.fromEntries(ids.map((id, i) => [`bto:${id}`, { n: 10000, correct: i < 12 ? 0 : 10000 }]));
    for (let block = 0; block < 14; block++) {
      const log = [], rng = makeRng(`rolling:${seed}:${block}`);
      for (let j = 0; j < 10; j++) {
        const round = new Set(); for (const r of log) { if (round.size === ids.length) round.clear(); round.add(r.family); }
        const item = practiceItem(section, rng, stats, { requireFresh: true, minFreshFamilies: 2, familyPool: ids,
          targets: Object.fromEntries(ids.map((id) => [id, 1])), excludeKeys: history, avoidFamilies: [...round], mixedTraining: store.mixedTraining('bto') });
        assert.equal(item.difficulty, 1); assert.equal(history.has(questionKey(item)), false);
        history.add(questionKey(item)); log.push(item); all.push(item.family);
        store.recordAnswer('bto', item.family, { ...event(questionKey(item)), mode: 'practice', mixed: true, levels: [1] });
      }
      assert.equal(new Set(log.map((r) => r.family)).size, 10);
      const before = store.mixedTraining('bto'); store = makeStore(backend); assert.deepEqual(store.mixedTraining('bto'), before);
    }
    for (let end = 68; end <= all.length; end++) assert.equal(new Set(all.slice(end - 68, end)).size, 34, `seed ${seed}, window ending ${end}`);
  }
});

test('depleted candidates do not stall rolling coverage or allow a one-skill cold batch', () => {
  const section = toy(3), old = { section: 'bto', family: 'skill-0', difficulty: 1, prompt: { text: 'old' } };
  section.families[0].generate = () => old;
  const history = new Set([questionKey(old)]), rng = makeRng('depleted-rolling'); let ledger;
  for (let i = 0; i < 30; i++) {
    const item = practiceItem(section, rng, {}, { requireFresh: true, minFreshFamilies: 2, excludeKeys: history, difficulty: 1, mixedTraining: ledger || { turn: 0, families: {} } });
    assert.notEqual(item.family, old.family); history.add(questionKey(item)); ledger = recordMixedAttempt(ledger, item.family, event(questionKey(item)));
  }
  section.families[1].generate = () => old;
  assert.throws(() => practiceItem(section, rng, {}, { requireFresh: true, minFreshFamilies: 2, excludeKeys: history, difficulty: 1, mixedTraining: ledger }), FreshQuestionsUnavailable);
});

test('pace debt raises a slow accurate skill above a moderately inaccurate fast skill', () => {
  const base = familyWeights('bto', ['slow','other'], { 'bto:slow': { n: 40, correct: 39 }, 'bto:other': { n: 40, correct: 30 } });
  let ledger;
  for (let i = 0; i < 4; i++) ledger = recordMixedAttempt(ledger, 'slow', event(`slow:${i}`, { ms: 90001 }));
  assert.ok(mixedWeights(base, ledger).slow > mixedWeights(base, ledger).other);
  const repaid = recordMixedAttempt(ledger, 'slow', event('fast')); assert.equal(repaid.families.slow.paceDebt, 3);
  const nextDifficulty = recordMixedAttempt(ledger, 'slow', event('higher', { difficulty: 2 })); assert.equal(nextDifficulty.families.slow.paceDebt, 0);
  assert.equal(mixedWeights(base, ledger, { 'bto:slow': { target: 2 } }, 'bto').slow, base.slow);
  assert.ok(mixedWeights(base, undefined, { 'bto:slow': { review: [1] } }, 'bto').slow > base.slow);
});

test('assistance, interruption, extra time and wrong answers never manufacture pace evidence', () => {
  for (const extra of [{ hints: 1 }, { aided: true }, { fresh: false }, { uninterrupted: false }, { standardTime: false }, { correct: false }]) {
    const ledger = recordMixedAttempt(undefined, 'a', event('one', { ms: 100000, ...extra })); assert.equal(ledger.families.a.paceDebt, 0);
    assert.equal(recordMixedAttempt(ledger, 'a', event('one')).turn, 1, 'duplicate answer does not advance coverage');
  }
});

const row = (extra = {}) => ({ family: 'a', evidenceVersion: 1, section: 'bto', key: 'a:b', difficulty: 1, structure: 'a/method', operations: ['counting'], structureStatus: 'unseen', fresh: true,
  standardTime: true, aided: false, interrupted: false, correct: true, hints: 0, skipped: false, score: 1, ms: 1000, budgetMs: 90000, ...extra });
test('independent summary excludes slow/helped/paused/extra-time answers and unknown historical conditions', () => {
  const rows = [row(), row({ ms: 90001 }), row({ aided: true }), row({ interrupted: true }), row({ standardTime: false }), { correct: true, ms: 1000 },
    row({ section: 'iv', score: .001 }), row({ structureStatus: 'legacy-unknown' })];
  const summary = mixedSummary(rows); assert.equal(summary.independent, 2); assert.equal(summary.unknown, 1); assert.equal(summary.slow, 1);
  assert.equal(summary.helped, 1); assert.equal(summary.interrupted, 1); assert.equal(summary.unknownBranches, 1);
});

test('bounded detail retains original scores, learning records and the most recent mixed evidence', () => {
  const learning = { mode: 'practice', family: 'learning', items: [{ family: 'learning', correct: true, ms: 5000, score: 1 }] };
  const runs = [learning, { mode: 'practice', items: Array.from({ length: 20 }, (_, i) => row({ key: String(i) })) }];
  const result = boundMixedDetails(runs, 5); assert.deepEqual(result[0], learning);
  assert.equal(result[1].items.filter((r) => r.evidenceVersion === 1).length, 5);
  assert.deepEqual(result[1].items.slice(-5), runs[1].items.slice(-5));
  assert.equal(result[1].items[0].score, 1); assert.equal(result[1].items[0].correct, true); assert.equal(result[1].items[0].ms, 1000);
  assert.equal(result[1].items[0].key, undefined); assert.ok(runs[1].items[0].key, 'does not mutate old state');
});

test('old v2 progress is extended safely without relabelling or removing evidence', () => {
  const old = blankV2(); delete old.mixedTraining;
  old.recognition = { 'bto:card-symmetry': { passed: [1], target: 2, run: 2, proofs: [{ difficulty: 1, keys: ['a','b','c'] }] } };
  old.mastery = { 'bto:card-symmetry': { lv: 4 } }; old.mixedEvidence = { 'bto:card-symmetry': { run: 3 } };
  old.learningCoverage = { 'bto:card-symmetry': { covered: true, completedBlocks: 1 } };
  const copy = structuredClone(old), migrated = migrate(old, 10).state;
  assert.deepEqual(old, copy); for (const key of ['recognition','mastery','mixedEvidence','learningCoverage']) assert.deepEqual(migrated[key], old[key]);
  assert.deepEqual(migrated.mixedTraining, {});
  assert.equal(validMixedTraining({ bto: { turn: 1, families: { a: { last: 1, difficulty: 1, paceDebt: 0, lastKey: 'a' } } } }), true);
  assert.equal(migrate({ ...old, mixedTraining: { bto: { turn: -1, families: {} } } }), null);
});

test('invalid new evidence imports are rejected before replacing existing progress', () => {
  const store = makeStore(memoryBackend()); store.markCovered('bto','two-dice-sum'); const before = store.exportJSON();
  const bad = JSON.parse(before); bad.mixedTraining = { bto: { turn: -1, families: {} } };
  assert.throws(() => store.importJSON(JSON.stringify(bad)), /Not an OptPrep backup/); assert.equal(store.exportJSON(), before);
  assert.equal(validMixedRow(row({ budgetMs: Infinity })), false); assert.equal(validMixedRow(row({ aided: 'false' })), false);
  assert.equal(validMixedRow(row({ operations: ['one', ...Array(20).fill('invalid')] })), false);
  assert.equal(mixedSummary([row({ aided: 'false' })]).unknown, 1);
});
