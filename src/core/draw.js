// Drawing items for sessions: exam replicas (fixed count, difficulty ramp, bank mix,
// unique prompts, deterministic per seed) and adaptive practice.
import { makeRng } from './rng.js';
import { familyWeights, pickFamily } from './adaptive.js';
import { questionKey, questionSeen } from './questions.js';
import { structureKey } from '../transfer/profile.js';
import { presentation } from './presentation.js';
import { finiteVariants } from '../practice/finite-variants.js';

export const PRACTICE_FRESH_SEARCH = 256;
const STRUCTURE_SEARCH = 16;

// Failure is explicit: an unseen-only session must never silently recycle a prompt.
// For non-enumerable generators this means the bounded search found no new item,
// not a proof that their whole mathematical domain has been exhausted.
export class FreshQuestionsUnavailable extends Error {
  constructor(section, freshFamilies = 0, requiredFamilies = 1) {
    super('Could not find enough unseen questions in the selected skills at their current difficulties.');
    this.name = 'FreshQuestionsUnavailable';
    this.section = section; this.freshFamilies = freshFamilies; this.requiredFamilies = requiredFamilies;
  }
}

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
  const bankKeys = new Set(excluded);
  const bankPool = rng.shuffle(section.bank || []).filter((it) => {
    const key = questionKey(it);
    if (questionSeen(bankKeys, it)) return false;
    bankKeys.add(key); return true;
  });
  const nBank = Math.min(bankPool.length, Math.round(count * (cfg.bankRatio ?? 0.2)));
  const bankSlots = new Set(rng.shuffle([...Array(count).keys()]).slice(0, nBank));
  const famOrder = [];
  const out = [];
  const seen = new Set(excluded);
  for (let i = 0; i < count; i++) {
    const target = cfg.ramp ? 1 + Math.floor((i / count) * 5) : 1 + (i % 5);
    if (bankSlots.has(i) && bankPool.length) {
      // prefer a bank item near the target difficulty
      bankPool.sort((a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target));
      while (bankPool.length && questionSeen(seen, bankPool[0])) bankPool.shift();
      if (bankPool.length) { const it = bankPool.shift(); seen.add(questionKey(it)); out.push(it); continue; }
    }
    if (!famOrder.length) famOrder.push(...rng.shuffle(section.families));
    // families that can reach the target difficulty come first
    famOrder.sort((a, b) => Math.abs(nearestLevel(a.levels, target) - target) - Math.abs(nearestLevel(b.levels, target) - target));
    const preferred = famOrder.shift();
    const alternatives = [preferred, ...rng.shuffle(section.families).filter((f) => f !== preferred)
      .sort((a, b) => Math.abs(nearestLevel(a.levels, target) - target) - Math.abs(nearestLevel(b.levels, target) - target))].filter(Boolean);
    let it = null;
    for (const f of alternatives) {
      try {
        it = practiceItem(section, rng, {}, { family: f.id, difficulty: target, excludeKeys: seen, requireFresh: true });
        break;
      } catch (error) { if (!(error instanceof FreshQuestionsUnavailable)) throw error; }
    }
    // A remaining bank item is also a valid fresh fallback. Never return a short paper.
    if (!it) it = bankPool.find((candidate) => !questionSeen(seen, candidate));
    if (!it) throw new FreshQuestionsUnavailable(section.id);
    seen.add(questionKey(it));
    out.push(it);
  }
  if (cfg.ramp) out.sort((a, b) => a.difficulty - b.difficulty);
  return out.map((item) => presentation(item, rng));
}

