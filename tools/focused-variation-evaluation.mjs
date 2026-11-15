// Per-skill/difficulty comparison with the delivered 1.3.0 archive.
// Counts question availability and selection correctness, not human learning transfer.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { PRACTICE_MODULES } from '../src/practice/index.js';
import { practiceItem } from '../src/core/draw.js';
import { finiteVariants } from '../src/practice/finite-variants.js';
import { questionKey } from '../src/core/questions.js';
import { structureKey } from '../src/transfer/profile.js';
import { makeRng } from '../src/core/rng.js';
const baseline = resolve(process.argv[2] || '../focused-baseline');
const prior = await import(pathToFileURL(`${baseline}/src/practice/index.js`));
const priorDraw = await import(pathToFileURL(`${baseline}/src/core/draw.js`));
const priorFinite = await import(pathToFileURL(`${baseline}/src/practice/finite-variants.js`));
const root = resolve(new URL('..', import.meta.url).pathname);
const rows = [], SEEDS = 20;
let beforeRepeats = 0, afterRepeats = 0, testedQuestions = 0, lifetimeQuestions = 0, lifetimeStops = 0, lifetimeRepeats = 0;
function distinct(f, difficulty) {
  const keys = new Set();
  for (let seed = 0; seed < 512; seed++) keys.add(questionKey(f.generate(makeRng(`focused-range:${f.section}:${f.id}:${difficulty}:${seed}`), { difficulty })));
  return keys.size;
}
function firstBlocks(section, f, difficulty, draw, fresh) {
  let repeats = 0, questions = 0;
  for (let seed = 0; seed < SEEDS; seed++) {
    const history = new Set(), structures = new Set(), rng = makeRng(`focused-block:${section.id}:${f.id}:${difficulty}:${seed}`);
    for (let index = 0; index < 10; index++) {
      const item = draw(section, rng, {}, { family: f.id, difficulty, requireFresh: fresh, excludeKeys: history, preferStructures: structures, shuffleOptions: true });
      repeats += Number(history.has(questionKey(item))); questions++;
      assert.equal(item.family, f.id); assert.equal(item.difficulty, difficulty);
      history.add(questionKey(item)); structures.add(structureKey(item));
    }
  }
  return { questions, repeats };
}
for (const [sectionId, section] of Object.entries(PRACTICE_MODULES)) for (const f of section.families) for (const difficulty of f.levels) {
  const oldSection = prior.PRACTICE_MODULES[sectionId], old = oldSection.families.find((candidate) => candidate.id === f.id);
  const before = firstBlocks(oldSection, old, difficulty, priorDraw.practiceItem, false);
  const after = firstBlocks(section, f, difficulty, practiceItem, true);
  assert.equal(after.repeats, 0);
  const variants = finiteVariants(f, difficulty), oldVariants = priorFinite.finiteVariants(old, difficulty);
  beforeRepeats += before.repeats; afterRepeats += after.repeats; testedQuestions += after.questions;
  const history = new Set(), structures = new Set(), rng = makeRng(`across-blocks:${sectionId}:${f.id}:${difficulty}`);
  let drawn = 0, stop = null;
  for (let index = 0; index < 40; index++) {
    let item;
    try { item = practiceItem(section, rng, {}, { family: f.id, difficulty, requireFresh: true, excludeKeys: history, preferStructures: structures, shuffleOptions: true }); }
    catch (error) {
      if (error.name !== 'FreshQuestionsUnavailable') throw error;
      stop = { reason: error.catalogueExhausted ? 'complete-configured-pool-seen' : 'bounded-search-found-no-unseen-item', knownCapacity: error.catalogueSize };
      lifetimeStops++; break;
    }
    lifetimeRepeats += Number(history.has(questionKey(item))); assert.equal(history.has(questionKey(item)), false);
    history.add(questionKey(item)); structures.add(structureKey(item)); drawn++; lifetimeQuestions++;
  }
  rows.push({ section: sectionId, family: f.id, title: f.title, difficulty,
    beforeSampledDistinct: distinct(old, difficulty), afterSampledDistinct: distinct(f, difficulty), samples: 512,
    beforeKnownCapacity: oldVariants?.length ?? null, afterKnownCapacity: variants?.length ?? null,
    firstTen: { seeds: SEEDS, before, after }, acrossBlocks: { requested: 40, drawn, repeats: 0, stopped: stop } });
}
const sourceInputs = [];
for (const directory of ['src/sections', 'src/transfer']) for (const file of readdirSync(join(root, directory), { recursive: true }).map(String)) {
  if (!file.endsWith('.js') || !file.includes('families/')) continue;
  const path = `${directory}/${file}`, source = readFileSync(join(root, path), 'utf8');
  sourceInputs.push({ path, sha256: createHash('sha256').update(source).digest('hex'),
    randomInputDefinitions: source.split('\n').flatMap((line, index) => /rng\.(int|pick|chance|float|normal)|params:|levels:|show:/.test(line) ? [{ line: index + 1, text: line.trim() }] : []) });
}
const report = { baselineEdition: '1.3.0-kickstarter.1', baselineArchiveSha256: '176ea2b8d00d5f1e40c02c610cfa3f47ac7eabdfa1a7779508920b9d40fdd231',
  supportedFamilyLevels: rows.length, skills: new Set(rows.map((row) => `${row.section}/${row.family}`)).size,
  seedsPerFirstBlock: SEEDS, firstBlockQuestionsPerRelease: testedQuestions, firstBlockRepeats: { before: beforeRepeats, after: afterRepeats },
  acrossBlocks: { questions: lifetimeQuestions, repeats: lifetimeRepeats, stoppedPools: lifetimeStops }, rows, sourceInputs,
  limits: ['Finite capacities refer to configured generator inputs, not every conceivable question in mathematics.',
    '512-seed distinct counts are samples; null capacity means not completely enumerated.',
    'Unknown bounded searches stop without repeating and do not claim true exhaustion.',
    'Freshness is relative to retained browser history; structure/methods can repeat with new parameters.',
    'No empirical Optiver difficulty or human learning transfer calibration.'] };
writeFileSync(join(root, 'evaluation/focused-variation-results.json'), JSON.stringify(report, null, 2) + '\n');
const md = ['# Focused-learning inventory', '', '512 sampled generator draws per level; exact capacities only where completely enumerated. First-block tests use 20 seeds per skill/level. Numerical variation is not counted as conceptual novelty.', '',
  '| Assessment / skill | Difficulty | Sampled distinct before → after | Exact configured capacity after | Repeats in 20 first blocks before → after |', '|---|---:|---:|---:|---:|'];
for (const row of rows) md.push(`| ${row.section}/${row.family} | ${row.difficulty} | ${row.beforeSampledDistinct} → ${row.afterSampledDistinct} | ${row.afterKnownCapacity ?? 'not enumerated'} | ${row.firstTen.before.repeats} → ${row.firstTen.after.repeats} |`);
writeFileSync(join(root, 'evaluation/FOCUSED_VARIABILITY_INVENTORY.md'), md.join('\n') + '\n');
console.log(JSON.stringify({ skills: report.skills, familyLevels: rows.length, firstBlocks: report.firstBlockRepeats, questionsPerRelease: testedQuestions, acrossBlocks: report.acrossBlocks,
  poolsBelowTenAfter: rows.filter((r) => r.afterSampledDistinct < 10).map((r) => `${r.section}/${r.family}/${r.difficulty}`) }, null, 2));
