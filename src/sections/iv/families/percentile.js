import { ivItem } from '../lib.js';

// Statistics read off a grid of 200 test scores. Every statistic has a stated definition.
const COLS = 10, N = 200;
const Q_TEXT = {
  median: 'What is the median of the 200 scores? (With an even count, the median is the mean of the 100th and 101st smallest values.)',
  pct: (p) => `What is the ${p}th percentile of the 200 scores, defined as the smallest score such that at least ${p}% of the scores are at or below it?`,
  above: (t) => `How many of the 200 scores are ${t} or higher?`,
  mean: 'What is the mean of the 200 scores?',
};

function stats(values) {
  const s = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  return { s, mean, sd };
}

const fam = {
  id: 'percentile',
  section: 'iv',
  title: 'Statistics from a grid of 200 values',
  skill: 'Estimate order statistics by counting how many values fall below a guess, not by sorting',
  levels: [3, 4],
  generate(rng, { difficulty = 3 } = {}) {
    const mu = rng.int(40, 70), sig = rng.int(8, 20), skew = difficulty === 4 && rng.chance(0.5);
    const values = Array.from({ length: N }, () => {
      let v = skew ? mu - sig + Math.abs(rng.normal(0, sig * 1.4)) : rng.normal(mu, sig);
      return Math.min(99, Math.max(1, Math.round(v)));
    });
    const { s, mean, sd } = stats(values);
    const kind = rng.pick(difficulty === 3 ? ['median', 'above', 'mean'] : ['pct', 'pct', 'above', 'median']);
    let text, truth, bsd, how, why, hints, extra = {};
    if (kind === 'median') {
      truth = (s[99] + s[100]) / 2; text = Q_TEXT.median; bsd = 1 + 0.15 * sd;
      how = 'Try a score. Tally how many entries are at or below it in a few sampled rows. Adjust the trial score until the fraction is near one half.';
      why = 'The median comes from the two middle ranks. A sample estimates the fraction below a trial score.';
      hints = ['Look for a score close to the middle of the grid.', 'Count at or below that score in a sample of rows. Aim for about half.'];
    } else if (kind === 'pct') {
      const p = rng.pick([10, 20, 25, 75, 80, 90]);
      truth = s[Math.ceil((p / 100) * N) - 1]; text = Q_TEXT.pct(p); bsd = 1.5 + 0.2 * sd; extra = { p };
      how = `Find the smallest score where about ${p}% are at or below it. In the full grid this is the score at rank ${Math.ceil((p / 100) * N)}.`;
      why = `Equivalently, about ${100-p}% should be strictly above a trial value. Ties may put slightly more than ${p}% at or below the target.`;
      hints = [`Try a score and count entries at or below it in several rows.`,`Move your trial score up if the fraction is below ${p}%, and down if it is above.`];
    } else if (kind === 'above') {
      const t = Math.round(mu + rng.float(0.3, 1.3) * sig);
      truth = values.filter((v) => v >= t).length;
      if (truth < 8) return fam.generate(rng.fork('retry'), { difficulty });
      text = Q_TEXT.above(t); bsd = Math.max(3, 0.12 * truth); extra = { threshold: t };
      how = `Count scores at or above ${t} in a few rows. Multiply the count by 20 divided by the number of rows you checked.`;
      why = 'All rows have ten scores, so each scanned row represents the same fraction of the grid.';
      hints = [`Include scores equal to ${t}.`,'Tally a few rows and scale by the total number of rows.'];
    } else {
      truth = mean; text = Q_TEXT.mean; bsd = 0.5 + 0.1 * sd;
      how = 'Take a few equal-length rows. Use a convenient round score as an anchor, sum the deviations, then divide by the number of scores checked and add the anchor back.';
      why = 'Averaging small deviations is quicker than adding the full scores. Include rows from several parts of the grid.';
      hints = ['Estimate a typical score as an anchor.', 'Find the average deviation from the anchor in a few rows, then add it to the anchor.'];
    }
    bsd = Number(bsd.toPrecision(2));
    return ivItem(fam, rng, difficulty, {
      text, truth, unit: kind === 'above' ? 'scores' : 'points',
      visual: { type: 'valuegrid', cols: COLS, values, caption: '200 test scores', label: 'A grid of 200 test scores' },
      coach: { exact: false, belief: { kind: 'normal', sd: bsd }, note: 'Estimate from a sample of rows, then leave room for sampling error.' },
      steps: [
        { say: how, why },
        { say: `Exact value: ${Number.isInteger(truth) ? truth : truth.toFixed(3)} (spread of the scores: sd ≈ ${sd.toFixed(1)}).`, why: 'Computed from all 200 values with the stated definition.' },
      ],
      hints,
      params: { scenario: kind, values, ...extra },
    });
  },
  // Independent check: counting-based definitions instead of a sorted array.
  verify(item) {
    const v = item.prompt.visual.values, P = item.params;
    let t;
    if (P.scenario === 'mean') t = v.reduce((a, b) => a + b, 0) / v.length;
    else if (P.scenario === 'above') t = v.filter((x) => x >= P.threshold).length;
    else {
      const kth = (k) => { for (let c = 1; c <= 99; c++) if (v.filter((x) => x <= c).length >= k) return c; return null; };
      t = P.scenario === 'median' ? (kth(100) + kth(101)) / 2 : kth(Math.ceil((P.p / 100) * v.length));
    }
    return { ok: Math.abs(t - item.truth) < 1e-9 && v.length === 200, detail: `recomputed ${t}, item ${item.truth}` };
  },
  lesson: {
    purpose: 'A reported item shows 200 scores and asks for a statistic. Nobody can sort 200 numbers in a minute; counting against a trial value is fast.',
    anchor: 'The median is the middle value when sorted. The change: instead of sorting, count how many fall below a guess and move the guess.',
    steps: [
      { say: 'Pick a trial value and count how many of a few rows fall at or below it.', why: 'The fraction below a value is its empirical CDF; percentiles invert it.' },
      { say: 'Scale to 200 and adjust the trial value up or down.', why: 'Two or three trials pin down a percentile to a couple of points.' },
      { say: 'Width: a few points for medians and means, more for extreme percentiles.', why: 'Tails are sparser, so sampling error is larger there.' },
    ],
    predict: { question: 'In a sample of 40 of the 200 scores, 34 are at or below 72. Does this prove the population\'s 90th percentile is above 72?', answer: 'No. The sample suggests looking above 72, but the other 160 scores can change the fraction. Sampling supports an estimate with uncertainty, not an exact population claim.' },
    rule: 'Percentile = smallest value with at least p% at or below; find it by counting against trial values.',
    contrast: 'Mean versus median: a long upper tail pulls the mean above the median. Check the definition asked.',
    edge: 'Ties are common with integer scores, so neighbouring percentiles can share a value.',
  },
};
export default fam;
