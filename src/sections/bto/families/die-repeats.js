// One die, several throws: distinguish a named target, global matches and neighbours.
import { Q } from '../../../core/rational.js';
import { nPr, nCr } from '../../../core/combinatorics.js';
import { mcqItem, agree, qpow, q, sequences, table } from '../lib.js';

const ID = 'die-repeats';
const words = ['', 'one', 'two', 'three', 'four', 'five'];

// Shared discrete input domain for generation and exhaustive fresh-question selection.
// Answers are independently checked by enumerating outcomes below.
export function repeatInputs(difficulty) {
  const kinds = difficulty === 1 ? ['allDiff', 'allSame', 'allTarget']
    : ['allDiff', 'noAdjacent', 'someRepeat', 'adjacentRepeat', 'returnFirst'];
  const sides = difficulty === 1 ? [4, 6, 8] : [4, 6, 8, 10, 12];
  return kinds.flatMap((kind) => sides.flatMap((k) =>
    Array.from({ length: difficulty === 1 ? 2 : k > 6 ? 2 : 3 }, (_, i) => ({ kind, k, n: (difficulty === 1 ? 2 : 3) + i }))
      .flatMap((input) => kind === 'allTarget' ? Array.from({ length: k }, (_, i) => ({ ...input, face: i + 1 })) : [input])));
}

