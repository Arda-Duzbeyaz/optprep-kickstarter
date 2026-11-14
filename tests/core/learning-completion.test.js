import { test } from 'node:test';
import assert from 'node:assert/strict';
import { learningBlock, addLearningBlock, snapshotLearningBlock } from '../../src/core/learning.js';
import { makeStore, memoryBackend, KEY, compact } from '../../src/core/store.js';
import { blankV2, migrate } from '../../src/core/migrate.js';
import { makeRng } from '../../src/core/rng.js';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { questionKey } from '../../src/core/questions.js';

const family = 'two-dice-sum', key = `bto:${family}`;
const run = (changes = {}) => ({ section: 'bto', mode: 'practice', family, blockId: 'focused-1',
  plannedCount: 10, completed: true, max: 10, score: 6, finishedAt: 1000,
  items: Array.from({ length: 10 }, (_, i) => ({ family, correct: i >= 2, score: i >= 2 ? 1 : -1, hints: 0, skipped: false, ms: 2000 })), ...changes });
function snapshot() {
  const item = SECTION_MODULES.bto.families.find((f) => f.id === family).generate(makeRng('completed-feedback'), { difficulty: 1 });
  return { version: 1, section: 'bto', family, scope: 'all', familyPool: [family], seed: 'focused-1', rngState: 1,
    index: 9, count: 10, log: run().items, xp0: 0, lv0: {}, savedAt: 1000,
    current: { item, fresh: true, hints: 0, budgetMs: 90000, interrupted: false, aided: false,
      elapsedMs: 2000, done: true, response: { choice: item.answerIndex }, draft: { choice: item.answerIndex } } };
}

test('a full assisted focused block records learning without manufacturing a cold pass', () => {
  const s = makeStore(memoryBackend());
  const r = run(); r.items.forEach((x) => { x.hints = 2; });
  s.finishPractice('bto', r);
  assert.equal(s.coverage('bto', family).covered, true);
  assert.equal(s.coverage('bto', family).completedBlocks, 1);
  assert.equal(s.coverage('bto', family).lastBlock.correct, 8);
  assert.equal(s.coverage('bto', family).source, 'completed learning block');
  assert.deepEqual(s.recognition(), {}); assert.deepEqual(s.mastery(), {});
  assert.equal(s.xpTotal(), 0, 'finishing cannot award the same answer XP again');
});

test('learning does not have an accuracy gate; incorrect answers still need independent mixed verification', () => {
  const r = run(); r.items.forEach((x) => { x.correct = false; x.score = -1; });
  const s = makeStore(memoryBackend()); s.finishPractice('bto', r);
  assert.equal(s.coverage('bto', family).covered, true);
  assert.equal(s.coverage('bto', family).lastBlock.correct, 0);
  assert.deepEqual(s.recognition(), {});
});

test('a block containing skips records completion but does not tick learning coverage', () => {
  const r = run(); r.items[0] = { ...r.items[0], skipped: true, score: 0 };
  const s = makeStore(memoryBackend()); s.finishPractice('bto', r);
  assert.equal(s.coverage('bto', family).completedBlocks, 1);
  assert.equal(s.coverage('bto', family).covered, false);
  assert.equal(s.coverage('bto', family).lastBlock.skipped, 1);
});

test('partial, mixed, drill and inconsistent runs cannot count as a completed learning block', () => {
  for (const r of [run({ completed: false }), run({ max: 9 }), run({ plannedCount: 20 }), run({ mode: 'drill' }),
    run({ family: null, scope: 'all' }), run({ items: run().items.slice(1) }), run({ items: [null, ...run().items.slice(1)] })])
    assert.equal(learningBlock(r, 1000), null);
});

test('the final submitted answer atomically saves completion before Finish or navigation', () => {
  const backend = memoryBackend(), s = makeStore(backend), snap = snapshot();
  s.recordAnswer('bto', family, { correct: true, ms: 2000, difficulty: 1, practiceSnapshot: snap });
  assert.equal(s.coverage('bto', family).covered, true);
  assert.equal(s.coverage('bto', family).completedBlocks, 1);
  const copy = makeStore(backend);
  assert.equal(copy.coverage('bto', family).completedBlocks, 1);
  assert.equal(copy.practiceSession('bto').current.done, true);
  assert.deepEqual(copy.recognition(), {});
});

