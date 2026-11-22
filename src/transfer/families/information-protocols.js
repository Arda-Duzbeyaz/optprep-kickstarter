// Additional training only: the observation mechanism changes the conditional event.
import { mcqItem, agree, q, table, commonDenominator } from '../../sections/bto/lib.js';
export const PROTOCOLS = ['first-red', 'any-red', 'random-red', 'noisy-red'];
const ID = 'information-protocols';
const fam = {
  id: ID, section: 'bto', title: 'How was the information obtained?',
  skill: 'Condition on the actual observation process', levels: [2, 3, 4],
  generate(rng, { difficulty = 2, variant } = {}) {
    const protocol = variant || rng.pick(difficulty === 2 ? PROTOCOLS.slice(0, 2) : difficulty === 3 ? PROTOCOLS.slice(0, 3) : PROTOCOLS);
    if (!PROTOCOLS.includes(protocol)) throw new Error('unknown observation protocol');
    const r = rng.int(2, 7), b = rng.int(2, 8), n = r + b;
    const replacement = difficulty === 2 || rng.chance(.5);
    const sensitivity = rng.pick([70, 80, 90]), falsePositive = rng.pick([10, 20, 30]);
    const red = q(r, n), both = red.mul(q(r - Number(!replacement), n - Number(!replacement)));
    const noRed = q(b, n).mul(q(b - Number(!replacement), n - Number(!replacement)));
    const observed = protocol === 'any-red' ? q(1).sub(noRed) : protocol === 'noisy-red'
      ? red.mul(q(sensitivity, 100)).add(q(1).sub(red).mul(q(falsePositive, 100))) : red;
    const numerator = protocol === 'noisy-red' ? both.mul(q(sensitivity, 100)) : both;
    const value = numerator.div(observed);
    const remaining = Number(!replacement);
    const secondRed = `${r-remaining}/${n-remaining}`;
    const hit = q(sensitivity, 100), falseAlarm = q(falsePositive, 100);
    const redPair = `${r}/${n} × ${secondRed}`;
    const matchingReport = protocol === 'noisy-red' ? `${redPair} × ${hit}` : redPair;
    const reportTerm = {
      'first-red': `${r}/${n}`,
      'random-red': `${r}/${n}`,
      'any-red': `1 − ${b}/${n} × ${b-remaining}/${n-remaining}`,
      'noisy-red': `${r}/${n} × ${hit} + ${b}/${n} × ${falseAlarm}`,
    }[protocol];
    const direct = protocol === 'first-red' || protocol === 'random-red';
    const { left, right, denominator } = commonDenominator(numerator, observed);
    const integerRatio = direct ? secondRed : `${left}/${right}`;
    const reduction = integerRatio===value.toString() ? integerRatio : `${integerRatio} = ${value}`;
    const shortcut = direct ? `Cancel ${r}/${n}. The other draw is red with probability ${secondRed}.`
      : `Write the joint and report probabilities over ${denominator}, then cancel it.`;
    const notice = {
      'first-red': 'You are told that the first token drawn is red.',
      'any-red': 'A checker inspects both tokens and reports "at least one is red" if and only if that is true. You hear that report.',
      'random-red': 'Without looking at their colours, an observer chooses one of the two drawn tokens uniformly and shows it to you. It is red.',
      'noisy-red': `Without looking at their colours, a sensor chooses one of the two drawn tokens uniformly. It reports red with probability ${sensitivity}% for a red token and ${falsePositive}% for a blue token, independently of everything else given that token’s colour. It reports red.`,
    }[protocol];
    const item = mcqItem(ID, rng, difficulty, {
      text: `A bag contains ${r} red and ${b} blue tokens. Two tokens are drawn ${replacement ? 'with replacement (return the first before drawing the second)' : 'without replacement'}. ${notice} What is the probability that both drawn tokens are red?`, value,
      distractors: [
        { value: both, misconception: 'Ignored the observation and used the unconditional probability.' },
        { value: red, misconception: 'Used the original red fraction without checking the observation or replacement rule.' },
        { value: both.div(q(1).sub(noRed)), misconception: 'Conditioned on existence rather than the specified observation mechanism.' },
        { value: q(1).sub(value), misconception: 'Answered the complement.' },
        { value: q(1, 2), misconception: 'Treated descriptions of possibilities as equally likely outcomes.' },
      ],
      steps: [
        { say: 'Divide the probability of both reds and the report by the probability of the report.',
          why: protocol === 'any-red' ? 'The report excludes only the two-blue outcome.' : protocol === 'noisy-red' ? 'The sampled token can trigger a true red report or a false one. Two reds produce a red report at the stated sensitivity.' : 'The first or uniformly shown token is red with the original red probability.',
          math: `P(both red | report) = (${matchingReport}) / (${reportTerm})` },
        { say: shortcut, why: direct ? 'Revealing either position uniformly leaves the other draw with the same conditional distribution.' : 'Multiplying top and bottom by the same value leaves their ratio unchanged.',
          math: direct ? `P(other red | shown red) = ${reduction}` : `(${numerator}) / (${observed}) = ${reduction}` },
      ],
      rule: 'P(target | observation) = P(target and observation)/P(observation). Model how information was obtained.',
      anchor: 'Conditional probability with explicit observation likelihoods.',
      hints: ['Is the message equally likely for every pair?', 'Compute its probability for each possible colour pair.'],
      fast: `${shortcut} The exact answer is ${value}.`,
      check: 'Random-token and first-token reports agree by exchangeability; an existence report weights mixed pairs differently.',
      picture: table(['Quantity', 'Probability'], [['Both red', both], ['Observation', observed], ['Both and observation', numerator]], 'Use the actual report as the conditioning event.'),
      data: { protocol, replacement, r, b, sensitivity, falsePositive },
    });
    item.transfer = { structure: `${replacement ? 'replace' : 'no-replace'}:${protocol}`, operations: protocol === 'noisy-red' ? ['conditioning', 'total-probability', 'observation-error'] : ['conditioning', replacement ? 'independence' : 'dependent-sampling', 'observation-selection'] };
    return item;
  },
  // Independent labelled-token enumeration rather than the aggregate formulas.
  verify(item) {
    const p = item.params, n = p.r + p.b; let denominator = 0, numerator = 0;
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      if (!p.replacement && a === b) continue;
      const first = a < p.r, second = b < p.r;
      let weight;
      if (p.protocol === 'first-red') weight = Number(first);
      else if (p.protocol === 'any-red') weight = Number(first || second);
      else { const report = (red) => p.protocol === 'random-red' ? Number(red) : (red ? p.sensitivity : p.falsePositive) / 100; weight = (report(first) + report(second)) / 2; }
      denominator += weight; if (first && second) numerator += weight;
    }
    return agree(item, numerator / denominator);
  },
  lesson: { purpose: 'Similar messages can represent different evidence.', anchor: 'Condition on the event observed.',
    steps: [{ say: 'Model the report.', why: 'Its sampling process determines likelihoods.' }, { say: 'Divide joint by marginal probability.', why: 'This is conditioning.' }],
    predict: { question: 'Is a random red reveal the same evidence as at least one red?', answer: 'No; mixed pairs receive different report weights.' }, rule: 'Joint target and report divided by report probability.' },
};
export default fam;
