// Enumerate complete discrete inputs for the small configured question pools.
// The actual family generators still calculate every answer and explanation.
// Their complete visible domains can therefore be checked before any repeat.
import twoDice, { SUM_PAIRS, SUM_INTERVALS } from '../sections/bto/families/two-dice-sum.js';
import repeatedDie, { repeatInputs } from '../sections/bto/families/die-repeats.js';
import orderStats, { orderInputs } from '../sections/bto/families/dice-order-stats.js';
import threeDice, { threeDiceBasics } from '../sections/bto/families/three-dice.js';
import cards, { cardBasics, cardHandInputs } from '../sections/bto/families/card-draws.js';
import monty from '../sections/bto/families/monty-hall.js';
import race from '../sections/bto/families/race-to-k.js';
import coupon from '../sections/bto/families/coupon-collector.js';
import extremes from '../sections/bto/families/expected-extremes.js';
import duel from '../sections/bto/families/dice-duel.js';
import diceGames from '../sections/bto/families/dice-games-ev.js';
import atLeastOne from '../sections/bto/families/at-least-one.js';
import firstSuccess from '../sections/bto/families/first-success.js';
import coins from '../sections/bto/families/coin-sequences.js';
import geometry from '../sections/bto/families/uniform-geometry.js';
import intervalWaiting from '../sections/iv/families/waiting-time.js';
import intervalDice from '../sections/iv/families/expected-dice.js';
import { makeRng } from '../core/rng.js';
import { questionKey } from '../core/questions.js';

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const cache = new WeakMap();
const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};

function plans(family, difficulty) {
  if (family === twoDice) {
    if (difficulty === 1) return [
      ...range(2, 12).map((sum) => ({ picks: [0], ints: [sum] })),
      ...range(2, 11).map((sum) => ({ picks: [1], ints: [sum] })),
      ...SUM_PAIRS.map((_, i) => ({ picks: [2, i] })),
    ];
    if (difficulty === 2) return [
      ...range(4, 11).map((bound) => ({ picks: [0], ints: [bound] })),
      ...range(3, 10).map((bound) => ({ picks: [1], ints: [bound] })),
      ...[true, false].map((odd) => ({ picks: [2], chances: [odd] })),
      ...[0, 1, 2].map((divisor) => ({ picks: [3, divisor] })),
      ...[4, 5].flatMap((kind) => SUM_INTERVALS.map((_, i) => ({ picks: [kind, i] }))),
    ];
  }
  if (family === repeatedDie) {
    if ([1, 2].includes(difficulty)) return repeatInputs(difficulty).map((_, index) => ({ picks: [index] }));
  }
  if (family === orderStats && [1, 2].includes(difficulty)) return orderInputs(difficulty).map((_, index) => ({ picks: [index] }));
  if (family === threeDice && difficulty === 2) return threeDiceBasics.map((_, index) => ({ picks: [index] }));
  if (family === cards) {
    if (difficulty === 1) return cardBasics.map((_, index) => ({ picks: [index] }));
    if ([2, 3].includes(difficulty)) return cardHandInputs(difficulty).map((_, index) => ({ picks: [index] }));
  }
  if (family === monty) {
    if (difficulty === 2) return range(3, 12).flatMap((n) => [0, 2].map((variant) => ({ ints: [n], picks: [variant] })));
    if (difficulty === 3) return range(4, 7).flatMap((n) => range(1, n - 2).flatMap((m) => [0, 2].map((variant) => ({ ints: [n, m], picks: [variant] }))));
  }
  if (family === race) {
    if (difficulty === 2) return range(2, 4).flatMap((k) => range(0, 4).map((p) => ({ ints: [k], picks: [p] })));
    if (difficulty === 3) return range(2, 4).flatMap((k) => range(0, 4).flatMap((p) => [true, false].map((full) => ({ ints: [k], picks: [p], chances: [full] }))));
  }
  if (family === coupon) {
    if (difficulty === 2) return range(0, 4).flatMap((context) => range(3, 10).map((n) => ({ picks: [context], ints: [n] })));
    if (difficulty === 3) return [
      ...[0, 2, 3, 4, 5].flatMap((index) => range(2, index === 0 ? 5 : 6).map((k) => ({ chances: [true], picks: [index], ints: [k] }))),
      ...range(0, 2).flatMap((context) => range(3, 10).map((n) => ({ chances: [false], picks: [context], ints: [n] }))),
    ];
  }
  if (family === extremes) {
    if (difficulty === 2) return [false, true].flatMap((min) => range(3, 12).map((s) => ({ chances: [min], ints: [s] })));
    if ([3, 4].includes(difficulty)) return [
      ...range(2, 5).flatMap((n) => range(0, 3).map((kind) => ({ chances: difficulty === 3 ? [true, false] : [false], ints: [n], picks: [kind] }))),
      ...(difficulty === 3 ? [false, true].flatMap((min) => range(3, 4).flatMap((n) => [0, 2, 3, 4].map((side) => ({ chances: [false, min], ints: [n], picks: [side] })))) : []),
    ];
  }
  if (family === duel) {
    if (difficulty === 2) return [
      ...range(0, 4).map((s) => ({ picks: [0, s] })), ...range(0, 7).map((pair) => ({ picks: [1, pair] })), ...range(0, 2).map((s) => ({ picks: [2, s] })),
    ];
    if (difficulty === 3) return [{ picks: [0] }, { picks: [1] }, ...range(0, 15).map((pair) => ({ picks: [2, pair] }))];
  }
  if (family === diceGames && [3, 4].includes(difficulty)) return (difficulty === 3 ? [0, 1, 3, 4, 5] : [0, 1, 3])
    .flatMap((sides) => range(1, 5).map((stake) => ({ picks: [sides], ints: [stake] })));
  if (family === atLeastOne) {
    if (difficulty === 1) return range(0, 9).flatMap((event) => range(2, 4).map((n) => ({ picks: [event], ints: [n] })));
    if (difficulty === 3) return [...range(8, 30).map((n) => ({ picks: [0], ints: [n] })), ...range(0, 3).map((n) => ({ picks: [1, n] }))];
  }
  if (family === firstSuccess) {
    if (difficulty === 1) return range(0, 2).flatMap((kind) => range(2, 6).map((k) => ({ picks: [kind], ints: [k] })));
    if (difficulty === 2) return [
      ...range(0, 4).flatMap((p) => range(2, 5).map((k) => ({ picks: [0, p], ints: [k] }))), { picks: [1] }, { picks: [2] },
      ...range(0,4).flatMap(p=>range(1,6).flatMap(past=>range(1,4).map(m=>({picks:[3,p],ints:[past,m]})))),
      ...range(0,4).flatMap(p=>range(2,3).flatMap(r=>range(r,7).map(k=>({picks:[4,p],ints:[r,k]})))),
    ];
  }
  if (family === coins && difficulty === 1) return range(3, 6).flatMap((n) => [{ picks: [0], ints: [n] }, ...range(1, n - 1).map((k) => ({ picks: [1], ints: [n, k] }))]);
  if (family === geometry) {
    if (difficulty === 2) return [...range(2, 5).map((k) => ({ picks: [0], ints: [k] })), ...range(0, 6).map((s) => ({ picks: [1, s] })), ...range(0, 3).map((r) => ({ picks: [2, r] }))];
    if (difficulty === 3) return [...range(0, 5).map((w) => ({ picks: [0, w] })), { picks: [1] }, ...range(0, 6).map((s) => ({ picks: [2, s] }))];
    if (difficulty === 4) return [...range(0, 18).map((a) => ({ picks: [0, a] })), { picks: [1] }, { picks: [2] }, ...range(0, 5).map((w) => ({ picks: [3, w] }))];
  }
  if (family === intervalWaiting && difficulty === 2) return range(0, 27).map((pattern) => ({ picks: [pattern] }));
  if (family === intervalDice && difficulty === 3) return [...range(0, 5).map((sides) => ({ picks: [0, sides] })), ...range(2, 10).map((n) => ({ picks: [1], ints: [n] }))];
  return null;
}