test('feedback reload, Finish and duplicate finish cannot duplicate blocks, XP, answers or history', () => {
  const backend = memoryBackend(); let s = makeStore(backend); const snap = snapshot();
  const answer = { correct: true, ms: 2000, difficulty: 1, practiceSnapshot: snap };
  s.recordAnswer('bto', family, answer); const xp = s.xpTotal(), stats = structuredClone(s.stats());
  s = makeStore(backend); assert.equal(s.recordAnswer('bto', family, answer), false);
  s.finishPractice('bto', run()); s.finishPractice('bto', run());
  assert.equal(s.coverage('bto', family).completedBlocks, 1);
  assert.equal(s.runs('bto', 'practice').length, 1);
  assert.equal(s.xpTotal(), xp); assert.deepEqual(s.stats(), stats);
});

test('a genuinely new block adds one completion and preserves a manual repair decision until then', () => {
  const s = makeStore(memoryBackend()); s.finishPractice('bto', run()); s.markCovered('bto', family, false);
  assert.equal(s.coverage('bto', family).covered, false); assert.equal(s.coverage('bto', family).completedBlocks, 1);
  s.finishPractice('bto', run({ blockId: 'focused-2' }));
  assert.equal(s.coverage('bto', family).covered, true); assert.equal(s.coverage('bto', family).completedBlocks, 2);
});

test('previous completed homogeneous learning runs recover without changing XP, habit, answers or old checkpoints', () => {
  const old = blankV2(); delete old.learningCompletionVersion;
  const r = run(); delete r.family; delete r.blockId;
  old.runs = [r]; old.learningCoverage[key] = { attempts: 10, at: 1000 };
  old.activity.days['2026-11-14'] = { xp: 16, ms: 840000 };
  old.stats[key] = { n: 10, correct: 8, ms: 840000 }; old.mastery[key] = { lv: 2 };
  const { state } = migrate(old); assert.equal(state.learningCoverage[key].completedBlocks, 1);
  assert.equal(state.learningCoverage[key].covered, true);
  for (const k of ['runs', 'activity', 'stats', 'mastery', 'recognition', 'srs']) assert.deepEqual(state[k], old[k], k);
  assert.deepEqual(migrate(state).state, state, 'migration is idempotent');
});

test('aggregate answers, XP and minutes are insufficient to invent a finished block', () => {
  const old = blankV2(); delete old.learningCompletionVersion;
  old.learningCoverage[key] = { attempts: 10 }; old.stats[key] = { n: 10, correct: 8 };
  old.activity.days['2026-11-14'] = { xp: 16, ms: 840000 };
  const backend = memoryBackend(); backend.setItem(KEY, JSON.stringify(old));
  const s = makeStore(backend); assert.equal(s.coverage('bto', family).completedBlocks, 0);
  assert.equal(s.coverage('bto', family).learningAttempts, 10); assert.equal(s.coverage('bto', family).covered, false);
});

test('legacy mixed or malformed run history cannot fabricate focused completion', () => {
  for (const r of [run({ family: null, scope: 'all' }), run({ family: null, items: [{}, ...run().items.slice(1)] }),
    run({ family: null, completed: false })]) {
    const old = blankV2(); delete old.learningCompletionVersion; old.runs = [r]; old.learningCoverage[key] = { attempts: 10 };
    assert.equal(migrate(old).state.learningCoverage[key].completedBlocks, undefined);
  }
});

test('a retained completed final-answer snapshot recovers once and remains resumable', () => {
  const old = blankV2(); delete old.learningCompletionVersion; old.activePractice.bto = snapshot();
  old.learningCoverage[key] = { attempts: 10 };
  const backend = memoryBackend(); backend.setItem(KEY, JSON.stringify(old)); const s = makeStore(backend);
  assert.equal(s.coverage('bto', family).completedBlocks, 1); assert.ok(s.practiceSession('bto'));
  s.finishPractice('bto', run()); assert.equal(s.coverage('bto', family).completedBlocks, 1);
});

