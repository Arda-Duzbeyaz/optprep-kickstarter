// Recheck prior unseen-only assessment modes after changing the family catalogues.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { PRACTICE_MODULES } from '../src/practice/index.js';
import { SECTION_MODULES } from '../src/sections/index.js';
import { practiceItem, examItems } from '../src/core/draw.js';
import { questionKey } from '../src/core/questions.js';
import { structureKey } from '../src/transfer/profile.js';
import { makeRng } from '../src/core/rng.js';
import { recognitionStep, recognitionProgress } from '../src/core/recognition.js';
import { transferItems } from '../src/transfer/draw.js';
import { SECTIONS } from '../config/sections.js';
import { activatePreset } from '../config/presets.js';
activatePreset({ id: 'kickstarter' });
const report = { guided: 0, mixed: 0, mockPapers: 0, mockQuestions: 0, batchQuestions: 0, repeatedQuestions: 0, sectionCounts: {} };
const allHistory = {}, allStructures = {};
for (const sectionId of ['bto', 'nl', 'll', 'iv', 'ob']) {
  const section = PRACTICE_MODULES[sectionId], history = allHistory[sectionId] = new Set(), structures = allStructures[sectionId] = new Set(), recognition = {};
  const remember = (item) => { assert.equal(history.has(questionKey(item)), false, `${sectionId}/${item.family}: repeated question`); history.add(questionKey(item)); structures.add(structureKey(item)); };
  for (const f of section.families) {
    const rng = makeRng(`regression-learning:${sectionId}:${f.id}`);
    for (let i = 0; i < 10; i++) { remember(practiceItem(section, rng, {}, { family: f.id, difficulty: f.levels[0], requireFresh: true, excludeKeys: history, preferStructures: structures })); report.guided++; }
  }
  for (let block = 0; block < 20; block++) {
    const rng = makeRng(`regression-mixed:${sectionId}:${block}`), round = new Set();
    for (let i = 0; i < 10; i++) {
      const targets = Object.fromEntries(section.families.map((f) => [f.id, recognitionProgress(recognition[f.id], f.levels).target]));
      const item = practiceItem(section, rng, {}, { familyPool: section.families.map((f) => f.id), targets, requireFresh: true, minFreshFamilies: 2,
        excludeKeys: history, preferStructures: structures, avoidFamilies: [...round], shuffleOptions: true });
      remember(item); report.mixed++; round.add(item.family); if (round.size === section.families.length) round.clear();
      const f = section.families.find((f) => f.id === item.family);
      recognition[f.id] = recognitionStep(recognition[f.id], { key: questionKey(item), difficulty: item.difficulty, levels: f.levels, correct: true, ms: 1000, budgetMs: 90000 });
    }
  }
  for (let paper = 0; paper < 30; paper++) {
    const items = examItems(SECTION_MODULES[sectionId], { count: SECTIONS[sectionId].exam.count, ramp: sectionId === 'nl', bankRatio: 0.2, excludeKeys: history }, `regression-mock:${sectionId}:${paper}`);
    assert.equal(items.length, SECTIONS[sectionId].exam.count); report.mockPapers++;
    for (const item of items) { remember(item); report.mockQuestions++; }
  }
  for (let batch = 0; batch < 10; batch++) {
    const rows = transferItems(SECTION_MODULES, { seed: `regression-batch:${sectionId}:${batch}`, sections: [sectionId], perSection: 10, questionHistory: allHistory, structureHistory: allStructures });
    for (const row of rows) { remember(row.item); report.batchQuestions++; }
  }
  report.sectionCounts[sectionId] = history.size;
}
assert.equal(report.guided, 1030); assert.equal(report.mixed, 1000); assert.equal(report.mockQuestions, 2970); assert.equal(report.batchQuestions, 500);
writeFileSync(new URL('../evaluation/focused-assessment-regression.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