function build(kind, n, k, face) {
  const total = k ** n;
  const die = k === 6 ? 'one die' : `a fair ${k}-sided die`;
  const all = n === 2 ? 'both' : `all ${words[n]}`;
  const allDiff = new Q(nPr(k, n), BigInt(total));
  const allSame = q(1, k ** (n - 1));
  const noAdj = qpow(q(k - 1, k), n - 1);
  const repeat = q(1).sub(allDiff);
  const f = (x) => x.toString();
  const chain = Array.from({ length: n }, (_, i) => `${k - i}/${k}`).join(' × ');
  // Allowed faces throw by throw: the picture behind every chained product here.
  const allowed = (perThrow, caption) => table(['Throw', 'Faces allowed', 'Factor'], perThrow.map((a, i) => [i + 1, a, `${a}/${k}`]), caption);
  const freeThen = (x) => Array.from({ length: n }, (_, i) => (i === 0 ? k : x));
  const shrinking = Array.from({ length: n }, (_, i) => k - i);
  if (kind === 'allTarget') {
    const target = face ?? (k === 6 ? 6 : 1), value = q(1, total);
    return {
      value,
      text: `You throw ${die} ${words[n]} times. What is the probability that every throw shows ${target}?`,
      distractors: [
        { value: allSame, misconception: 'Allowed any common face. Here the face is specified, so the first throw must also hit the target.' },
        { value: q(1, k), misconception: 'Counted only one throw. Every throw must hit the named face.' },
        { value: q(n, k), misconception: 'Added the chances instead of multiplying independent requirements.' },
        { value: q(1).sub(qpow(q(k - 1, k), n)), misconception: 'Computed at least one target face, rather than every throw hitting it.' },
      ],
      steps: [
        { say: `The target ${target} is specified before the first throw, so each throw has exactly 1 allowed face out of ${k}.`, why: 'Unlike "all the same", the first throw is not free.' },
        { say: `P = (1/${k})^${n} = ${value}.`, why: `Exactly one of the ${total} ordered sequences works.` },
      ],
      hints: ['Is the face chosen before the throws, or by the first throw?', `The first throw must also show ${target}.`, `Multiply 1/${k} for all ${n} throws.`],
      fast: `A named face on every throw: (1/${k})^${n} = ${value}.`,
      check: `Any common face has probability ${allSame}; specifying which face divides that by ${k}.`,
      picture: allowed(Array(n).fill(1), `All ${n} throws have one allowed face, including throw 1. Product ${value}.`),
    };
  }
  if (kind === 'adjacentRepeat') {
    const value = q(1).sub(noAdj);
    return {
      value,
      text: `You throw ${die} ${words[n]} times. What is the probability that at least one pair of consecutive throws shows the same face?`,
      distractors: [
        { value: repeat, misconception: 'Included non-consecutive matches. A repeated face separated by other faces does not necessarily satisfy this event.' },
        { value: noAdj, misconception: 'Answered no equal neighbours, the complement of the question.' },
        { value: q(n - 1, k), misconception: 'Added the neighbouring-pair probabilities; a sequence can contain more than one matching pair.' },
        { value: allSame, misconception: 'Required every throw to match, rather than at least one neighbouring pair.' },
      ],
      steps: [
        { say: 'The complement is that every throw after the first differs from its immediate predecessor.', why: 'That excludes every neighbouring match at once.' },
        { say: `P(no equal neighbours) = (${k - 1}/${k})^${n - 1} = ${noAdj}.`, why: 'The first throw is free; each later throw must avoid exactly one face.' },
        { say: `P = 1 − ${noAdj} = ${value}.`, why: 'Complement rule.' },
      ],
      hints: ['What rules out every matching neighbouring pair?', 'Require each throw to differ from the one just before it, then take the complement.'],
      fast: `1 − (${k - 1}/${k})^${n - 1} = ${value}.`,
      check: `Neighbouring matches are a subset of all repeats, so this cannot exceed P(any repeat) = ${repeat}.`,
      picture: allowed(freeThen(k - 1), `Count no equal neighbours first (${noAdj}); subtract this from 1.`),
    };
  }
  if (kind === 'returnFirst') {
    const value = q(nPr(k, n - 1), total);
    const counts = [...shrinking.slice(0, -1), 1];
    return {
      value,
      text: `You throw ${die} ${words[n]} times. What is the probability that the first ${words[n - 1]} throws all show different faces and the last throw matches the first?`,
      distractors: [
        { value: allDiff, misconception: 'Required the last throw to be new too; it must instead return to the first face.' },
        { value: q(1, k), misconception: 'Counted only the final match, ignoring the earlier distinct-face requirement.' },
        { value: q(nPr(k, n - 1), k ** (n - 1)), misconception: 'Counted the distinct prefix but omitted the final match.' },
        { value: allSame, misconception: 'Required all throws to match, but the prefix must have distinct faces.' },
      ],
      steps: [
        { say: `The first ${n - 1} throws have ${nPr(k, n - 1)} ordered distinct-face possibilities.`, why: 'Choose each new face from those not yet used.' },
        { say: 'The last throw has exactly one allowed face: the first one.', why: 'The final requirement is a match, not another new face.' },
        { say: `P = ${counts.map((c) => `${c}/${k}`).join(' × ')} = ${value}.`, why: `There are ${nPr(k, n - 1)} favourable sequences out of ${total}.` },
      ],
      hints: ['Split the distinct prefix from the final return.', 'The final throw has one allowed face, whatever the first face was.'],
      fast: `${counts.map((c) => `${c}/${k}`).join(' × ')} = ${value}.`,
      check: `The event is contained in "last matches first", probability 1/${k}; the prefix condition makes it smaller.`,
      picture: allowed(counts, `Use shrinking choices for the prefix, then exactly 1 choice for the final return. Product ${value}.`),
    };
  }
  if (kind === 'allDiff') return {
    value: allDiff,
    text: n === 2
      ? `You throw ${die} two times. What is the probability that the second throw shows a different face from the first?`
      : `You throw ${die} ${words[n]} times. What is the probability that all ${words[n]} throws show different faces?`,
    distractors: [
      { value: noAdj, misconception: 'Only required each throw to differ from the one just before it. "All different" means every throw must avoid every earlier face.' },
      { value: q(1).sub(allSame), misconception: 'Treated "all different" as the complement of "all the same". Many sequences are neither, for example 1, 1, 2.' },
      { value: new Q(nCr(k, n), BigInt(total)), misconception: `Counted sets of faces (C(${k},${n})) instead of ordered sequences: each set can appear in ${n}! orders.` },
      { value: qpow(q(1, k), n - 1), misconception: 'Computed "all the same" instead of "all different".' },
      { value: qpow(q(k - 1, k), n), misconception: `Applied the factor ${k - 1}/${k} to every throw, including the first, which cannot clash with anything.` },
      { value: 0.5, misconception: 'Treated "different" and "same" as two equally likely outcomes. Count the faces allowed at each throw instead.' },
    ],
    steps: [
      { say: `There are ${k}^${n} = ${total} equally likely ordered sequences.`, why: `Each throw is independent with ${k} equally likely faces.` },
      { say: `Favourable: ${Array.from({ length: n }, (_, i) => k - i).join(' × ')} = ${nPr(k, n)}.`, why: 'Each new throw must avoid every face already used, so the number of allowed faces drops by one per throw.' },
      { say: `P = ${nPr(k, n)}/${total} = ${f(allDiff)} ≈ ${allDiff.toNumber().toFixed(3)}.`, why: 'Favourable over total for equally likely outcomes.' },
    ],
    hints: ['Fix the first throw. How many faces are still allowed for the second?', `Multiply the allowed-face fractions: ${chain}.`, `Product: ${f(allDiff)}.`],
    fast: `One factor per throw, each one face fewer: ${chain} = ${f(allDiff)}.`,
    check: n > 2
      ? `All different is stricter than "no equal neighbours", (${k - 1}/${k})^${n - 1} = ${f(noAdj)}, so the answer must sit below that.`
      : `With two throws, "different" fails only when the second copies the first: 1 − 1/${k} = ${f(allDiff)}.`,
    picture: allowed(shrinking, `Each throw must avoid every face already used, so the allowed faces drop by one per throw. Multiply the factors: ${f(allDiff)}.`),
  };
  if (kind === 'allSame') return {
    value: allSame,
    text: `You throw ${die} ${words[n]} times. What is the probability that ${all} throws show the same face?`,
    distractors: [
      { value: q(1, total), misconception: `Required one specific face (for example all ${k === 6 ? 'sixes' : 'ones'}). Any face works, so multiply 1/${total} by ${k}.` },
      { value: q(1).sub(allDiff), misconception: 'Answered "at least two throws match", a much weaker event than "all match".' },
      { value: q(1).sub(noAdj), misconception: 'Answered "some neighbouring pair matches" instead of "every throw matches".' },
      { value: q(n, k), misconception: `Added 1/${k} for every throw. The first throw only sets the face, and the later matches must all happen together, so multiply.` },
      { value: q(1).sub(allSame), misconception: 'Answered the complement, "not all the same".' },
      { value: 0.5, misconception: 'Treated "same" and "different" as two equally likely outcomes.' },
    ],
    steps: [
      { say: 'The first throw can be anything: it only fixes the target face.', why: 'No face is specified in the question, so the first throw carries no cost.' },
      { say: `Each of the other ${n - 1} throws must match it: probability 1/${k} each.`, why: 'Throws are independent, so the match probabilities multiply.' },
      { say: `P = (1/${k})^${n - 1} = ${f(allSame)}.`, why: `Same as ${k} favourable sequences out of ${total}.` },
    ],
    hints: ['Does the first throw have to be anything in particular?', 'Only the later throws must match the first.', `(1/${k})^${n - 1}.`],
    fast: `The first throw is free; the other ${n - 1} must copy it: (1/${k})^${n - 1} = ${f(allSame)}.`,
    check: `${k} sequences out of ${total} work (one per face), so the answer is ${k}/${total}, ${k} times the chance of one named face.`,
    picture: allowed(freeThen(1), `Throw 1 may be any of the ${k} faces; every later throw has exactly 1 allowed face, the one already shown. Product ${f(allSame)}.`),
  };
  if (kind === 'noAdjacent') return {
    value: noAdj,
    text: `You throw ${die} ${words[n]} times. What is the probability that no two consecutive throws show the same face?`,
    distractors: [
      { value: allDiff, misconception: 'Required all faces to be different. The rule only forbids equal neighbours; 1, 2, 1 is allowed.' },
      { value: qpow(q(k - 1, k), n), misconception: 'Applied the "differ" condition to the first throw too. The first throw has nothing before it.' },
      { value: q(1).sub(allSame), misconception: 'Only excluded sequences where all throws are equal.' },
      { value: q(1).sub(q(n - 1, k)), misconception: `Subtracted 1/${k} for each neighbouring pair as if the "pair i matches" events were disjoint.` },
      { value: qpow(q(1, k), n - 1), misconception: 'Computed the chance that every neighbour matches instead of none.' },
    ],
    steps: [
      { say: 'The first throw is free.', why: 'There is no earlier throw it could equal.' },
      { say: `Each of the next ${n - 1} throws must avoid the face just before it: ${k - 1}/${k} each.`, why: `Given the previous face, exactly ${k - 1} of ${k} faces are allowed, whatever happened earlier.` },
      { say: `P = (${k - 1}/${k})^${n - 1} = ${f(noAdj)} ≈ ${noAdj.toNumber().toFixed(3)}.`, why: 'The conditional factors multiply along the chain.' },
    ],
    hints: ['Each throw only needs to avoid one face. Which one?', 'The first throw is unconstrained.', `(${k - 1}/${k})^${n - 1}.`],
    fast: `First throw free, then ${k - 1}/${k} for each of the ${n - 1} neighbours: ${f(noAdj)}.`,
    check: `Repeats that are not neighbours are allowed, so the answer is above P(all different) = ${f(allDiff)}.`,
    picture: allowed(freeThen(k - 1), `Each throw only has to avoid the previous face, so every throw after the first keeps ${k - 1} of ${k} faces. Product ${f(noAdj)}.`),
  };
  return {
    value: repeat,
    text: `You throw ${die} ${words[n]} times. What is the probability that at least two of the throws show the same face?`,
    distractors: [
      { value: q(1).sub(noAdj), misconception: 'Only looked for matches between neighbouring throws. Throw 1 can match throw 3.' },
      { value: q(n * (n - 1) / 2, k), misconception: `Added 1/${k} for each of the C(${n},2) pairs. Pair matches overlap, so adding double counts.` },
      { value: allSame, misconception: 'Answered "all the same", a much stronger event.' },
      { value: allDiff, misconception: 'Answered the complement, "all different".' },
      { value: q(n - 1, k), misconception: 'Checked each later throw against the first throw only.' },
    ],
    steps: [
      { say: 'Use the complement: at least one repeat = 1 − P(all different).', why: '"At least" events have many cases; the complement has one clean count.' },
      { say: `P(all different) = ${chain} = ${f(allDiff)}.`, why: 'Each throw must avoid all faces already used.' },
      { say: `P = 1 − ${f(allDiff)} = ${f(repeat)} ≈ ${repeat.toNumber().toFixed(3)}.`, why: 'Complement rule.' },
    ],
    hints: ['Counting "at least two match" directly is messy. What is its complement?', 'Complement: all throws different.', `1 − ${f(allDiff)}.`],
    fast: `Complement of all different: 1 − ${chain} = ${f(repeat)}.`,
    check: `This and P(all different) = ${f(allDiff)} must add to exactly 1; an option that does not is the wrong event.`,
    picture: allowed(shrinking, `The complement first: all different, with one face fewer allowed each throw (product ${f(allDiff)}). The answer is everything else, 1 − ${f(allDiff)}.`),
  };
}