function scriptedRng(seed, plan) {
  const base = makeRng(seed), picks = [...(plan.picks || [])], ints = [...(plan.ints || [])], chances = [...(plan.chances || [])];
  return { rng: { ...base,
    pick: (array) => {
      if (!picks.length) return base.pick(array);
      const index = picks.shift();
      if (index < 0 || index >= array.length) throw new Error('Finite variant pick is out of range');
      return array[index];
    },
    int: (lo, hi) => {
      if (!ints.length) return base.int(lo, hi);
      const value = ints.shift();
      if (value < lo || value > hi) throw new Error('Finite variant integer is out of range');
      return value;
    },
    chance: (p) => chances.length ? chances.shift() : base.chance(p),
  }, assertConsumed: () => {
    if (picks.length || ints.length || chances.length) throw new Error('Finite variant input was not consumed');
  } };
}

// Frozen, history-independent cache. Selection clones the chosen question so
// view code cannot affect subsequent draws, and a reload rebuilds the same set.
export function finiteVariants(family, difficulty) {
  const inputs = plans(family, difficulty);
  if (!inputs) return null;
  let byDifficulty = cache.get(family);
  if (!byDifficulty) { byDifficulty = new Map(); cache.set(family, byDifficulty); }
  if (!byDifficulty.has(difficulty)) {
    const unique = new Map();
    for (const [index, plan] of inputs.entries()) {
      const scripted = scriptedRng(`practice-domain:${family.section}:${family.id}:${difficulty}:${index}`, plan);
      const item = family.generate(scripted.rng, { difficulty }); scripted.assertConsumed();
      unique.set(questionKey(item), item);
    }
    byDifficulty.set(difficulty, freeze([...unique.values()]));
  }
  return byDifficulty.get(difficulty);
}
