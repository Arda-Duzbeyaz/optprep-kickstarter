// Drawing items for sessions: exam replicas (fixed count, difficulty ramp, bank mix,
// unique prompts, deterministic per seed) and adaptive practice.
import { makeRng } from './rng.js';
import { familyWeights, pickFamily } from './adaptive.js';
import { questionKey } from './questions.js';
import { structureKey } from '../transfer/profile.js';
import { presentation } from './presentation.js';

export function nearestLevel(levels, d) {
  const ls = levels?.length ? levels : [1];
  return ls.reduce((best, l) => (Math.abs(l - d) < Math.abs(best - d) ? l : best), ls[0]);
}

export function drawItem(section, rng, { family, difficulty } = {}) {
  const f = family ? section.families.find((x) => x.id === family) : rng.pick(section.families);
  if (!f) throw new Error(`no family ${family} in ${section.id}`);
  const level = difficulty ? nearestLevel(f.levels, difficulty) : rng.pick(f.levels?.length ? f.levels : [1]);
  return f.generate(rng.fork(`${f.id}:${rng.int(0, 2 ** 31)}`), { difficulty: level });
}

// cfg: { count, ramp?: boolean, bankRatio?: number }
export function examItems(section, cfg, seed) {
  const rng = makeRng(`exam:${section.id}:${seed}`);
  const count = cfg.count;
  const excluded = new Set(cfg.excludeKeys || []);
  const bankPool = rng.shuffle(section.bank || []).filter((it) => !excluded.has(questionKey(it)));
  const nBank = Math.min(bankPool.length, Math.round(count * (cfg.bankRatio ?? 0.2)));
  const bankSlots = new Set(rng.shuffle([...Array(count).keys()]).slice(0, nBank));
  const famOrder = [];
  const out = [];
  const seen = new Set();
  for (let i = 0; i < count; i++) {
    const target = cfg.ramp ? 1 + Math.floor((i / count) * 5) : 1 + (i % 5);
    if (bankSlots.has(i) && bankPool.length) {
      // prefer a bank item near the target difficulty
      bankPool.sort((a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target));
      const it = bankPool.splice(0, 1)[0];
      const key = questionKey(it);
      if (!seen.has(key)) { seen.add(key); out.push(it); continue; }
    }
    if (!famOrder.length) famOrder.push(...rng.shuffle(section.families));
    // families that can reach the target difficulty come first
    famOrder.sort((a, b) => Math.abs(nearestLevel(a.levels, target) - target) - Math.abs(nearestLevel(b.levels, target) - target));
    const f = famOrder.shift();
    let it;
    for (let tries = 0; tries < 60; tries++) {
      // If one template is exhausted, try another supported family. Returning a
      // repeat is a last resort and the runner marks that exam as review practice.
      it = drawItem(section, rng, { family: tries < 30 ? f.id : undefined, difficulty: target });
      const key = questionKey(it);
      if (!seen.has(key) && !excluded.has(key)) break;
    }
    seen.add(questionKey(it));
    out.push(it);
  }
  if (cfg.ramp) out.sort((a, b) => a.difficulty - b.difficulty);
  return out;
}

export function practiceItem(section, rng, stats, { family, difficulty, excludeKeys = [], familyPool, avoidFamilies = [], targets = {}, preferStructures, shuffleOptions = false } = {}) {
  const excluded = new Set(excludeKeys);
  const all = section.families.map((f) => f.id);
  const pool = family ? [family] : familyPool ? all.filter((id) => familyPool.includes(id)) : all;
  if (!pool.length) throw new Error('No eligible practice skills');
  const unused = pool.filter((id) => !avoidFamilies.includes(id));
  const w = familyWeights(section.id, unused.length ? unused : pool, stats);
  if (preferStructures !== undefined) {
    const structures = new Set(preferStructures), id = family || pickFamily(rng, w);
    let best = null, cost = Infinity;
    for (let tries = 0; tries < 16; tries++) {
      const candidate = drawItem(section, rng, { family: id, difficulty: difficulty ?? targets[id] });
      const nextCost = 10000 * Number(excluded.has(questionKey(candidate))) + Number(structures.has(structureKey(candidate)));
      if (nextCost < cost) { best = candidate; cost = nextCost; }
      if (cost === 0) break;
    }
    return shuffleOptions ? presentation(best, rng) : best;
  }
  let item;
  for (let tries = 0; tries < 40; tries++) {
    const id = family || pickFamily(rng, w);
    item = drawItem(section, rng, { family: id, difficulty: difficulty ?? targets[id] });
    if (!excluded.has(questionKey(item))) break;
  }
  return shuffleOptions ? presentation(item, rng) : item;
}

export function examScore(sectionId, scores) {
  const score = Math.round(scores.reduce((s, x) => s + x, 0) * 1000) / 1000;
  return { score, max: scores.length };
}
