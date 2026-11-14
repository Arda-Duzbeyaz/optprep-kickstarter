import { makeRng } from '../core/rng.js';
import { nearestLevel } from '../core/draw.js';
import { questionKey } from '../core/questions.js';
import { structureKey } from './profile.js';
import { TRANSFER_FAMILIES } from './index.js';
import { presentation } from '../core/presentation.js';
export { presentation } from '../core/presentation.js';
export const TRANSFER_SECTIONS = ['bto', 'nl', 'll', 'iv', 'ob'];
export const TRANSFER_TIMING = Object.freeze({ count: 15, totalSeconds: 1200, perItemSeconds: 90 });
export const SECTION_TRANSFER_TIMING = Object.freeze({ count: 10, totalSeconds: 900, perItemSeconds: 90 });
export function transferItems(modules, { seed, questionHistory = {}, structureHistory = {}, perSection = 3, sections = TRANSFER_SECTIONS } = {}) {
  if (!Number.isInteger(perSection) || perSection < 1 || perSection > 20) throw new Error('perSection must be 1..20');
  if (!Array.isArray(sections) || !sections.length || new Set(sections).size !== sections.length || sections.some((s) => !TRANSFER_SECTIONS.includes(s))) throw new Error('Choose supported transfer sections');
  const rng = makeRng(`transfer:${seed}`), out = [];
  for (const section of sections) {
    const old = modules[section]?.families || [];
    if (!old.length) throw new Error(`missing section ${section}`);
    const extras = rng.shuffle(TRANSFER_FAMILIES[section] || []), all = [...old, ...extras];
    const exactSeen = new Set(questionHistory[section] || []), structureSeen = new Set(structureHistory[section] || []);
    const runStructures = new Set(), runFamilies = new Set();
    for (let i = 0; i < perSection; i++) {
      const allowed = i < extras.length ? [extras[i]] : rng.shuffle(all.filter((f) => !runFamilies.has(f.id)));
      const pool = allowed.length ? allowed : all;
      let best = null, bestCost = Infinity;
      for (let attempt = 0; attempt < 24; attempt++) {
        const family = pool[attempt % pool.length], difficulty = nearestLevel(family.levels, rng.pick([2, 3, 4]));
        const item = family.generate(rng.fork(`${section}:${i}:${attempt}:${rng.int(0, 2 ** 30)}`), { difficulty });
        const key = questionKey(item), structure = structureKey(item), repeat = exactSeen.has(key);
        const cost = 10000 * Number(repeat) + 100 * Number(runStructures.has(structure)) + 20 * Number(runFamilies.has(family.id)) + 5 * Number(structureSeen.has(structure));
        if (cost < bestCost) { best = { item, key, structure, repeat }; bestCost = cost; }
        if (cost === 0) break;
      }
      exactSeen.add(best.key); runStructures.add(best.structure); runFamilies.add(best.item.family);
      const newStructure = !structureSeen.has(best.structure); structureSeen.add(best.structure);
      out.push({ item: presentation(best.item, rng), key: best.key, structure: best.structure, repeat: best.repeat, newStructure, extended: extras.some((f) => f.id === best.item.family) });
    }
  }
  return rng.shuffle(out);
}
export function transferSummary(records) {
  const summary = (rows) => {
    const regular = rows.filter((r) => r.section !== 'iv'), intervals = rows.filter((r) => r.section === 'iv');
    return { displayed: rows.length, answered: rows.filter((r) => !r.skipped).length,
      regularN: regular.length, regularCorrect: regular.filter((r) => r.correct).length,
      intervalN: intervals.length, intervalMean: intervals.length ? intervals.reduce((s, r) => s + r.score, 0) / intervals.length : null };
  };
  return { all: summary(records), unseen: summary(records.filter((r) => !r.repeat)),
    newStructure: summary(records.filter((r) => !r.repeat && r.newStructure)),
    familiarStructure: summary(records.filter((r) => !r.repeat && !r.newStructure)), review: summary(records.filter((r) => r.repeat)) };
}