test('legacy completion recovery preserves a deliberate mark-for-learning choice', () => {
  const old = blankV2(); delete old.learningCompletionVersion;
  old.runs = [run()]; old.learningCoverage[key] = { attempts: 10, covered: false };
  const { state } = migrate(old);
  assert.equal(state.learningCoverage[key].covered, false); assert.equal(state.learningCoverage[key].completedBlocks, 1);
});

test('completion survives export/import and manual coverage remains independent from block counts', () => {
  const s = makeStore(memoryBackend()); s.finishPractice('bto', run()); s.markCovered('bto', 'die-repeats');
  const copy = makeStore(memoryBackend()); copy.importJSON(s.exportJSON());
  assert.equal(copy.coverage('bto', family).completedBlocks, 1); assert.equal(copy.coverage('bto', 'die-repeats').covered, true);
  assert.equal(copy.coverage('bto', 'die-repeats').completedBlocks, 0); assert.deepEqual(copy.recognition(), {});
});

test('malformed completion imports are rejected without damaging the current record', () => {
  const s = makeStore(memoryBackend()); s.finishPractice('bto', run()); const before = s.exportJSON();
  for (const patch of [{ completedBlocks: -1 }, { completedBlocks: 1.2 }, { attempts: '10' }, { completedAt: 'yesterday' },
    { blockIds: ['same', 'same'] }, { blockIds: [3] }, { revisionAttempts: -1 }, { lastBlock: { id: 'x', at: 1, questions: 10, correct: 20, skipped: 0 } }]) {
    const raw = JSON.parse(before); Object.assign(raw.learningCoverage[key], patch);
    assert.throws(() => s.importJSON(JSON.stringify(raw))); assert.equal(s.exportJSON(), before);
  }
});

test('completion helpers leave their source records unchanged', () => {
  const previous = { attempts: 10 }, r = run(), before = structuredClone(r);
  const block = learningBlock(r, 1000), next = addLearningBlock(previous, block);
  assert.deepEqual(previous, { attempts: 10 }); assert.deepEqual(r, before);
  assert.equal(addLearningBlock(next, block), next); assert.ok(snapshotLearningBlock(snapshot(), 1000));
});

test('previously seen mixed attempts retain revision evidence without changing a cold streak', () => {
  const s = makeStore(memoryBackend());
  s.recordAnswer('bto', family, { key: 'fresh-one', correct: true, mixed: true, fresh: true, ms: 2000, budgetMs: 90000, difficulty: 1, levels: [1, 2] });
  const before = structuredClone(s.recognition());
  s.recordAnswer('bto', family, { key: 'seen-before', correct: true, mixed: true, fresh: false, ms: 2000, budgetMs: 90000, difficulty: 1, levels: [1, 2] });
  assert.deepEqual(s.recognition(), before); assert.equal(s.coverage('bto', family).mixedAttempts, 2);
  assert.equal(s.coverage('bto', family).revisionAttempts, 1); assert.equal(s.coverage('bto', family).covered, false);
  const copy = makeStore(memoryBackend()); copy.importJSON(s.exportJSON());
  assert.equal(copy.coverage('bto', family).revisionAttempts, 1);
});

test('the small easy repeated-die pool is explicitly a limitation, not made fresh by shuffled answers', () => {
  const generator = SECTION_MODULES.bto.families.find((f) => f.id === 'die-repeats');
  const seen = new Set(Array.from({ length: 300 }, (_, i) => questionKey(generator.generate(makeRng(`finite-dice:${i}`), { difficulty: 1 }))));
  assert.equal(seen.size, 4, 'only all-same/all-different for two or three throws; no invented variation');
});

test('completion survives old-history compaction even when question details are trimmed', () => {
  const s = makeStore(memoryBackend()); s.finishPractice('bto', run());
  compact(s.state, Date.now() + 100 * 86400e3);
  assert.equal(s.runs('bto', 'practice')[0].items, undefined);
  const copy = makeStore(memoryBackend()); copy.importJSON(s.exportJSON());
  assert.equal(copy.coverage('bto', family).completedBlocks, 1); assert.equal(copy.coverage('bto', family).covered, true);
});
