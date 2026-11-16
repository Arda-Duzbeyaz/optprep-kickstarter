// Monty Hall with n doors: a knowing host versus a host who opens doors at random.
import { mcqItem, agree, q, table } from '../lib.js';

const ID = 'monty-hall';

export default {
  id: ID,
  section: 'bto',
  title: 'Monty Hall and the host\'s knowledge',
  skill: 'A host who knowingly avoids the car moves probability onto the other doors; a random host does not',
  levels: [2, 3],

  generate(rng, { difficulty = 2 } = {}) {
    const n = difficulty === 2 ? rng.int(3, 12) : rng.int(4, 7);
    const m = difficulty === 2 ? n - 2 : rng.int(1, n - 2);
    const variant = difficulty === 2 ? rng.pick(['switch', 'switch', 'stay']) : rng.pick(['switch', 'switch', 'random']);
    const closedOthers = n - m - 1;
    let value, text, steps;
    const setup = `There are ${n} doors: one hides a car, the rest hide goats. You pick door 1.`;
    if (variant === 'random') {
      value = q(1, n - m);
      text = `${setup} The host, who does NOT know where the car is, opens ${m === 1 ? 'one of the other doors' : `${m} of the other doors`} at random, and ${m === 1 ? 'it shows a goat' : 'they all show goats'}. You switch to one particular unopened door other than yours. What is the probability that you win the car?`;
      steps = [
        { say: 'The host\'s choice did not depend on the car, so seeing goats is just information that those doors are empty.', why: 'A random reveal is like the doors being opened by chance.' },
        { say: `Given that, the car is equally likely behind any of the ${n - m} unopened doors.`, why: 'By symmetry, nothing distinguishes your door from the other closed doors.' },
        { say: `P = 1/${n - m}${n - m === 2 ? ' = 1/2' : ''}.`, why: 'Uniform over the unopened doors.' },
      ];
    } else if (variant === 'stay') {
      value = q(1, n);
      text = `${setup} The host, who knows where the car is, opens ${m === 1 ? 'another door' : `${m} other doors`} showing ${m === 1 ? 'a goat' : 'goats'} and offers a switch. You stay. What is the probability that you win the car?`;
      steps = [
        { say: `Your door had probability 1/${n} when you picked it.`, why: 'The car is placed uniformly.' },
        { say: 'A goat reveal is guaranteed by this policy, so staying wins precisely when your original pick was the car.', why: 'We are averaging over reveals, not conditioning on the identities of particular opened doors. Those identities could be informative under a biased host policy.' },
        { say: `P(stay wins) = 1/${n}.`, why: 'Unchanged prior.' },
      ];
    } else {
      value = q(n - 1, n * closedOthers);
      text = `${setup} The host, who knows where the car is, opens ${m === 1 ? 'another door' : `${m} other doors`} showing ${m === 1 ? 'a goat' : 'goats'}. You switch to ${closedOthers === 1 ? 'the remaining closed door' : 'one of the other closed doors, chosen at random'}. What is the probability that you win the car?`;
      steps = [
        { say: `Your initial pick is wrong with probability ${n-1}/${n}.`, why: 'The host always reveals goats; we are not given a specific labelled reveal to condition on.' },
        { say: `If your initial pick is wrong, exactly one of the ${closedOthers} other closed doors has the car.`, why: 'A uniformly random switch selects that car with probability 1/'+closedOthers+', regardless of how the knowing host chose the goats.' },
        { say: `P = (${n - 1}/${n}) / ${closedOthers} = ${value} ≈ ${value.toNumber().toFixed(3)}.`, why: 'Multiply the chance the car is elsewhere by the chance your random switch selects it. Labelled doors need not have identical posteriors under an unspecified host policy.' },
      ];
    }
    const distractors = [
      { value: q(1, n - m), misconception: 'Treated all unopened doors as equally likely. A host who knowingly avoids the car does not reset the odds.' },
      { value: q(1, n), misconception: 'Assumed switching cannot beat the original 1/n: that is the staying probability.' },
      { value: q(n - 1, n), misconception: 'Gave the switch all of the other doors\' probability. With several closed doors left, you move to only one of them.' },
      { value: 0.5, misconception: 'Reasoned "two outcomes, car or goat, so 1/2".' },
      { value: q(1 + m, n), misconception: 'Used the number of opened doors instead of conditioning on whether the first pick was wrong and then selecting uniformly among the remaining alternatives.' },
    ];
    distractors.push(variant === 'stay'
      ? { value: 0, misconception: 'Believed staying can never win. It wins whenever your first pick was the car: 1/n of the time.' }
      : { value: 1, misconception: 'Believed switching always wins. It wins only when your first pick was a goat, and then only if you land on the car.' });
    if (variant === 'random') distractors.unshift({ value: q(n - 1, n * closedOthers), misconception: 'Used the knowing-host answer. A host who opens doors at random, and happens to show goats, does not move probability onto the other doors.' });
    const random = variant === 'random';
    const mine = random ? q(1, n - m) : q(1, n), other = random ? q(1, n - m) : q(n - 1, n * closedOthers);
    const picture = table(['Strategy / event', 'Probability'], [
      ['Stay with original pick', mine.toString()],
      ['Car elsewhere among closed alternatives', q(1).sub(mine).toString()],
      [`Uniform random choice among ${closedOthers} alternatives wins`, other.toString()],
    ], random
      ? `A host who opens doors blindly and happens to show goats only eliminates them: the ${n - m} unopened doors stay equal at 1/${n - m} each.`
      : `These are strategy win rates averaged over the host's reveals. The uniform random switch has probability ${other}; this does not assert identical posteriors for every labelled door under a biased host policy.`);
    const fast = random ? `Blind host: the ${n - m} unopened doors are equal, 1/${n - m}.` : variant === 'stay' ? `Staying wins on the original car pick: 1/${n}.` : `Initially wrong (${n-1}/${n}), then choose the car among ${closedOthers} alternatives: ${value}.`;
    const check = `The original-pick and elsewhere cases add to 1. ${random ? 'A blind uniform reveal makes every unopened door equally likely.' : `A random switch wins with (1−1/${n})/${closedOthers}. A posterior after particular door identities are revealed would require the host's selection policy.`}`;
    return mcqItem(ID, rng, difficulty, {
      value, text, distractors, steps, picture, fast, check,
      rule: 'Knowing host, averaged over reveals: stay wins 1/n; a uniform switch among k alternatives wins (n−1)/(nk). A blind uniform reveal conditioned on goats leaves all unopened doors equally likely.',
      anchor: 'Conditioning on new information (the opened doors), with one change: what the information means depends on whether the host could have revealed the car.',
      hints: ['Could the host have shown the car? Are particular door identities specified?', 'Condition on whether your initial choice was correct.', 'If the car is elsewhere, a uniform switch picks it with probability 1/(number of alternatives).'],
      data: { n, m, variant },
    });
  },

  // Independent check: enumerate car position, the host's allowed door sets, and your switch choice.
  verify(item) {
    const { n, m, variant } = item.params;
    const others = [...Array(n - 1).keys()].map((i) => i + 1); // door 0 is yours
    const subsets = (arr, k) => (k === 0 ? [[]] : arr.flatMap((x, i) => subsets(arr.slice(i + 1), k - 1).map((s) => [x, ...s])));
    const opens = subsets(others, m);
    let win = 0, tot = 0;
    for (let car = 0; car < n; car++) {
      const allowed = variant === 'random' ? opens : opens.filter((s) => !s.includes(car));
      for (const s of allowed) {
        const w = 1 / n / allowed.length;
        if (variant === 'random' && s.includes(car)) continue; // condition: all revealed doors show goats
        if (variant === 'stay') { tot += w; if (car === 0) win += w; continue; }
        const closed = others.filter((d) => !s.includes(d));
        for (const d of closed) { tot += w / closed.length; if (d === car) win += w / closed.length; }
      }
    }
    return agree(item, win / tot, 1e-12);
  },

  lesson: {
    purpose: 'Monty Hall tests whether you can tell informative evidence from uninformative evidence. The same "goat revealed" means different things depending on how it was chosen.',
    anchor: 'Bayes updating with one change: the likelihood of the evidence depends on the host\'s rule, not only on where the car is.',
    steps: [
      { say: 'Ask: could the host\'s action have come out differently depending on where the car is?', why: 'Evidence that is certain under every hypothesis carries no information.' },
      { say: 'Knowing host: averaged over reveals, staying wins 1/n and a uniform switch among k alternatives wins (n−1)/(nk).', why: 'The car is elsewhere initially with chance (n−1)/n. If it is, a uniform choice among k doors finds it with chance 1/k. Specific labelled posteriors require a host selection policy.' },
      { say: 'Random host who happens to show goats: every unopened door is equally likely.', why: 'His choice ignored the car, so the reveal is plain elimination.' },
    ],
    predict: { question: '100 doors, knowing host opens 98 goats. Switch: roughly what chance?', answer: '99/100. Your door kept 1/100 and the one other closed door collected the rest.' },
    edge: 'With a random host, a reveal of the car ends the game; conditioning on "all goats" is what makes the doors symmetric.',
    rule: 'Knowing host: switch = (n−1)/(n·k) for k other closed doors. Random host: 1/(number of unopened doors).',
    contrast: 'Same reveal, different rule: knowing host → switch wins 2/3 (3 doors); random host → 1/2.',
  },
};
