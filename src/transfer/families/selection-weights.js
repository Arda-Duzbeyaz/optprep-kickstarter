import { rankItem, retry, agreeRank } from '../../sections/ll/lib.js';
import { q } from '../../sections/bto/lib.js';
export const SELECTION_TASKS = ['population', 'weighted', 'repeated'];
const ID = 'selection-weights';
const fam = {
  id: ID, section: 'll', title: 'Selection weights and repeated sampling',
  skill: 'Distinguish uniform people, uniform groups, explicit weights and shared-group sampling', levels: [2, 3, 4],
  generate(rng, { difficulty = 2, variant } = {}) {
    const task = variant || SELECTION_TASKS[difficulty - 2];
    if (!SELECTION_TASKS.includes(task)) throw new Error('unknown selection task');
    return retry(() => {
      const sizes = [rng.int(2, 6) * 10, rng.int(7, 15) * 10], successes = sizes.map((n) => rng.int(Math.ceil(n * .1), Math.floor(n * .9)));
      const weights = [rng.int(1, 4), rng.int(1, 4)], ps = sizes.map((n, i) => q(successes[i], n));
      const pooled = q(successes[0] + successes[1], sizes[0] + sizes[1]), equal = ps[0].add(ps[1]).div(q(2));
      const weighted = ps[0].mul(q(weights[0])).add(ps[1].mul(q(weights[1]))).div(q(weights[0] + weights[1]));
      const pool = {
        pooled: { text: 'Select one person uniformly from everyone in the table. That person passed.', p: pooled, how: `${successes[0] + successes[1]} passes among ${sizes[0] + sizes[1]} people.` },
        equal: { text: 'Choose a group with equal probability, then a person uniformly from that group. That person passed.', p: equal, how: `Average the within-group rates: (${ps[0]} + ${ps[1]})/2.` },
        posterior: { text: 'Select one person uniformly from all people who passed. That person is in group A.', p: q(successes[0], successes[0] + successes[1]), how: `${successes[0]} of all ${successes[0] + successes[1]} passes belong to A.` },
        weighted: { text: `Choose A with probability ${q(weights[0], weights[0] + weights[1])}, otherwise B, then a person uniformly from that group. That person passed.`, p: weighted, how: `Use group-choice weights ${weights[0]}:${weights[1]}, not group sizes.` },
        joint: { text: 'Select one person uniformly from everyone in the table. That person is in group A and passed.', p: q(successes[0], sizes[0] + sizes[1]), how: 'A passes divided by the whole population.' },
        independent: { text: 'On each of two independent selections, choose a group with equal probability then a person uniformly in it. Both passed; selections are with replacement.', p: equal.mul(equal), how: 'Independent new group choices: square the average pass probability.' },
        shared: { text: 'Choose a group with equal probability once, then select two people independently with replacement from that same group. Both passed.', p: ps[0].mul(ps[0]).add(ps[1].mul(ps[1])).div(q(2)), how: 'Square within each group, then average. The group is shared by the draws.' },
      };
      const comparator = task === 'repeated' ? rng.pick(['pooled', 'equal', 'posterior', 'joint', 'weighted']) : null;
      const keys = rng.shuffle(task === 'population' ? ['pooled', 'equal', 'posterior'] : task === 'weighted' ? ['pooled', 'weighted', 'joint'] : [comparator, 'independent', 'shared']);
      const item = rankItem(ID, rng, difficulty, {
        text: 'The table gives complete group sizes and pass counts. Each statement specifies its own random selection procedure. Rank the probabilities from most to least likely.',
        visual: { type: 'table', caption: 'Group sizes and observed passes', columns: ['Group', 'People', 'Passed'], rows: sizes.map((n, i) => [i ? 'B' : 'A', n, successes[i]]) },
        statements: keys.map((key) => pool[key]),
        compare: 'Use the selection procedure to choose weights; uniform people and uniform groups are different experiments.',
        rule: 'Averages use selection weights. Repeated draws share a group only when the statement says so.',
        anchor: 'Total probability and conditioning applied to different sampling procedures on one table.',
        hints: ['What is chosen uniformly: a person or a group?', 'For two draws, is the group chosen once or twice?'],
        params: { groups: sizes.map((n, i) => [n, successes[i]]), weights, task, statements: keys },
      });
      if (item) item.transfer = { structure: task === 'repeated' ? `${task}:${comparator}` : task, operations: task === 'population' ? ['weighted-average', 'reverse-conditioning'] : task === 'weighted' ? ['total-probability', 'joint-event'] : ['mixture-dependence', 'independence', 'total-probability'] };
      return item;
    });
  },
  // Expand individual persons/pairs from the displayed table, rather than reuse
  // the generator's rational aggregate calculation.
  verify(item) {
    const groups = item.prompt.visual.rows.map(([, n, hits]) => Array.from({ length: n }, (_, i) => i < hits));
    const all = groups.flat(), weights = item.params.weights;
    const probability = (groupWeights, twice, shared) => {
      let out = 0;
      groups.forEach((people, g) => {
        if (shared) { let pairs = 0; for (const a of people) for (const b of people) pairs += Number(a && b); out += groupWeights[g] * pairs / people.length ** 2; }
        else people.forEach((passed) => { if (passed) out += groupWeights[g] / people.length; });
      });
      return twice && !shared ? out * out : out;
    };
    const values = {
      pooled: () => all.filter(Boolean).length / all.length, equal: () => probability([.5, .5], false, false),
      posterior: () => groups[0].filter(Boolean).length / all.filter(Boolean).length,
      weighted: () => probability(weights.map((w) => w / (weights[0] + weights[1])), false, false),
      joint: () => groups[0].filter(Boolean).length / all.length,
      independent: () => probability([.5, .5], true, false), shared: () => probability([.5, .5], true, true),
    };
    return agreeRank(item, item.params.statements.map((key) => values[key]()));
  },
  lesson: { purpose: 'A table can describe different experiments.', anchor: 'Weight by the sampling mechanism.',
    steps: [{ say: 'Identify what is selected first.', why: 'It sets the weights.' }, { say: 'Condition within the group, then average.', why: 'Total probability combines the pieces.' }],
    predict: { question: 'Does uniform group selection make every person equally likely?', answer: 'Only if group sizes are equal.' }, rule: 'Choose weights from the experiment.' },
};
export default fam;
