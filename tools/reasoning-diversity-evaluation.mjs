// Reproducible comparison with the previous modified release, not upstream.
// These are exposure/branch diagnostics; they do not measure human learning or Optiver calibration.
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PRACTICE_MODULES } from '../src/practice/index.js';
import { SECTION_MODULES } from '../src/sections/index.js';
import { practiceItem, examItems } from '../src/core/draw.js';
import { makeRng } from '../src/core/rng.js';
import { questionKey } from '../src/core/questions.js';
import { structureKey } from '../src/transfer/profile.js';
import { SECTIONS } from '../config/sections.js';
import { transferItems } from '../src/transfer/draw.js';
import { presentation } from '../src/core/presentation.js';

const baseline = resolve(process.argv[2] || '../optprep-diversity-baseline');
const output = resolve(process.argv[3] || 'evaluation/reasoning-diversity-results.json');
const priorPractice = await import(pathToFileURL(`${baseline}/src/practice/index.js`));
const priorSections = await import(pathToFileURL(`${baseline}/src/sections/index.js`));
const priorDraw = await import(pathToFileURL(`${baseline}/src/core/draw.js`));
const priorQuestions = await import(pathToFileURL(`${baseline}/src/core/questions.js`));
const sections = ['bto', 'nl', 'll', 'iv', 'ob'];
const changed = new Set(['bto/die-repeats', 'bto/at-least-one', 'bto/conditional-dice', 'nl/multiply-index', 'nl/primes', 'iv/coupon', 'iv/waiting-time']);

function audit(modules) {
  const rows = [];
  for (const section of sections) for (const f of modules[section].families) {
    const levels = [];
    for (const difficulty of f.levels) {
      const exact = new Set(), structures = new Set(), positions = [], rawPositions = [];
      for (let seed = 0; seed < 512; seed++) {
        const item = f.generate(makeRng(`variation-audit:${section}:${f.id}:${difficulty}:${seed}`), { difficulty });
        exact.add(questionKey(item)); structures.add(structureKey(item));
        if (item.kind === 'mcq') {
          rawPositions[item.answerIndex] = (rawPositions[item.answerIndex] || 0) + 1;
          const shown = presentation(item, makeRng(`audit-presentation:${section}:${f.id}:${difficulty}:${seed}`));
          positions[shown.answerIndex] = (positions[shown.answerIndex] || 0) + 1;
        }
      }
      levels.push({ difficulty, samples: 512, visibleDistinct: exact.size, branchProxies: structures.size, branches: [...structures].sort(),
        answerPositionsAfterPresentation: Array.from(positions, (n) => n || 0), rawGeneratorAnswerPositions: Array.from(rawPositions, (n) => n || 0) });
    }
    rows.push({ section, family: f.id, changed: changed.has(`${section}/${f.id}`), levels });
  }
  return rows;
}

