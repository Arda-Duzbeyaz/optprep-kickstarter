// Optimal stopping on a small red/black deck: +1 per red, -1 per black, stop whenever you like.
import { mcqItem, agree, q, table } from '../lib.js';

const ID = 'card-stopping';

// Exact value V(r, b) with the option to stop (value 0 for the future) at any time.
const MEMO = new Map();
export function value(r, b, memo = MEMO) {
  if (r === 0) return q(0);
  if (b === 0) return q(r);
  const key = `${r},${b}`;
  if (memo.has(key)) return memo.get(key);
  const n = q(r + b);
  const go = q(r).div(n).mul(q(1).add(value(r - 1, b, memo))).add(q(b).div(n).mul(q(-1).add(value(r, b - 1, memo))));
  const v = go.cmp(0) > 0 ? go : q(0);
  memo.set(key, v);
  return v;
}
// Value of the simpler rule "stop as soon as you are ahead" (or when the deck is exhausted).
const AHEAD = new Map();
function stopWhenAhead(r, b, score = 0) {
  if (score > 0) return q(score);
  if (r + b === 0) return q(score);
  const key = `${r},${b},${score}`;
  if (AHEAD.has(key)) return AHEAD.get(key);
  const n = q(r + b);
  let v = q(0);
  if (r) v = v.add(q(r).div(n).mul(stopWhenAhead(r - 1, b, score + 1)));
  if (b) v = v.add(q(b).div(n).mul(stopWhenAhead(r, b - 1, score - 1)));
  AHEAD.set(key, v);
  return v;
}

// E[max over prefixes of the running total]: the value if you could see the whole shuffle.
function hindsight(r, b) {
  let tot = 0, count = 0;
  const walk = (R, B, score, best) => {
    if (R === 0 && B === 0) { tot += best; count++; return; }
    if (R) walk(R - 1, B, score + 1, Math.max(best, score + 1));
    if (B) walk(R, B - 1, score - 1, best);
  };
  walk(r, b, 0, 0);
  return q(tot, count); // every distinct arrangement of the colours is equally likely
}

function shortGame(rng) {
  const r = rng.int(1, 3), b = rng.int(1, 4), gain = rng.int(1, 3), loss = rng.int(1, 2);
  const one = (red, black) => q(red * gain - black * loss, red + black);
  const positive = (x) => x.cmp(0) > 0 ? x : q(0);
  const afterRed = one(r - 1, b), afterBlack = one(r, b - 1);
  const once = one(r, b);
  const continueValue = once.add(q(r, r + b).mul(positive(afterRed))).add(q(b, r + b).mul(positive(afterBlack)));
  const answer = positive(continueValue);
  const distractors = [
    { value: positive(once), misconception: 'Compared stopping now with drawing once, overlooking the optional second draw.' },
    { value: positive(once.mul(q(2))), misconception: 'Compared stopping with committing to both draws before seeing the first card.' },
    { value: q(r * gain, r + b), misconception: 'Counted the gain from a red but ignored the loss from a black.' },
    { value: positive(afterBlack), misconception: 'Used the value of a draw after a black as if a black had already been removed.' },
    { value: 0, misconception: 'Stopped immediately even if drawing first has a positive value.' },
  ];
  return {
    ev: true, value: answer, minGap: () => .025,
    text: `A shuffled pile has ${r} red and ${b} black cards. A red wins £${gain}, a black loses £${loss}. You may draw up to two cards without replacement and can stop before either draw. What is your expected net gain with optimal play?`,
    distractors,
    fillers: Array.from({ length: 15 }, (_, i) => ({ value: 2 * gain * i / 14, misconception: 'Recalculate the value of the second draw after each possible first card.' })),
    steps: [
      { say: `If the first card is red, the remaining draw is worth ${afterRed}. If it is black, the remaining draw is worth ${afterBlack}.`, why: 'After drawing once, use the numbers of red and black cards still left.' },
      { say: `Take the second draw only if its expected gain is positive. Drawing first is then worth ${continueValue}.`, why: 'Weight both first-card branches, including each first-card payout.' },
      { say: 'Compare drawing first with keeping the starting balance.', math: `max(0, ${continueValue}) = ${answer}`, why: 'Keeping the starting balance is worth zero additional money.' },
    ],
    hints: ['Evaluate the last draw after a red and after a black.', 'At each choice you can keep the balance instead.'],
    rule: 'Compare the value of drawing with zero additional gain from stopping, starting at the final decision.',
    anchor: 'The second card is optional and the first card changes its odds.',
    picture: table(['First card', 'Chance', 'Expected gain from a second draw'], [['Red', q(r, r + b), afterRed], ['Black', q(b, r + b), afterBlack]], 'Decide whether to take the second card separately for each first-card result.'),
    fast: `Compare stopping with the first draw plus whichever second draws have positive value. The best gain is ${answer}.`,
    check: 'Stopping at once is available, so the optimal expected net gain is at least zero.',
    params: { r, b, gain, loss, draws: 2 },
  };
}

