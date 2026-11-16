// Histograms: probabilities of ranges read from bin counts, including a conditional range.
import { rankItem, retry, agreeRank } from '../lib.js';
import { q } from '../../bto/lib.js';

const ID = 'histogram-bins';
const CTX = [
  { what: 'day', of: 'daily returns of a stock', x: 'Daily return (%)', unit: '%', lo: -4, w: 1, k: 8, centre: 0.5 },
  { what: 'student', of: 'exam scores', x: 'Score', unit: '', lo: 30, w: 10, k: 7, centre: 3.5 },
  { what: 'trade', of: 'trade P&L in $k', x: 'P&L ($k)', unit: '', lo: -3, w: 1, k: 7, centre: 3.5 },
  { what: 'order', of: 'order fill times in ms', x: 'Fill time (ms)', unit: '', lo: 0, w: 2, k: 8, centre: 1.5 },
];

export default {
  id: ID,
  section: 'll',
  title: 'Histograms',
  skill: 'Sum counts in scope; unequal-width density bars require height × width before adding',
  levels: [2, 3, 4],

  generate(rng, { difficulty = 2 } = {}) {
    return retry(() => {
      const c = rng.pick(CTX);
      let bins = Array.from({ length: c.k }, (_, i) => {
        const shape = Math.max(1, Math.round(22 * Math.exp(-((i - c.centre) ** 2) / (2 * (c.k / 4) ** 2))));
        return { from: c.lo + i * c.w, to: c.lo + (i + 1) * c.w, count: Math.max(1, shape + rng.int(-4, 4)) };
      });
      const density = difficulty === 4;
      if (density) {
        let edge = c.lo;
        bins = rng.shuffle([1, 2, 3, 4, 5]).map((width) => {
          const from = edge; edge += width;
          return { from, to: edge, count: width * rng.int(2, 12) };
        });
      }
      const k = bins.length;
      const N = bins.reduce((a, b) => a + b.count, 0);
      const edge = (i) => i === k ? bins.at(-1).to : bins[i].from;
      const sumIn = (a, b) => bins.filter((x) => x.from >= a && x.to <= b).reduce((s, x) => s + x.count, 0);
      const mk = () => {
        const t = rng.pick(difficulty === 2 ? ['gt', 'lt', 'between'] : ['gt', 'lt', 'between', 'cond']);
        const i = rng.int(1, k - 1), j = rng.int(i + 1, k);
        if (t === 'gt') return { t, a: edge(i), p: q(sumIn(edge(i), edge(k)), N), text: `A randomly chosen ${c.what} has a value above ${edge(i)}${c.unit}.` };
        if (t === 'lt') return { t, a: edge(i), p: q(sumIn(edge(0), edge(i)), N), text: `A randomly chosen ${c.what} has a value below ${edge(i)}${c.unit}.` };
        if (t === 'between') { const a = rng.int(0, k - 2), b = rng.int(a + 1, Math.min(k, a + 3)); return { t, a: edge(a), b: edge(b), p: q(sumIn(edge(a), edge(b)), N), text: `A randomly chosen ${c.what} has a value between ${edge(a)}${c.unit} and ${edge(b)}${c.unit}.` }; }
        const base = sumIn(edge(i), edge(k));
        return { t, a: edge(i), b: edge(j), p: q(sumIn(edge(j), edge(k)), base), text: `Among ${c.what}s with a value above ${edge(i)}${c.unit}, a randomly chosen one is above ${edge(j)}${c.unit}.` };
      };
      const sts = [mk(), mk(), mk()];
      if (new Set(sts.map((x) => x.text)).size < 3) return null;
      return rankItem(ID, rng, difficulty, {
        text: `The histogram shows ${N} ${c.of}.${density ? ' Bins have unequal widths. Height is frequency density (count divided by width); each bar AREA is its count. Labels above bars give their heights.' : ''} One ${c.what} is chosen at random (or from a subgroup, where stated). Values fall strictly inside the bins, never on an edge. Rank the statements from most to least likely.`,
        visual: { type: 'histogram', xLabel: c.x, yLabel: density ? 'Frequency density' : 'Count', unit: c.unit, bins, ...(density ? { density: true } : {}) },
        statements: sts.map((x) => ({ text: x.text, p: x.p, how: `${density ? 'Recover each count as height × bin width. ' : ''}${x.t === 'cond' ? `Count above ${x.b}${c.unit} divided by count above ${x.a}${c.unit}: the denominator is the subgroup.` : `Add the counts in the range and divide by ${N}.`}` })),
        intro: [{ say: `Total count: ${N}. ${density ? 'Unequal widths require areas, not heights: count = density × width.' : 'Each statement adds a block of neighbouring bars.'}`, why: 'Every observation is equally likely to be the one chosen.' }],
        compare: 'Order the fractions; a conditional fraction can be large even when its range is small, because its denominator is small too.',
        rule: density ? 'Count = height × width. Sum counts in range / counts in scope; conditional events change the scope.' : 'P(range) = bars in range / total. P(range | condition) = bars in both / bars in the condition.',
        anchor: density ? 'Counting table rows, grouped into unequal-width bins: the area, not the height, counts observations.' : 'Counting table rows, grouped into bins: a bar height is a count of equally likely outcomes.',
        ...(density ? { fast: 'Read the axis first: recover each count as frequency density × width, then divide counts in the event by counts in its stated scope.' } : {}),
        hints: ['What is the total count?', density ? 'Convert each density bar to a count using height × width.' : 'Add the bars inside each range.', 'For the "among" statement, divide by the subgroup count.'],
        params: { bins, ...(density ? { scenario: 'unequal-width-density' } : {}), statements: sts.map(({ t, a, b }) => ({ t, a, b: b ?? null })) },
      });
    });
  },

  // Independent check: recount the rendered bins.
  verify(item) {
    const bins = item.prompt.visual.bins;
    const N = bins.reduce((a, b) => a + b.count, 0);
    const mass = (lo, hi) => bins.reduce((s, b) => s + (b.from >= lo && b.to <= hi ? b.count : 0), 0);
    const ps = item.params.statements.map((st) => {
      if (st.t === 'gt') return mass(st.a, Infinity) / N;
      if (st.t === 'lt') return mass(-Infinity, st.a) / N;
      if (st.t === 'between') return mass(st.a, st.b) / N;
      return mass(st.b, Infinity) / mass(st.a, Infinity);
    });
    return agreeRank(item, ps);
  },

  lesson: {
    purpose: 'Histogram questions ask for the probability of a range. Read the vertical axis, recover counts, and divide by the population actually sampled.',
    anchor: 'Grouped outcome counts: count bars give counts directly; density bars give counts through height × width.',
    steps: [
      { say: 'Read the axis: use counts directly, or multiply frequency density by each bin width.', why: 'Unequal-width density bars must be compared by area, not height.' },
      { say: 'Find the total count, then add the counts inside the requested range.', why: 'Disjoint bins add; unconditional statements divide by the full total.' },
      { say: 'For "among values above a", divide by the bars above a only.', why: 'Conditioning restricts the population.' },
    ],
    predict: { question: 'Can P(value above 2 | value above 1) exceed P(value above 1)?', answer: 'Yes. The conditional divides by a smaller group, so it can be larger.' },
    edge: 'A range covering every bin has probability 1; an empty range has probability 0.',
    rule: 'Recover counts first. Range = counts in range / total; conditional = counts in both / counts in the condition.',
    contrast: 'P(above 2) over everyone against P(above 2 | above 1) over a subgroup.',
  },
};
