import { nCr } from '../../core/combinatorics.js';
import { Q } from '../../core/rational.js';
import { mcqItem, agree, q, qpow, table } from '../../sections/bto/lib.js';
export const SOURCE_TASKS = ['all', 'count', 'next', 'source'];
const ID = 'shared-source';
const likelihood = (p, h, b) => qpow(p, h).mul(qpow(q(1).sub(p), b));
const fam = {
  id: ID, section: 'bto', title: 'One hidden source or a new source each time?',
  skill: 'Distinguish shared-source dependence and update before predicting', levels: [2, 3, 4, 5],
  generate(rng, { difficulty = 2, variant } = {}) {
    const task = variant || (difficulty === 2 ? 'all' : difficulty === 3 ? 'count' : rng.pick(['next', 'source']));
    if (!SOURCE_TASKS.includes(task)) throw new Error('unknown source task');
    const a = rng.int(1, 4), b = rng.int(6, 9), wa = rng.int(1, 4), wb = rng.int(1, 4);
    const prior = q(wa, wa + wb), pa = q(a, 10), pb = q(b, 10);
    const shared = task === 'source' || rng.chance(.5);
    const n = difficulty <= 2 ? 2 : rng.int(2, 4), k = task === 'all' ? n : rng.int(1, n - 1);
    const h = rng.int(1, difficulty === 5 ? 3 : 2), blue = difficulty === 5 ? rng.int(1, 2) : rng.int(0, 1);
    const marginal = prior.mul(pa).add(q(1).sub(prior).mul(pb));
    const la = likelihood(pa, h, blue), lb = likelihood(pb, h, blue);
    const evidence = prior.mul(la).add(q(1).sub(prior).mul(lb)), posterior = prior.mul(la).div(evidence);
    let value;
    if (task === 'all' || task === 'count') {
      const oneOrder = shared ? prior.mul(likelihood(pa, k, n - k)).add(q(1).sub(prior).mul(likelihood(pb, k, n - k))) : likelihood(marginal, k, n - k);
      value = oneOrder.mul(new Q(nCr(n, k), 1n));
    } else value = task === 'source' ? posterior : shared ? posterior.mul(pa).add(q(1).sub(posterior).mul(pb)) : marginal;
    const history = `${'R'.repeat(h)}${'B'.repeat(blue)}`;
    const setup = `Bag A has ${a} red and ${10 - a} blue tokens; bag B has ${b} red and ${10 - b} blue tokens. Each bag choice selects A with probability ${prior}, otherwise B. Each drawn token is returned immediately after its colour is recorded. ${shared ? 'One bag is chosen secretly once and supplies every draw.' : 'A new independent bag choice is made before every draw.'}`;
    const question = task === 'all' ? `What is the probability the next ${n} draws are all red?` : task === 'count' ? `What is the probability of exactly ${k} red tokens in the next ${n} draws?` : `The recorded colours so far, in order, are ${history} (R = red, B = blue). ${task === 'source' ? 'What is the probability the chosen bag is A?' : 'What is the probability the next token is red?'}`;
    const steps = task === 'all' || task === 'count' ? [
      { say: shared ? 'Compute the requested event within each bag, then weight the two probabilities.' : `Each draw has red probability ${marginal} and independent bag choices.`, why: shared ? 'Averaging before taking powers erases dependence through the shared bag.' : 'Fresh independent sources do not link different draws.' },
      { say: `P = ${value}.`, why: task === 'count' ? `Include C(${n},${k}) possible colour orders.` : 'All requested draws must be red.' },
    ] : [
      { say: shared ? `Likelihood of ${history}: A ${la}; B ${lb}. Posterior weight of A = ${posterior}.` : 'The earlier colours concern earlier independent bag choices.', why: shared ? 'Use prior times likelihood, then normalise.' : 'Earlier choices do not update the source of the next independent choice.' },
      { say: `Requested probability = ${value}.`, why: task === 'source' ? 'The requested answer is the posterior weight.' : shared ? 'Average next-draw red probabilities with posterior weights.' : 'Use the original mixture for a new bag choice.' },
    ];
    const item = mcqItem(ID, rng, difficulty, {
      text: `${setup} ${question}`, value,
      distractors: [
        { value: marginal, misconception: 'Used the one-draw prior marginal without checking the target or shared-source evidence.' },
        { value: qpow(marginal, n), misconception: 'Raised the average chance to a power despite shared dependence or a count target.' },
        { value: prior, misconception: 'Did not update the original source weights.' },
        { value: la.div(la.add(lb)), misconception: 'Used equal source priors instead of the stated ones.' },
        { value: q(1).sub(value), misconception: 'Answered the complement.' },
      ], steps,
      rule: 'Condition within a shared source before averaging; update it before predicting. Fresh sources give independent marginal trials.',
      anchor: 'Total probability, Bayes and conditional independence in similar-looking experiments.',
      hints: ['Is the source chosen once or repeatedly?', 'Does the observed history concern the source of the next draw?'],
      fast: `${shared ? 'Shared' : 'Fresh'} source; ${task === 'next' || task === 'source' ? 'check the source weights after the history' : 'compute the event before averaging'}: ${value}.`,
      check: 'A posterior predictive probability lies between the bags’ red fractions. A new independent source is unaffected by earlier colours.',
      picture: table(['Source', 'Prior', 'P(red)'], [['A', prior, pa], ['B', q(1).sub(prior), pb]], 'The order of conditioning and mixing matters.'),
      data: { task, shared, a, b, wa, wb, n, k, h, blue },
    });
    item.transfer = { structure: `${shared ? 'shared' : 'fresh'}:${task}:${task === 'next' || task === 'source' ? blue ? 'mixed-history' : 'red-history' : 'count'}`,
      operations: [shared ? 'mixture-dependence' : 'independence', ...(task === 'count' ? ['counting'] : []), ...(task === 'source' ? ['bayes'] : task === 'next' && shared ? ['bayes', 'posterior-prediction'] : ['total-probability'])] };
    return item;
  },
  // Independent expansion of source choices and colour outcomes.
  verify(item) {
    const p = item.params, history = [...Array(p.h).fill(1), ...Array(p.blue).fill(0)];
    const length = p.task === 'all' || p.task === 'count' ? p.n : history.length + Number(p.task === 'next');
    let numerator = 0, denominator = 0;
    const visit = (colours, source, weight) => {
      if (colours.length === length) {
        if (p.task === 'next' || p.task === 'source') {
          if (!history.every((c, i) => colours[i] === c)) return;
          denominator += weight; if (p.task === 'source' ? source === 0 : colours.at(-1) === 1) numerator += weight;
        } else { denominator += weight; if (colours.reduce((x, y) => x + y, 0) === p.k) numerator += weight; }
        return;
      }
      const choices = p.shared && source != null ? [[source, 1]] : [[0, p.wa / (p.wa + p.wb)], [1, p.wb / (p.wa + p.wb)]];
      for (const [s, sw] of choices) { const red = (s === 0 ? p.a : p.b) / 10; visit([...colours, 1], s, weight * sw * red); visit([...colours, 0], s, weight * sw * (1 - red)); }
    };
    visit([], null, 1); return agree(item, numerator / denominator);
  },
  lesson: { purpose: 'A shared hidden cause creates dependence.', anchor: 'Condition first, then average.',
    steps: [{ say: 'Identify shared source choices.', why: 'This determines dependence.' }, { say: 'Weight conditional results by priors or posteriors.', why: 'Total probability combines the models.' }],
    predict: { question: 'Do red draws change the weight of one fixed hidden bag?', answer: 'Yes; update before predicting another draw from it.' }, rule: 'A mixture of powers differs from a power of the mixture.' },
};
export default fam;
