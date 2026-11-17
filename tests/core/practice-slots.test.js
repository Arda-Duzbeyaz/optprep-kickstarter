import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeStore, memoryBackend, KEY } from '../../src/core/store.js';
import { blankV2 } from '../../src/core/migrate.js';
import { practiceSlot, validPractice, practiceHref } from '../../src/core/practice.js';
import { PRACTICE_MODULES } from '../../src/practice/index.js';
import { makeRng } from '../../src/core/rng.js';

function snapshot(section, familyIndex = 0, scope = 'all', mixed = false) {
  const f = PRACTICE_MODULES[section].families[familyIndex];
  const item = f.generate(makeRng(`slot:${section}:${familyIndex}:${scope}`), { difficulty: f.levels[0] });
  return { version: 1, section, family: mixed ? null : f.id, scope, seed: `slot:${section}:${familyIndex}:${scope}:${mixed}`,
    rngState: 42, index: 0, count: 10, log: [], xp0: 0, lv0: {}, savedAt: 10 + familyIndex,
    current: { item, hints: 0, fresh: true, budgetMs: 90000, elapsedMs: 1200, done: false, response: null, draft: null } };
}
const read = (store, s) => store.practiceSession(s.section, s.family, s.scope);
const allSnapshots = () => ['bto', 'nl', 'll', 'iv', 'ob', 'mm'].flatMap(section =>
  [snapshot(section, 0), snapshot(section, 1), snapshot(section, 0, 'all', true), snapshot(section, 0, 'covered', true)]);

test('every section holds two topic blocks and both mixed pools independently across reload/export/import', () => {
  const backend = memoryBackend(), store = makeStore(backend), snapshots = allSnapshots();
  for (const s of snapshots) { assert.ok(validPractice(s)); store.savePractice(s); }
  assert.equal(store.practiceSessions().length, 24);
  const loaded = makeStore(backend), copy = makeStore(memoryBackend()); copy.importJSON(loaded.exportJSON());
  for (const s of snapshots) { assert.deepEqual(read(loaded, s), s); assert.deepEqual(read(copy, s), s); }
  const detached = loaded.practiceSessions(); detached[0].current.item.prompt.text = 'changed copy';
  assert.notEqual(loaded.practiceSessions()[0].current.item.prompt.text, 'changed copy');
});

test('old one-slot saves resume in their actual context and move safely only when that context is saved', () => {
  for (const old of [snapshot('bto'), snapshot('bto', 0, 'all', true), snapshot('bto', 0, 'covered', true)]) {
    const backend = memoryBackend(), initial = blankV2(); initial.activePractice.bto = old;
    initial.settings = { preset: { id: 'kickstarter' } }; initial.stats = { 'bto:old': { n: 7, correct: 5 } };
    initial.recognition = { 'bto:old': { target: 1, run: 2, keys: ['x','y'], streakKeys: ['x','y'] } };
    initial.activity.xpBase = 37; initial.unknown = { keep: true };
    backend.setItem(KEY, JSON.stringify(initial)); const store = makeStore(backend);
    assert.deepEqual(read(store, old), old); assert.equal(store.practiceSession('bto', 'nonexistent'), null);
    const other = snapshot('bto', 1); store.savePractice(other);
    assert.deepEqual(read(store, old), old); assert.deepEqual(read(store, other), other);
    store.savePractice(old); assert.equal(store.state.activePractice.bto, undefined);
    const restored = makeStore(backend); assert.deepEqual(read(restored, old), old); assert.deepEqual(read(restored, other), other);
    for (const key of ['settings','stats','recognition','activity','unknown']) assert.deepEqual(restored.state[key], initial[key]);
  }
});

test('clearing and finishing affect only the selected topic or selected mixed pool', () => {
  const store = makeStore(memoryBackend()), snapshots = allSnapshots(); snapshots.forEach(s => store.savePractice(s));
  const selected = snapshots[0]; store.clearPractice(selected.section, selected.family);
  assert.equal(read(store, selected), null);
  const mixed = snapshots[3]; store.finishPractice(mixed.section, { family: null, scope: mixed.scope, blockId: mixed.seed, mode: 'practice', max: 0 });
  assert.equal(read(store, mixed), null);
  for (const s of snapshots.filter(s => s !== selected && s !== mixed)) assert.deepEqual(read(store, s), s);
});

test('a stale finish cannot delete a newer same-context block; numeric legacy seeds finish correctly', () => {
  const store = makeStore(memoryBackend()), s = snapshot('bto'); store.savePractice(s);
  store.finishPractice('bto', { family: s.family, blockId: 'older-block', mode: 'practice', max: 0 });
  assert.deepEqual(read(store, s), s);
  s.seed = 123; store.savePractice(s);
  store.finishPractice('bto', { family: s.family, blockId: '123', mode: 'practice', max: 0 });
  assert.equal(read(store, s), null);
});

test('answered-phase deduplication remains atomic after switching to another topic', () => {
  const backend = memoryBackend(), store = makeStore(backend), a = snapshot('bto'), b = snapshot('bto', 1);
  a.current.done = true; a.current.elapsedMs = 2000; a.current.response = a.current.draft = { choice: a.current.item.answerIndex };
  a.log.push({ family: a.family, correct: true, score: 1, ms: 2000, hints: 0 });
  const event = { correct: true, ms: 2000, practiceSnapshot: a };
  assert.equal(store.recordAnswer('bto', a.family, event), true); store.savePractice(b);
  const loaded = makeStore(backend), before = loaded.exportJSON();
  assert.equal(loaded.recordAnswer('bto', a.family, event), false); assert.equal(loaded.exportJSON(), before);
  assert.deepEqual(read(loaded, b), b); assert.equal(loaded.stats()[`bto:${a.family}`].n, 1);
});

test('miskeyed or unreadable snapshots cannot resume another context and retain independent valid blocks', () => {
  const store = makeStore(memoryBackend()), a = snapshot('bto'), b = snapshot('bto', 1);
  store.savePractice(b); store.state.activePractice[practiceSlot('bto', a.family)] = b;
  assert.equal(read(store, a), null); assert.deepEqual(read(store, b), b);
  store.state.activePractice[practiceSlot('bto', a.family)] = { version: 999 };
  store.clearPractice('bto', a.family); assert.deepEqual(read(store, b), b);
  assert.deepEqual(store.practiceSessions(), [b]);
  assert.equal(practiceHref({ section: 'bto', family: null, scope: 'covered' }), '#/run/bto/mixed/covered');
});