function sessions(practiceModules, sectionsModules, draw, keyOf, strict) {
  const result = { learning: 0, mixedQuestions: 0, mixedRepeats: 0, mockPapers: 0, mockQuestions: 0, mockRepeats: 0,
    mixedStops: [], mockStops: [], withinPaperRepeats: 0, perSection: {}, mockAnswerPositions: {} };
  const started = performance.now();
  for (const section of sections) {
    const history = new Set(), visible = new Set(), structures = new Set(), module = practiceModules[section];
    const targets = Object.fromEntries(module.families.map((f) => [f.id, f.levels[0]])), successes = {};
    const totals = { learning: 0, mixedQuestions: 0, mixedRepeats: 0, mockQuestions: 0, mockRepeats: 0 };
    const remember = (item) => { history.add(keyOf(item)); visible.add(questionKey(item)); structures.add(structureKey(item)); };
    // Guided exposure first; intentionally uses the real focused sampler, including legitimate finite revision.
    for (const f of module.families) {
      const rng = makeRng(`diversity-learning:${section}:${f.id}`);
      for (let index = 0; index < 10; index++) {
        remember(draw.practiceItem(module, rng, {}, { family: f.id, difficulty: f.levels[0], excludeKeys: history, preferStructures: structures }));
        result.learning++; totals.learning++;
      }
    }
    // Synthetic correct paced answers advance targets after three draws of that skill.
    // This is a sampler stress test, not a claim about a human learner's mastery.
    for (let block = 0; block < 30; block++) {
      const rng = makeRng(`diversity-mixed:${section}:${block}`), round = new Set();
      for (let index = 0; index < 10; index++) {
        let item;
        try { item = draw.practiceItem(module, rng, {}, { targets, excludeKeys: history, preferStructures: structures,
          avoidFamilies: [...round], shuffleOptions: true, requireFresh: strict, minFreshFamilies: 2 }); }
        catch (error) { if (error.name !== 'FreshQuestionsUnavailable') throw error; result.mixedStops.push({ section, block, index, reason: error.name }); break; }
        const repeated = visible.has(questionKey(item));
        result.mixedQuestions++; totals.mixedQuestions++; result.mixedRepeats += Number(repeated); totals.mixedRepeats += Number(repeated);
        if (strict) assert.equal(repeated, false, `${section}/mixed/${block}/${index}`);
        remember(item); round.add(item.family); if (round.size === module.families.length) round.clear();
        successes[item.family] = (successes[item.family] || 0) + 1;
        if (successes[item.family] % 3 === 0) {
          const f = module.families.find((f) => f.id === item.family), position = f.levels.indexOf(targets[f.id]);
          targets[f.id] = f.levels[Math.min(position + 1, f.levels.length - 1)];
        }
      }
    }
    // These mocks share the preceding learning/mixed history and all previous mock exposures.
    for (let paper = 0; paper < 30; paper++) {
      let items;
      try { items = draw.examItems(sectionsModules[section], { count: SECTIONS[section].exam.count, ramp: section === 'nl', bankRatio: 0.2, excludeKeys: history }, `diversity-mock:${section}:${paper}`); }
      catch (error) { if (error.name !== 'FreshQuestionsUnavailable') throw error; result.mockStops.push({ section, paper, reason: error.name }); continue; }
      assert.equal(items.length, SECTIONS[section].exam.count);
      result.mockPapers++; const inPaper = new Set();
      for (const item of items) {
        const key = questionKey(item), repeated = visible.has(key);
        result.withinPaperRepeats += Number(inPaper.has(key)); inPaper.add(key);
        result.mockQuestions++; totals.mockQuestions++; result.mockRepeats += Number(repeated); totals.mockRepeats += Number(repeated);
        if (item.kind === 'mcq') {
          const counts = result.mockAnswerPositions[`${section}/${item.options.length} options`] ||= Array(item.options.length).fill(0);
          counts[item.answerIndex]++;
        }
        if (strict) assert.equal(repeated, false, `${section}/mock/${paper}`);
        remember(item);
      }
    }
    result.perSection[section] = totals;
  }
  result.elapsedMs = Math.round(performance.now() - started); return result;
}

const before = audit(priorPractice.PRACTICE_MODULES), after = audit(PRACTICE_MODULES);
const beforeSessions = sessions(priorPractice.PRACTICE_MODULES, priorSections.SECTION_MODULES, priorDraw, priorQuestions.questionKey, false);
const afterSessions = sessions(PRACTICE_MODULES, SECTION_MODULES, { practiceItem, examItems }, questionKey, true);
assert.deepEqual(afterSessions.mixedStops, []); assert.deepEqual(afterSessions.mockStops, []);
assert.equal(afterSessions.mixedQuestions, 1500); assert.equal(afterSessions.mockQuestions, 2970);
const batchHistory = {}, batchStructures = {}; let batchQuestions = 0, batchRepeats = 0;
for (const section of sections) for (let block = 0; block < 20; block++) {
  const rows = transferItems(SECTION_MODULES, { seed: `fresh-batch:${section}:${block}`, sections: [section], perSection: 10,
    questionHistory: batchHistory, structureHistory: batchStructures });
  for (const row of rows) {
    const history = batchHistory[section] ||= new Set(), structures = batchStructures[section] ||= new Set();
    batchRepeats += Number(history.has(questionKey(row.item))); history.add(questionKey(row.item)); structures.add(row.structure); batchQuestions++;
  }
}
assert.equal(batchRepeats, 0);
const report = { baselineRevision: 'd72f034086496d0e6c09dcb364ee2fa1ea40c6b1', samplesPerFamilyLevel: 512,
  warning: 'Visible distinct counts are sampled, not domain sizes. Branch signatures are proxies, not measured conceptual novelty or learning transfer. Orderbook card order is canonicalized in both audits.',
  before, after, sessions: { before: beforeSessions, after: afterSessions }, batch: { questions: batchQuestions, repeats: batchRepeats },
  limitations: ['History is local and bounded to 8,000 keys per assessment in the app.', 'Most family searches are bounded, not exhaustive.',
    'Repeated mathematical structures with different inputs are allowed and expected.', 'No empirical Optiver difficulty or human transfer study was performed.'] };
mkdirSync(resolve(output, '..'), { recursive: true }); writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ report: output, families: after.length, changed: after.filter((r) => r.changed).length, sessions: report.sessions, batch: report.batch }, null, 2));
