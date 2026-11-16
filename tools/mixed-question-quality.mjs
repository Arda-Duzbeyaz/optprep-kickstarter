// Reproducible presentation and verifier checks, not a difficulty calibration.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { PRACTICE_MODULES } from '../src/practice/index.js';
import { makeRng } from '../src/core/rng.js';
import { presentation } from '../src/core/presentation.js';
import { validateItem } from '../src/core/contract.js';
import { finiteVariants } from '../src/practice/finite-variants.js';
import { questionKey } from '../src/core/questions.js';
import { resolve } from 'node:path';
const report = { samplesPerLevel: 256, familyLevels: 0, items: 0, closestLabels: 0,
  probabilityOptions: 0, verifierChecks: 0, answerPositions: Array(5).fill(0),
  sortedAnswerRanks: Array(5).fill(0), perFamily: {}, errors: [],
  cataloguePools: 0, catalogueEntries: 0, reachabilitySeedsPerPool: 4096,
  limits: ['Position counts test presentation, not conceptual novelty or mathematical understanding.',
    'Sorted-answer magnitude biases in existing families remain possible; no distractor redesign is claimed.',
    'New-logic independent branch checks are in tests/sections/mixed-reasoning.test.js and tests/sections/bto-curriculum.test.js.'] };
function numericLabel(label) {
  const text = String(label).replaceAll(',', '').replace(/^≈\s*/, '').trim();
  if (/^[+-]?[\d.]+\/[\d.]+$/.test(text)) { const [a,b] = text.split('/').map(Number); return a/b; }
  return Number(text);
}
for (const family of PRACTICE_MODULES.bto.families) for (const difficulty of family.levels) {
  report.familyLevels++;
  const detail = report.perFamily[family.id] ||= { samples: 0, answerPositions: Array(5).fill(0), maximumAnswer: 0 };
  for (let seed=0; seed<report.samplesPerLevel; seed++) {
    const context = `${family.id}:${difficulty}:${seed}`;
    const raw = family.generate(makeRng(`audit-raw:${context}`), { difficulty });
    const item = presentation(raw, makeRng(`audit-present:${context}`)), truth = item.answer.value;
    assert.deepEqual(validateItem(item), [], context);
    report.items++; detail.samples++; report.answerPositions[item.answerIndex]++; detail.answerPositions[item.answerIndex]++;
    const rank = [...item.options].sort((a,b)=>a.value-b.value).findIndex((o)=>o.value===truth);
    assert.ok(rank >= 0, context); report.sortedAnswerRanks[rank]++;
    detail.maximumAnswer += Number(rank === item.options.length-1);
    const shown = item.options.map((o)=>numericLabel(o.label));
    if (shown.every(Number.isFinite)) {
      report.closestLabels++;
      const distances = shown.map((v)=>Math.abs(v-truth)), best = Math.min(...distances);
      const nearest = distances.flatMap((d,i)=>Math.abs(d-best)<1e-12*Math.max(1,Math.abs(truth))?[i]:[]);
      assert.deepEqual(nearest,[item.answerIndex],context);
    }
    if (/What is the probability|Estimate the probability/i.test(item.prompt.text)) {
      report.probabilityOptions++;
      assert.ok(item.options.every((o)=>o.value>=0&&o.value<=1),context);
    }
    if (seed<4) { assert.ok((await family.verify(item,makeRng(`audit-verify:${context}`))).ok,context); report.verifierChecks++; }
  }
}
for (const detail of Object.values(report.perFamily)) assert.ok(detail.answerPositions.every((n)=>n>0));
for (const section of Object.values(PRACTICE_MODULES)) for (const family of section.families) for (const difficulty of family.levels) {
  const variants = finiteVariants(family,difficulty); if (!variants) continue;
  report.cataloguePools++; report.catalogueEntries += variants.length;
  const keys = new Set(variants.map(questionKey)), reachable = new Set();
  assert.equal(keys.size,variants.length);
  for (const item of variants) {
    assert.deepEqual(validateItem(item),[]);
    assert.ok((await family.verify(item,makeRng(`catalogue-check:${questionKey(item)}`))).ok);
  }
  for (let seed=0;seed<Math.max(report.reachabilitySeedsPerPool,variants.length*64);seed++) {
    const item = family.generate(makeRng(`catalogue-reachable:${family.id}:${difficulty}:${seed}`),{difficulty});
    assert.ok(keys.has(questionKey(item))); reachable.add(questionKey(item));
  }
  assert.deepEqual(reachable,keys,`${family.id}/${difficulty}: complete catalogue and generated domain agree`);
}
report.reachabilityRule='max(4096, 64 × catalogue size) random draws per pool; exact generated-domain equality remains required';
writeFileSync(process.argv[2]?resolve(process.argv[2]):new URL('../evaluation/mixed-question-quality.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({items:report.items,levels:report.familyLevels,closestLabels:report.closestLabels,verifierChecks:report.verifierChecks,answerPositions:report.answerPositions,cataloguePools:report.cataloguePools,catalogueEntries:report.catalogueEntries,errors:0}));
