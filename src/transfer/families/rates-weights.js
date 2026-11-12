import { ivItem } from '../../sections/iv/lib.js';
export const RATE_LEVELS = { 2: ['equal-time', 'mixture', 'reverse-percent'], 3: ['equal-distance', 'compound-change', 'work-together'], 4: ['unequal-distance', 'dilute'] };
const fam = {
  id: 'rates-weights', section: 'iv', title: 'Rates, weights and changing bases',
  skill: 'Determine what is equal or conserved before calculating', levels: [2, 3, 4],
  generate(rng, { difficulty = 2, variant } = {}) {
    const scenario = variant || rng.pick(RATE_LEVELS[difficulty]);
    const v1 = rng.int(3, 7) * 10, v2 = rng.int(8, 12) * 10, d1 = rng.int(2, 5) * 30, d2 = rng.int(6, 9) * 30;
    const x = rng.int(2, 8) * 10, y = rng.int(2, 8) * 10, a = rng.int(1, 4) * 5, b = rng.int(5, 9) * 5;
    const base = rng.int(4, 16) * 25, up = rng.pick([10, 20, 25, 40]), down = rng.pick([10, 20, 25, 40]);
    let text, truth, unit, how, check, params, operations;
    if (scenario === 'equal-time') {
      truth = (v1 + v2) / 2; unit = 'km/h'; params = { v1, v2 };
      text = `A vehicle travels at ${v1} km/h for one hour, then at ${v2} km/h for one hour, with no stop. What is its average speed for the complete journey in km/h?`;
      how = `Distance ${v1 + v2} km divided by 2 hours gives ${truth}.`; check = 'Equal times give equal speed weights.'; operations = ['rate', 'equal-time-weighting'];
    } else if (scenario === 'equal-distance' || scenario === 'unequal-distance') {
      const second = scenario === 'equal-distance' ? d1 : d2;
      truth = (d1 + second) / (d1 / v1 + second / v2); unit = 'km/h'; params = { v1, v2, d1, d2: second };
      text = `A vehicle covers ${d1} km at ${v1} km/h, then ${second} km at ${v2} km/h, with no stop. What is its average speed for the complete journey in km/h?`;
      how = `Total time = ${d1}/${v1} + ${second}/${v2} hours. Speed = ${d1 + second} divided by that time.`;
      check = 'Use total distance divided by total time; the answer lies between the speeds.'; operations = ['rate', 'reciprocal', scenario === 'equal-distance' ? 'equal-distance-weighting' : 'unequal-distance-weighting'];
    } else if (scenario === 'mixture') {
      truth = (x * a + y * b) / (x + y); unit = '%'; params = { x, y, a, b };
      text = `Mix ${x} litres of a ${a}% salt solution by volume with ${y} litres of a ${b}% solution. Assume volumes add and no salt is lost. What percentage of the mixture is salt?`;
      how = `Salt = (${x}×${a} + ${y}×${b})/100 litres. Divide by ${x + y} litres and multiply by 100.`;
      check = 'The result lies between the input percentages, weighted by volume.'; operations = ['weighted-average', 'conservation'];
    } else if (scenario === 'dilute') {
      truth = y * (b / a - 1); unit = 'litres'; params = { volume: y, initial: b, target: a };
      text = `A tank holds ${y} litres of a ${b}% salt solution by volume. How many litres of pure water must be added to reduce it to ${a}%? Assume volumes add and no salt is lost.`;
      how = `Salt stays ${y}×${b}/100 litres. Required total volume = ${y}×${b}/${a}; subtract ${y}.`;
      check = 'Water increases total volume but leaves salt amount unchanged.'; operations = ['conservation', 'inverse-proportion', 'solve-equation'];
    } else if (scenario === 'reverse-percent') {
      truth = base; unit = 'euros'; params = { final: base * (1 + up / 100), up };
      text = `After a ${up}% increase, an item costs €${params.final.toFixed(2)}. What was its price in euros before the increase?`;
      how = `Original × ${1 + up / 100} = ${params.final.toFixed(2)}; divide by ${1 + up / 100}.`;
      check = 'Apply the increase to recover the displayed final price.'; operations = ['changing-base', 'solve-equation'];
    } else if (scenario === 'compound-change') {
      truth = base * (1 + up / 100) * (1 - down / 100); unit = 'euros'; params = { base, up, down };
      text = `An item costs €${base}. The price rises by ${up}%, then falls by ${down}% of the increased price. What is its final price in euros?`;
      how = `${base} × ${1 + up / 100} × ${1 - down / 100}.`; check = 'The decrease uses the new base; equal percentage rises and falls do not cancel.'; operations = ['changing-base', 'multiplication'];
    } else if (scenario === 'work-together') {
      truth = x * y / (x + y); unit = 'minutes'; params = { x, y };
      text = `One machine completes a fixed job in ${x} minutes and another in ${y} minutes. At constant rates, working together without interference, how many minutes do they take for one job?`;
      how = `Combined rate = 1/${x} + 1/${y} jobs per minute; take its reciprocal.`;
      check = 'Working together must be faster than either machine alone.'; operations = ['rate', 'reciprocal', 'addition'];
    } else throw new Error('unknown rates scenario');
    const item = ivItem(fam, rng, difficulty, {
      text, truth, unit, params: { scenario, ...params },
      coach: { exact: false, belief: { kind: 'lognormal', sd: .03 }, note: 'The inputs specify the answer. The 3% spread is an illustrative arithmetic allowance; use your own measured errors for interval width.' },
      steps: [{ say: how, why: check }, { say: `Computed value, rounded for display: ${Number(truth.toPrecision(9))} ${unit}.`, math: `answer ≈ ${Number(truth.toPrecision(9))}`, why: 'Evaluate with consistent units; use extra precision when placing a tight interval.' }],
      hints: ['What is held equal or conserved?', 'Write the relationship and its units before calculating.'],
    });
    item.transfer = { structure: scenario, operations }; return item;
  },
  // Check conservation/rate equations instead of repeating the generating expression.
  verify(item) {
    const p = item.params, v = item.truth; let residual;
    if (p.scenario === 'equal-time') residual = 2 * v - p.v1 - p.v2;
    else if (p.scenario.endsWith('distance')) residual = (p.d1 + p.d2) / v - p.d1 / p.v1 - p.d2 / p.v2;
    else if (p.scenario === 'mixture') residual = v * (p.x + p.y) - p.x * p.a - p.y * p.b;
    else if (p.scenario === 'dilute') residual = (p.volume + v) * p.target - p.volume * p.initial;
    else if (p.scenario === 'reverse-percent') residual = v + v * p.up / 100 - p.final;
    else if (p.scenario === 'compound-change') { const increased = p.base + p.base * p.up / 100; residual = v - (increased - increased * p.down / 100); }
    else if (p.scenario === 'work-together') residual = v / p.x + v / p.y - 1;
    else return { ok: false, detail: 'unknown scenario' };
    return { ok: Math.abs(residual) < 1e-7, detail: `independent equation residual ${residual}` };
  },
  fast: (p) => `Identify the ${p.scenario.replaceAll('-', ' ')} relationship; carry the units.`,
  lesson: { purpose: 'Changed relationships require different operations.', anchor: 'Use units and conservation to choose an equation.',
    steps: [{ say: 'Identify the total or conserved quantity.', why: 'It determines the equation.' }, { say: 'Use the correct weights and base.', why: 'An arithmetic average requires equal corresponding weights.' }],
    predict: { question: 'When may two speeds be averaged arithmetically?', answer: 'Equal times; equal distances require total distance over total time.' }, rule: 'Determine the relationship before calculating.' },
};
export default fam;