export default {
  id: ID,
  section: 'bto',
  title: 'One die, repeated throws',
  skill: 'Chain conditional factors (6/6, 5/6, 4/6 …) and pick the right complement',
  levels: [1, 2],

  generate(rng, { difficulty = 1 } = {}) {
    const { kind, k, n, face } = rng.pick(repeatInputs(difficulty));
    const b = build(kind, n, k, face);
    return mcqItem(ID, rng, difficulty, {
      ...b,
      ...(k===6?{oldText:b.text,text:b.text.replace('throw one die','throw a fair six-sided die')}:{}),
      rule: 'Chain the conditionals: P(throw k is allowed | earlier throws), multiply; use 1 − P(all different) for "some repeat".',
      anchor: `A single throw has ${k} equally likely faces; several throws multiply the conditional chances, with the allowed count set by the constraint.`,
      data: { kind, n, k, ...(face ? { face } : {}) },
    });
  },

  // Independent check: enumerate every one of the k^n sequences.
  verify(item) {
    const { kind, n, k, face } = item.params;
    let hits = 0, total = 0;
    for (const s of sequences(k, n)) {
      total++;
      const distinct = new Set(s).size;
      const adj = s.some((x, i) => i > 0 && x === s[i - 1]);
      if (kind === 'allDiff' && distinct === n) hits++;
      if (kind === 'allSame' && distinct === 1) hits++;
      if (kind === 'noAdjacent' && !adj) hits++;
      if (kind === 'someRepeat' && distinct < n) hits++;
      if (kind === 'allTarget' && s.every((x) => x === (face ?? (k === 6 ? 6 : 1)))) hits++;
      if (kind === 'adjacentRepeat' && adj) hits++;
      if (kind === 'returnFirst' && new Set(s.slice(0, -1)).size === n - 1 && s.at(-1) === s[0]) hits++;
    }
    return agree(item, hits / total);
  },

  lesson: {
    purpose: 'Many dice questions are about whether throws agree or differ. The fast route is to walk through the throws one at a time and ask how many faces each throw may show.',
    anchor: 'One throw: P(face) = 1/6. Several throws = the same idea with one change: each throw\'s allowed-face count depends on what came before.',
    steps: [
      { say: 'Walk the throws in order and write the allowed fraction for each.', why: 'Independence lets conditional fractions multiply.' },
      { say: 'All different: 6/6 × 5/6 × 4/6 …; all the same: 6/6 × 1/6 × 1/6 …; no equal neighbours: 6/6 × 5/6 × 5/6 …', why: 'The constraint decides how many faces are forbidden at each step: all used faces, all but one, or just the previous face.' },
      { say: 'For "at least two match", take 1 − P(all different).', why: 'The complement is one product instead of many overlapping cases.' },
    ],
    predict: { question: 'Four throws. Which is bigger: P(no equal neighbours) or P(all different)?', answer: 'No equal neighbours: (5/6)^3 ≈ 0.58 against 6·5·4·3/6^4 ≈ 0.28. It forbids one face per throw, not all used faces.' },
    edge: 'Two throws: "all different" and "no equal neighbours" coincide (5/6). They split from three throws on.',
    rule: 'All different: 6·5·4…/6^n. All same: (1/6)^(n−1). No equal neighbours: (5/6)^(n−1). Some repeat: 1 − all different.',
    contrast: '"All the same" is not the complement of "all different": 1, 1, 4 is neither.',
  },
};
