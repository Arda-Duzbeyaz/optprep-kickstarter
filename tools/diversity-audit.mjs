// Diagnostic proxies, not estimates of Optiver difficulty or measured learning transfer.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeRng } from '../src/core/rng.js';
import { questionKey } from '../src/core/questions.js';
import { examItems } from '../src/core/draw.js';
import { SECTION_MODULES } from '../src/sections/index.js';
import { EXTRA_FAMILIES } from '../src/transfer/index.js';
import { structureKey } from '../src/transfer/profile.js';
import { transferItems, TRANSFER_SECTIONS } from '../src/transfer/draw.js';
const baseline = process.argv[2], out = resolve(process.argv[3] || 'evaluation');
mkdirSync(out, { recursive: true });
const increment = (map, key) => { map[key] = (map[key] || 0) + 1; };
const familyRows = [];
for (const section of TRANSFER_SECTIONS) for (const f of SECTION_MODULES[section].families) {
  const exact = new Set(), structures = new Set(), positions = {};
  for (let s = 0; s < 80; s++) {
    const it = f.generate(makeRng(`concept-audit:${section}:${f.id}:${s}`), { difficulty: f.levels[s % f.levels.length] });
    exact.add(questionKey(it)); structures.add(structureKey(it));
    if (it.kind === 'mcq') increment(positions, it.answerIndex);
    if (it.kind === 'rank') increment(positions, it.answerOrder.join(','));
  }
  familyRows.push({ section, family: f.id, levels: f.levels, samples: 80, exactDistinct: exact.size, recordedBranchSignatures: structures.size, branches: [...structures], answerPositions: positions,
    warning: 'Conservative parameter-branch proxies, not conceptual difficulty measurements.' });
}
const added = [];
for (const f of EXTRA_FAMILIES) {
  const structures = new Set(), operations = new Set(), exact = new Set(), positions = {}; let checked = 0;
  for (const difficulty of f.levels) for (let s = 0; s < 1000; s++) {
    const seed = `quality:${f.id}:${difficulty}:${s}`, it = f.generate(makeRng(seed), { difficulty }), result = f.verify(it, makeRng(`check:${seed}`));
    assert.ok(result.ok, `${seed}: ${result.detail}`); checked++;
    structures.add(structureKey(it)); exact.add(questionKey(it)); it.transfer.operations.forEach((op) => operations.add(op));
    if (it.kind === 'rank') increment(positions, it.answerOrder.join(','));
  }
  added.push({ family: f.id, checked, exactDistinct: exact.size, authoredStructures: [...structures].sort(), operations: [...operations].sort(), rankAnswerOrders: positions });
}
const history = {}, structureHistory = {}, exact = new Set();
const transfer = { sessions: 10, questions: 0, exactRepeats: 0, newRecordedStructures: 0, familiarRecordedStructures: 0, familyCounts: {}, mcqPositions: {}, rankOrders: {}, maxSameSectionStreak: 0 };
for (let s = 0; s < transfer.sessions; s++) {
  const rows = transferItems(SECTION_MODULES, { seed: `quality-transfer:${s}`, questionHistory: history, structureHistory }); let last = null, streak = 0;
  for (const r of rows) {
    transfer.questions++; transfer.exactRepeats += Number(exact.has(r.key)); exact.add(r.key);
    transfer.newRecordedStructures += Number(r.newStructure); transfer.familiarRecordedStructures += Number(!r.newStructure);
    increment(transfer.familyCounts, `${r.item.section}/${r.item.family}`);
    if (r.item.kind === 'mcq') increment(transfer.mcqPositions, r.item.answerIndex);
    if (r.item.kind === 'rank') increment(transfer.rankOrders, r.item.answerOrder.join(','));
    (history[r.item.section] ||= []).push(r.key); (structureHistory[r.item.section] ||= []).push(r.structure);
    streak = last === r.item.section ? streak + 1 : 1; last = r.item.section; transfer.maxSameSectionStreak = Math.max(transfer.maxSameSectionStreak, streak);
  }
}
let comparison = null;
if (baseline) {
  const load = (p) => import(pathToFileURL(resolve(baseline, p)).href);
  const [{ SECTION_MODULES: previous }, { examItems: oldDraw }] = await Promise.all([load('src/sections/index.js'), load('src/core/draw.js')]);
  comparison = []; const counts = { bto: 20, nl: 26, ll: 15, iv: 18, ob: 20 };
  for (const section of TRANSFER_SECTIONS) {
    const seen = new Set(), structures = new Set(); let repeats = 0, branchRepeats = 0;
    for (let s = 0; s < 10; s++) {
      const cfg = { count: counts[section], ramp: section === 'nl', bankRatio: .2, excludeKeys: [...seen] };
      const current = examItems(SECTION_MODULES[section], cfg, `same-mock:${s}`), old = oldDraw(previous[section], cfg, `same-mock:${s}`);
      assert.deepEqual(current, old, `${section}: ordinary mock changed at seed ${s}`);
      for (const it of current) { const k = questionKey(it), st = structureKey(it); repeats += Number(seen.has(k)); branchRepeats += Number(structures.has(st)); seen.add(k); structures.add(st); }
    }
    comparison.push({ section, questions: counts[section] * 10, identicalItemObjects: true, exactRepeats: repeats, repeatedBranchSignatures: branchRepeats, distinctBranchSignatures: structures.size });
  }
}
const result = { schemaVersion: 1, seedPolicy: 'Deterministic literal prefixes in tools/diversity-audit.mjs', meaning: 'Visible repetition and known branch/presentation diagnostics, not semantic novelty or real-test calibration.', existingFamilies: familyRows, addedFamilies: added, transferSample: transfer, previousVersionMocks: comparison };
writeFileSync(join(out, 'diversity-results.json'), JSON.stringify(result, null, 2));
writeFileSync(join(out, 'GENERATOR_INVENTORY.md'), ['# Generator branch inventory', '', '80 deterministic samples per existing family. Branch signatures ignore numbers and wording; counts are conservative proxies, not conceptual or difficulty scores.', '', '| Section | Family | Levels | Distinct questions | Branch signatures |', '|---|---|---|---:|---:|', ...familyRows.map((r) => `| ${r.section} | ${r.family} | ${r.levels.join(', ')} | ${r.exactDistinct}/80 | ${r.recordedBranchSignatures} |`), '', 'Raw branch tags, histograms and evaluations: diversity-results.json.', ''].join('\n'));
console.log(JSON.stringify({ existingFamilies: familyRows.length, newChecks: added.reduce((n, r) => n + r.checked, 0), newStructureCounts: Object.fromEntries(added.map((r) => [r.family, r.authoredStructures.length])), transferSample: transfer, previousVersionMocks: comparison }, null, 2));