export default {
  id: ID,
  section: 'bto',
  title: 'Optimal stopping with a deck of cards',
  skill: 'Value of a state = max(stop now, expected value of drawing on); solve backwards from small decks',
  levels: [3, 4, 5],

  generate(rng, { difficulty = 3 } = {}) {
    if (difficulty === 3) return mcqItem(ID, rng, difficulty, shortGame(rng));
    let r, b;
    do {
      r = difficulty === 4 ? rng.int(1, 4) : rng.int(3, 6);
      b = difficulty === 4 ? rng.int(1, 4) : rng.int(3, 6);
    } while (value(r, b).cmp(q(Math.max(0, r - b))) === 0 && rng.chance(0.7)); // prefer decks where the option adds value
    const V = value(r, b);
    const ahead = stopWhenAhead(r, b);
    return mcqItem(ID, rng, difficulty, {
      ev: true,
      minGap: (c) => Math.max(0.05, Math.abs(c) * 0.06),
      value: V,
      text: `A deck holds ${r} red card${r > 1 ? 's' : ''} and ${b} black card${b > 1 ? 's' : ''}, shuffled. You turn cards over one at a time: each red pays you $1, each black costs you $1. You may stop at any moment (including before the first card) and keep your running total. With optimal play, what is the game worth?`,
      distractors: [
        { value: q(r - b), misconception: 'Played the whole deck: that ignores the option to stop.' },
        { value: q(Math.max(0, r - b)), misconception: 'Only considered stopping at the start or playing everything; stopping in the middle is where the option earns its value.' },
        { value: ahead, misconception: 'Valued the rule "stop as soon as you are ahead". It is not optimal: when many reds remain, keep drawing.' },
        { value: q(r, r + b), misconception: 'Used P(first card red) as the value of the game.' },
        { value: hindsight(r, b), misconception: 'Valued stopping at the best moment of the shuffle in hindsight. You must decide without seeing the cards still to come.' },
      ],
      steps: [
        { say: 'Let V(r, b) be the value with r reds and b blacks left. V(r, 0) = r (take them all) and V(0, b) = 0 (stop).', why: 'The boundary cases have obvious best plays.' },
        { say: 'Otherwise V(r, b) = max(0, r/(r+b)·(1 + V(r−1, b)) + b/(r+b)·(−1 + V(r, b−1))).', why: 'Compare stopping now (0 more) with drawing once and then playing optimally.' },
        { say: `Fill the table from small decks up: V(${r}, ${b}) = ${V} ≈ ${V.toNumber().toFixed(3)}.`, why: `For example V(1,1) = 1/2 and V(2,2) = 2/3.` },
      ],
      rule: 'V(r,b) = max(0, [r(1 + V(r−1,b)) + b(−1 + V(r,b−1))]/(r+b)). V(1,1) = 1/2, V(2,2) = 2/3, V(3,3) = 17/20.',
      anchor: 'The reroll rule for dice (keep iff the sure value beats continuing), with one change: the deck changes as you draw, so the value of continuing depends on what is left.',
      hints: ['Start from tiny decks: what is V(1,1)?', 'At each state compare 0 (stop) with the expected value of one more draw.', `Build the table up to (${r}, ${b}).`],
      picture: table(['Reds left ↓ / blacks left →', ...Array.from({ length: b + 1 }, (_, j) => String(j))], Array.from({ length: r + 1 }, (_, i) => [String(i), ...Array.from({ length: b + 1 }, (_, j) => value(i, j).toString())]), `Each cell is the value of the game with that many reds and blacks left. A cell uses only the cell above it (one red fewer) and the cell to its left (one black fewer); the answer is the corner (${r}, ${b}).`),
      fast: `Fill V from small decks up; V(${r}, ${b}) = ${V}.`,
      check: `At least max(0, ${r} − ${b}) = ${Math.max(0, r - b)} (stop at once, or play everything) and no greater than the hindsight value ${hindsight(r, b).toNumber().toFixed(3)} of knowing the whole order in advance. Stopping as soon as you are ahead gives ${ahead.toNumber().toFixed(3)}.`,
      data: { r, b },
    });
  },

  // Independent check: bottom-up floating-point table over decks of increasing size.
  verify(item) {
    const { r, b, draws, gain, loss } = item.params;
    if (draws === 2) {
      const deck = [...Array(r).fill(gain), ...Array(b).fill(-loss)];
      let best = 0;
      for (const afterRed of [false, true]) for (const afterBlack of [false, true]) {
        let total = 0;
        for (const [i, first] of deck.entries()) for (const [j, second] of deck.entries()) {
          if (i !== j) total += first + ((first > 0 ? afterRed : afterBlack) ? second : 0);
        }
        best = Math.max(best, total / (deck.length * (deck.length - 1)));
      }
      return agree(item, best);
    }
    const T = Array.from({ length: r + 1 }, () => Array(b + 1).fill(0));
    for (let size = 1; size <= r + b; size++) {
      for (let R = Math.max(0, size - b); R <= Math.min(r, size); R++) {
        const B = size - R;
        const draw = (R ? (R / size) * (1 + T[R - 1][B]) : 0) + (B ? (B / size) * (-1 + T[R][B - 1]) : 0);
        T[R][B] = Math.max(0, draw);
      }
    }
    return agree(item, T[r][b], 1e-9);
  },

  lesson: {
    purpose: 'A balanced deck has expected value 0 if you must play it out, yet the right to stop makes it worth money. This is an option value, the core of what market makers price.',
    anchor: 'The dice reroll rule (keep iff the sure amount beats continuing), with one change: after each draw the deck is different, so solve a table of small decks.',
    steps: [
      { say: 'State = (reds left, blacks left). Your past winnings do not affect future decisions.', why: 'Only what remains in the deck changes the future.' },
      { say: 'V(r, b) = max(stop: 0, draw: expected card value + expected V of the next state).', why: 'Optimal play compares the two choices at every state.' },
      { say: 'Fill the table from small decks upwards.', why: 'Every state refers only to smaller decks.' },
    ],
    predict: { question: 'Deck of 1 red, 1 black: worth 0 or more? What should you do after drawing black first?', answer: 'Worth 1/2. Draw once: red → stop with +1; black → draw the red and finish at 0.' },
    edge: 'All red: take everything (value r). All black: stop immediately (value 0).',
    rule: 'Option to stop ≥ 0 always; V(2,2) = 2/3, V(3,3) = 17/20.',
    contrast: 'Must-play value (r − b, zero for a balanced deck) against option value V(r, b) > 0.',
  },
};
