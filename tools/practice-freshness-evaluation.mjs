// Compare repeat avoidance with an earlier delivered release. Reference variants
// are independently sampled from the unchanged original generator, not the new catalogue.
// Usage: node tools/practice-freshness-evaluation.mjs /absolute/path/to/1.2.1
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
const previous = process.argv[2]; if (!previous) throw Error('Pass the earlier release directory');
const root = fileURLToPath(new URL('../', import.meta.url));
const load = (base, path) => import(pathToFileURL(join(base, path)).href);
const oldRoot = resolve(previous), versions = {};
for (const [name, dir] of [['before', oldRoot], ['after', root]]) versions[name] = {
  draw: await load(dir, 'src/core/draw.js'), modules: (await load(dir, 'src/practice/index.js')).PRACTICE_MODULES,
  sections: (await load(dir, 'src/sections/index.js')).SECTION_MODULES,
  rng: (await load(dir, 'src/core/rng.js')).makeRng,
};
const { questionKey } = await load(root, 'src/core/questions.js');
const { structureKey } = await load(root, 'src/transfer/profile.js');
const ids = ['bto', 'nl', 'll', 'iv', 'ob'];
const remember = (history, key) => { history.delete(key); history.add(key); };
const report = { before: JSON.parse(readFileSync(join(oldRoot, 'package.json'))).version,
  after: JSON.parse(readFileSync(join(root, 'package.json'))).version,
  method: '512 independently seeded reference prompts per family at its lowest supported difficulty; begin with up to 20 recorded reference prompts, then draw 20 times per family. A repeat is proven avoidable only when a witnessed same-family/same-difficulty reference prompt remains unseen.',
  familySweep: {}, lastUnseenDice: {}, preservation: {} };

const references = new Map();
for (const id of ids) for (const f of versions.after.modules[id].families) {
  const keys = new Set();
  for (let seed = 0; seed < 512; seed++) keys.add(questionKey(f.generate(versions.after.rng(`reference:${id}:${f.id}:${seed}`), { difficulty: f.levels[0] })));
  references.set(`${id}:${f.id}`, keys);
}
for (const [name, version] of Object.entries(versions)) {
  const started = performance.now(), totals = { families: 0, draws: 0, repeated: 0, witnessedAvoidableRepeats: 0 }, bySection = {};
  for (const id of ids) {
    const row = bySection[id] = { families: 0, draws: 0, repeated: 0, witnessedAvoidableRepeats: 0 };
    for (const f of version.modules[id].families) {
      const reference = references.get(`${id}:${f.id}`), history = new Set([...reference].slice(0, 20)), structures = new Set();
      const rng = version.rng(`sweep:${id}:${f.id}`);
      for (let index = 0; index < 20; index++) {
        const item = version.draw.practiceItem(version.modules[id], rng, {}, { family: f.id, difficulty: f.levels[0], excludeKeys: history, preferStructures: structures });
        assert.equal(item.family, f.id); assert.equal(item.difficulty, f.levels[0]);
        const key = questionKey(item), repeated = history.has(key);
        const avoidable = repeated && [...reference].some((candidate) => !history.has(candidate));
        for (const x of [row, totals]) { x.draws++; x.repeated += Number(repeated); x.witnessedAvoidableRepeats += Number(avoidable); }
        remember(history, key); structures.add(structureKey(item));
      }
      row.families++; totals.families++;
    }
  }
  report.familySweep[name] = { ...totals, bySection, elapsedMs: Math.round(performance.now() - started) };
}

// Exhaustive hold-outs over the 21 easy sum-event prompts, each under 30 seeds.
const sumGenerator = versions.after.modules.bto.families.find((f) => f.id === 'two-dice-sum'), all = new Map();
for (let seed = 0; seed < 4096; seed++) {
  const item = sumGenerator.generate(versions.after.rng(`holdout:${seed}`), { difficulty: 1 }); all.set(questionKey(item), item);
}
assert.equal(all.size, 21);
for (const [name, version] of Object.entries(versions)) {
  let repeated = 0, cases = 0;
  for (const heldOut of all.keys()) for (let seed = 0; seed < 30; seed++) {
    const history = [...all.keys()].filter((key) => key !== heldOut);
    const item = version.draw.practiceItem(version.modules.bto, version.rng(`last-one:${seed}`), {}, {
      family: 'two-dice-sum', difficulty: 1, excludeKeys: history, preferStructures: [...all.values()].map(structureKey),
    });
    repeated += Number(questionKey(item) !== heldOut); cases++;
  }
  report.lastUnseenDice[name] = { cases, repeatedDespiteKnownUnseenVariant: repeated };
}
assert.equal(report.lastUnseenDice.after.repeatedDespiteKnownUnseenVariant, 0);

let files = 0, papers = 0, questions = 0;
for (const file of readdirSync(join(root, 'src/sections'), { recursive: true }).map(String).filter((p) => p.endsWith('.js'))) {
  assert.deepEqual(readFileSync(join(root, 'src/sections', file)), readFileSync(join(oldRoot, 'src/sections', file))); files++;
}
for (const file of ['config/sections.js', 'config/presets.js', 'LICENSE']) assert.deepEqual(readFileSync(join(root, file)), readFileSync(join(oldRoot, file)));
const cfg = (await load(root, 'config/sections.js')).SECTIONS;
(await load(root, 'config/presets.js')).activatePreset({ id: 'kickstarter' });
(await load(oldRoot, 'config/presets.js')).activatePreset({ id: 'kickstarter' });
for (const id of ids) for (let seed = 0; seed < 10; seed++) {
  const key = `repeat-preservation:${id}:${seed}`;
  const a = versions.before.draw.examItems(versions.before.sections[id], cfg[id].exam, key);
  const b = versions.after.draw.examItems(versions.after.sections[id], cfg[id].exam, key);
  assert.deepEqual(a, b); papers++; questions += a.length;
}
report.preservation = { originalGeneratorFilesUnchanged: files, mockPapersIdentical: papers, mockQuestionsIdentical: questions,
  assessmentConfigurationUnchanged: true, licenceUnchanged: true };
report.limitations = [
  'A reference sweep witnesses unseen alternatives but does not enumerate every procedural family.',
  'Only the two explicitly enumerated dice families have a complete-domain no-repeat guarantee at each supported difficulty.',
  'Other families use a bounded 256-candidate search. A rare unseen variant can remain undiscovered.',
  'Repeat history is the existing bounded saved exposure history, not unlimited cross-device knowledge.',
  'Unseen visible prompts do not establish unfamiliar mathematical structure or empirical Optiver difficulty.',
];
writeFileSync(join(root, 'evaluation/repetition-results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
