import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transferItems, presentation, transferSummary } from '../../src/transfer/draw.js';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { structureKey } from '../../src/transfer/profile.js';
import { questionKey } from '../../src/core/questions.js';
import { validateItem } from '../../src/core/contract.js';
import { makeRng } from '../../src/core/rng.js';
import { makeStore, memoryBackend } from '../../src/core/store.js';
import { EXTRA_FAMILIES } from '../../src/transfer/index.js';
import { activePreset, activatePreset } from '../../config/presets.js';
test('fifteen mixed questions preserve preset and select distinct families per section', () => {
  activatePreset({ id: 'kickstarter' }); const preset = structuredClone(activePreset());
  const rows = transferItems(SECTION_MODULES, { seed: 'mix-contract' }); assert.equal(rows.length, 15);
  for (const section of ['bto', 'nl', 'll', 'iv', 'ob']) {
    const group = rows.filter((r) => r.item.section === section); assert.equal(group.length, 3); assert.equal(new Set(group.map((r) => r.item.family)).size, 3);
    for (const r of group) { assert.deepEqual(validateItem(r.item), []); assert.ok(r.newStructure && !r.repeat); }
  }
  for (const row of rows) { const f = [...SECTION_MODULES[row.item.section].families, ...EXTRA_FAMILIES].find((x) => x.id === row.item.family); assert.ok(f.verify(row.item, makeRng('verify-mixed')).ok, row.item.id); }
  assert.deepEqual(activePreset(), preset); assert.deepEqual(rows, transferItems(SECTION_MODULES, { seed: 'mix-contract' }));
});
test('cross-session selection avoids exact repetition and honestly reports familiar structures', () => {
  const store = makeStore(memoryBackend()), keys = new Set(); let repeats = 0, reused = 0;
  for (let s = 0; s < 8; s++) for (const row of transferItems(SECTION_MODULES, { seed: `cross-session:${s}`, questionHistory: store.state.recentQuestions, structureHistory: store.state.recentStructures })) {
    repeats += Number(keys.has(questionKey(row.item))); reused += Number(!row.newStructure); keys.add(questionKey(row.item)); store.rememberQuestion(row.item);
  }
  assert.equal(repeats, 0); assert.ok(reused > 0);
});
test('MCQ shuffling preserves answers and uses all five positions', () => {
  const f = EXTRA_FAMILIES[0], item = f.generate(makeRng('one-fixed-question'), { difficulty: 3 }), positions = new Set();
  for (let s = 0; s < 80; s++) { const next = presentation(item, makeRng(`order:${s}`)); positions.add(next.answerIndex); assert.ok(f.verify(next).ok); assert.equal(questionKey(next), questionKey(item)); assert.deepEqual([...next.options].sort((a, b) => a.value - b.value), item.options); }
  assert.equal(positions.size, 5);
});
test('branch signatures ignore numbers and wording while preserving important operation changes', () => {
  const a = { section: 'bto', family: 'example', difficulty: 2, params: { kind: 'exact', n: 3 }, prompt: { text: 'three' } }, b = { ...a, difficulty: 4, params: { kind: 'exact', n: 8 }, prompt: { text: 'eight' } };
  assert.equal(structureKey(a), structureKey(b)); assert.notEqual(structureKey(a), structureKey({ ...b, params: { kind: 'at-least', n: 8 } }));
  const table = { section: 'll', family: 'conjunction', params: { statements: ['A', 'AB', 'AorB'] } };
  assert.equal(structureKey(table), structureKey({ ...table, params: { statements: ['AB', 'AorB', 'A'] } }));
  assert.notEqual(structureKey(table), structureKey({ ...table, params: { statements: ['AB', 'BgA', 'A'] } }));
  const sequence = { section: 'nl', family: 'alternating-ops', params: { coeffs: { ops: [['add', 3], ['mul', 2]] } } };
  assert.notEqual(structureKey(sequence), structureKey({ ...sequence, params: { coeffs: { ops: [['mul', 2], ['add', 3]] } } }));
});
test('old progress imports intact and transfer results survive reload without changing ordinary progress', () => {
  const backend = memoryBackend(), store = makeStore(backend); store.setSetting('preset', { id: 'trader' });
  store.recordAnswer('bto', 'two-dice-sum', { correct: true, ms: 2000, difficulty: 2 }); store.recordRun({ section: 'bto', mode: 'exam', score: 15, max: 20 });
  const prior = JSON.parse(store.exportJSON()); delete prior.recentStructures; delete prior.transferRuns; assert.doesNotThrow(() => store.importJSON(JSON.stringify(prior)));
  const before = JSON.stringify([store.stats(), store.mastery(), store.srs, store.state.runs, store.settings(), store.xpTotal()]);
  const item = EXTRA_FAMILIES[0].generate(makeRng('history-persist'), { difficulty: 3 }); store.rememberQuestion(item); store.recordTransferRun({ timed: true, summary: transferSummary([]), items: [] });
  assert.equal(JSON.stringify([store.stats(), store.mastery(), store.srs, store.state.runs, store.settings(), store.xpTotal()]), before);
  const reloaded = makeStore(backend), copy = makeStore(memoryBackend()); assert.equal(reloaded.transferRuns().length, 1); assert.ok(reloaded.recentStructureKeys('bto').has(structureKey(item)));
  assert.doesNotThrow(() => copy.importJSON(reloaded.exportJSON())); assert.deepEqual({ ...copy.state, updatedAt: 0 }, { ...reloaded.state, updatedAt: 0 });
  const only = makeStore(memoryBackend()); only.recordTransferRun({ summary: transferSummary([]) }); assert.equal(only.isEmpty(), false);
});
test('summary separates intervals, new structures, familiar structures and review', () => {
  const s = transferSummary([{ section: 'bto', correct: true, score: 1, newStructure: true }, { section: 'nl', correct: false, score: -1, newStructure: false }, { section: 'iv', correct: true, score: .001, newStructure: true }, { section: 'll', correct: true, score: 1, repeat: true, newStructure: true }]);
  assert.equal(s.unseen.regularN, 2); assert.equal(s.newStructure.regularCorrect, 1); assert.equal(s.newStructure.intervalMean, .001); assert.equal(s.familiarStructure.regularN, 1); assert.equal(s.review.displayed, 1);
});