export function practiceItem(section, rng, stats, { family, difficulty, excludeKeys = [], familyPool, avoidFamilies = [], targets = {}, preferStructures, shuffleOptions = false, requireFresh = false, minFreshFamilies = 1 } = {}) {
  const excluded = new Set(excludeKeys);
  const all = section.families.map((f) => f.id);
  const pool = family ? [family] : familyPool ? all.filter((id) => familyPool.includes(id)) : all;
  if (!pool.length) throw new Error('No eligible practice skills');
  const unused = pool.filter((id) => !avoidFamilies.includes(id));
  if (requireFresh) {
    let selected = null, available = 0;
    const groups = [unused, pool.filter((id) => avoidFamilies.includes(id))];
    for (const group of groups) {
      const weights = familyWeights(section.id, group, stats);
      while (Object.keys(weights).length) {
        const id = pickFamily(rng, weights); delete weights[id];
        const candidate = practiceItem(section, rng, stats, { family: id, difficulty: difficulty ?? targets[id],
          excludeKeys: excluded, preferStructures: preferStructures ?? [] });
        if (!candidate || questionSeen(excluded, candidate)) continue;
        selected ||= candidate; available++;
        if (available >= minFreshFamilies) return shuffleOptions ? presentation(selected, rng) : selected;
      }
    }
    const error = new FreshQuestionsUnavailable(section.id, available, minFreshFamilies);
    if (pool.length === 1) {
      const generator = section.families.find((f) => f.id === pool[0]);
      const level = difficulty ?? targets[pool[0]];
      error.family = pool[0]; error.difficulty = level;
      const variants = level ? finiteVariants(generator, nearestLevel(generator.levels, level)) : null;
      error.catalogueSize = variants?.length ?? null;
      error.catalogueExhausted = !!variants && variants.every((item) => questionSeen(excluded, item));
    }
    throw error;
  }
  const w = familyWeights(section.id, unused.length ? unused : pool, stats);
  if (preferStructures !== undefined) {
    const structures = new Set(preferStructures), id = family || pickFamily(rng, w);
    const generator = section.families.find((f) => f.id === id);
    if (!generator) throw new Error(`no family ${id} in ${section.id}`);
    const target = difficulty ?? targets[id];
    const level = target ? nearestLevel(generator.levels, target) : rng.pick(generator.levels?.length ? generator.levels : [1]);
    const order = new Map([...excluded].map((key, index) => [key, index]));
    const variants = finiteVariants(generator, level);
    let best = null;
    if (variants) {
      const unseen = variants.filter((item) => !questionSeen(excluded, item));
      if (unseen.length) {
        const novel = unseen.filter((item) => !structures.has(structureKey(item)));
        const branches = new Map();
        for (const item of novel.length ? novel : unseen) {
          const key = structureKey(item); if (!branches.has(key)) branches.set(key, []);
          branches.get(key).push(item);
        }
        // A branch with more number combinations must not crowd out the other
        // methods in the same topic. Pick a branch, then one unseen instance.
        best = structuredClone(rng.pick(rng.pick([...branches.values()])));
      } else {
        // All actual variants at this difficulty have been exposed. Revisit the
        // least recently shown one, cycling the finite pool without immediate repeats.
        best = structuredClone(variants.reduce((oldest, item) => order.get(questionKey(item)) < order.get(questionKey(oldest)) ? item : oldest));
      }
    } else {
      let unseen = null, oldest = null, oldestIndex = Infinity;
      for (let tries = 0; tries < PRACTICE_FRESH_SEARCH; tries++) {
        const candidate = drawItem(section, rng, { family: id, difficulty: level });
        const key = questionKey(candidate);
        if (!questionSeen(excluded, candidate)) {
          if (!unseen || !structures.has(structureKey(candidate))) unseen = candidate;
          if (!structures.has(structureKey(candidate))) break;
        } else if ((order.get(key) ?? 0) < oldestIndex) { oldest = candidate; oldestIndex = order.get(key) ?? 0; }
        // Structural preference must not limit the search for an unseen question.
        // Once one is found, keep the short existing window for a new branch.
        if (unseen && tries + 1 >= STRUCTURE_SEARCH) break;
      }
      best = unseen || oldest;
    }
    return shuffleOptions ? presentation(best, rng) : best;
  }
  let item;
  for (let tries = 0; tries < 40; tries++) {
    const id = family || pickFamily(rng, w);
    item = drawItem(section, rng, { family: id, difficulty: difficulty ?? targets[id] });
    if (!questionSeen(excluded, item)) break;
  }
  return shuffleOptions ? presentation(item, rng) : item;
}

export function examScore(sectionId, scores) {
  const score = Math.round(scores.reduce((s, x) => s + x, 0) * 1000) / 1000;
  return { score, max: scores.length };
}
