import { makeRng } from '../core/rng.js';
import { pickFamily } from '../core/adaptive.js';
import { practiceItem, FreshQuestionsUnavailable } from '../core/draw.js';
import { questionKey, questionSeen } from '../core/questions.js';
import { presentation } from '../core/presentation.js';
import { structureKey } from '../transfer/profile.js';
import { composeEvent } from './compose.js';

const CORE = new Set([
  'event-algebra', 'at-least-one', 'success-counts', 'card-draws', 'urn-draws',
  'conditional-dice', 'bayes-test', 'bayes-boxes', 'box-experiment', 'conditional-process',
  'information-protocols', 'shared-source', 'first-success', 'expected-waiting',
  'race-to-k', 'stopped-process', 'card-stopping', 'payout-models', 'linearity', 'dice-games-ev',
]);
const OCCASIONAL = new Set([
  'pigeonhole', 'monty-hall', 'birthday', 'derangements', 'variance-dependence', 'clt-estimates',
]);

function timedWeight(family, difficulty) {
  if (family === 'card-stopping' && difficulty > 3) return 0;
  return CORE.has(family) ? 5 : OCCASIONAL.has(family) ? 0.35 : 1.5;
}

export function buildBtoPaper(section, cfg, seed) {
  const rng = makeRng(`bto-paper:${seed}`);
  const easy = Math.round(cfg.count * 0.30), hard = Math.round(cfg.count * 0.20);
  const stretch = Math.min(hard, Math.round(cfg.count * 0.05));
  const targets = rng.shuffle([
    ...Array(easy).fill(1), ...Array(cfg.count - easy - hard).fill(2),
    ...Array(hard - stretch).fill(3), ...Array(stretch).fill(4),
  ]);
  const seen = new Set(cfg.excludeKeys), structures = new Set(cfg.previousStructures), used = new Set();
  const bank = rng.shuffle(section.bank || []);
  function freshAt(difficulty, useBank) {
    const weights = Object.fromEntries(section.families
      .filter((family) => family.levels.includes(difficulty) && timedWeight(family.id, difficulty) > 0)
      .map((family) => [family.id, timedWeight(family.id, difficulty)]));
    for (const repeatFamily of [false, true]) {
      const candidates = Object.fromEntries(Object.entries(weights).filter(([family]) => used.has(family) === repeatFamily));
      while (Object.keys(candidates).length) {
        const family = pickFamily(rng, candidates);
        delete candidates[family];
        const fromBank = () => bank.find((item) => item.family === family && item.difficulty === difficulty && !questionSeen(seen, item));
        try {
          const curated = useBank ? fromBank() : null;
          return curated || practiceItem(section, rng, {}, { family, difficulty,
            excludeKeys: seen, preferStructures: structures, requireFresh: true });
        } catch (error) {
          if (!(error instanceof FreshQuestionsUnavailable)) throw error;
          const curated = fromBank();
          if (curated) return curated;
        }
      }
    }
    return null;
  }
  return targets.map((target) => {
    const useBank = rng.chance(cfg.bankRatio ?? 0.2);
    let item;
    for (const difficulty of new Set([target, 2, 1, 3, 4])) {
      item = freshAt(difficulty, useBank);
      if (item) break;
    }
    if (!item) throw new FreshQuestionsUnavailable(section.id);
    if (item.difficulty === 3 && rng.chance(0.25)) {
      const composed = composeEvent(item, rng);
      if (!questionSeen(seen, composed)) item = composed;
    }
    seen.add(questionKey(item));
    if (item.composition?.baseKey) seen.add(item.composition.baseKey);
    structures.add(structureKey(item));
    used.add(item.family);
    return presentation(item, rng);
  });
}
