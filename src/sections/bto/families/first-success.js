// Geometric distribution: first six on throw k, more than k throws, first success on an even throw.
import { mcqItem, agree, qpow, q, pic } from '../lib.js';
import { nCr } from '../../../core/combinatorics.js';
import { Q } from '../../../core/rational.js';

// Trials until the first success, cut after k trials. mark: 'hitK' marks the success on trial k,
// 'none' marks the path of k misses.
function waitTree(k, p, m, hit, miss, mark) {
  let node = { p: m.toString(), label: `${miss} ×${k}`, ...(mark === 'none' ? { mark: true } : {}) };
  for (let i = k; i >= 2; i--) node = { p: m.toString(), label: miss, children: [{ p: p.toString(), label: `${hit} on ${i}`, ...(mark === 'hitK' && i === k ? { mark: true } : {}) }, node] };
  return { label: '', children: [{ p: p.toString(), label: `${hit} on 1`, ...(mark === 'hitK' && k === 1 ? { mark: true } : {}) }, node] };
}

const ID = 'first-success';
const COINS = [[1, 3], [2, 5], [3, 4], [1, 4], [3, 5]];
const ord = (k) => `${k}${k % 10 === 1 && k !== 11 ? 'st' : k % 10 === 2 && k !== 12 ? 'nd' : k % 10 === 3 && k !== 13 ? 'rd' : 'th'}`;

export default {
  id: ID,
  section: 'bto',
  title: 'Waiting for the first success',
  skill: 'Model first and later successes, memorylessness and alternating races',
  levels: [1, 2],

  generate(rng, { difficulty = 1 } = {}) {
    const variant = difficulty === 1 ? rng.pick(['onK', 'moreThanK', 'fairCoinOnK']) : rng.pick(['coinOnK', 'evenThrow', 'duel', 'memoryless', 'rth']);
    let o;
    if (variant === 'memoryless' || variant === 'rth') {
      const [a,c]=rng.pick(COINS),p=q(a,c),miss=q(1).sub(p);
      if(variant==='memoryless') {
        const past=rng.int(1,6),m=rng.int(1,4),value=qpow(miss,m);
        o={value,text:`Independent attempts each succeed with probability ${p}. The first ${past} attempts all failed. What is the probability that more than ${m} additional attempts are needed to obtain the first success?`,
          data:{variant,a,c,past,m},
          steps:[{say:`The condition fixes the past; the next ${m} attempts remain independent with success chance ${p}.`,why:'No shared hidden source or changing composition is present.'},{say:`More than ${m} further attempts means ${m} further failures: P = (${miss})^${m} = ${value}.`,why:'Geometric waiting is memoryless under these assumptions.'}],
          distractors:[{value:qpow(miss,past+m),misconception:'Included already observed failures in the conditional probability.'},{value:q(1).sub(value),misconception:'Answered success within the additional attempts.'},{value:p.mul(value),misconception:'Required success immediately after the additional failures.'},{value:qpow(miss,m-1),misconception:'Counted one too few further failures.'}],
          picture:pic('table',{columns:['Block','Role'],rows:[[`${past} observed failures`,'Given: not multiplied again'],[`${m} further failures`,value.toString()]]},'The new waiting clock starts after the observed failures.'),
          hints:['Which trials are already known?','Only the additional failures are uncertain.'],fast:`Ignore the fixed past; (${miss})^${m} = ${value}.`,check:'This conditional probability is independent of the length of the observed failure run. A hidden source or no replacement would break this argument.'};
      }else{
        const r=rng.int(2,3),k=rng.int(r,7),value=new Q(nCr(k-1,r-1),1n).mul(qpow(p,r)).mul(qpow(miss,k-r));
        o={value,text:`Independent attempts each succeed with probability ${p}. What is the probability that the ${ord(r)} success occurs on attempt ${k}?`,data:{variant,a,c,r,k},
          steps:[{say:`Attempt ${k} must succeed; among the first ${k-1} attempts there must be exactly ${r-1} successes.`,why:'The last success is fixed at the requested stopping position.'},{say:`There are C(${k-1},${r-1}) earlier success-position sets. P = C(${k-1},${r-1})(${p})^${r}(${miss})^${k-r} = ${value}.`,why:'This is a fixed-count event followed by one success, not an unrestricted count in all k attempts.'}],
          distractors:[{value:new Q(nCr(k,r),1n).mul(qpow(p,r)).mul(qpow(miss,k-r)),misconception:'Counted exactly r successes in k attempts without fixing the last attempt as a success.'},{value:qpow(p,r).mul(qpow(miss,k-r)),misconception:'Counted just one arrangement of the earlier successes.'},{value:qpow(miss,k-1).mul(p),misconception:'Used a first-success formula for a later success.'},{value:q(1).sub(value),misconception:'Answered the complement.'}],
          picture:pic('table',{columns:['Attempts','Requirement'],rows:[[`1 through ${k-1}`,`${r-1} successes in any positions`],[String(k),'Success']]},'Fix the terminal success before choosing the earlier successful positions.'),hints:['What must happen on the last attempt?','Choose the other success positions among the earlier attempts.'],fast:`Fix the last success; choose the other ${r-1} positions among ${k-1}: ${value}.`,check:`When k=r all attempts must succeed, giving p^r. For r=1 this reduces to the ordinary first-success formula.`};
      }
    } else if (variant === 'onK' || variant === 'coinOnK' || variant === 'fairCoinOnK' || variant === 'moreThanK') {
      const coin = variant === 'coinOnK' || variant === 'fairCoinOnK';
      const [a, c] = variant === 'fairCoinOnK' ? [1, 2] : variant === 'coinOnK' ? rng.pick(COINS) : [1, 6];
      const p = q(a, c), m = q(1).sub(p);
      const k = variant === 'coinOnK' ? rng.int(2, 5) : rng.int(2, 6);
      const what = coin ? 'head' : 'six';
      const setup = variant === 'fairCoinOnK' ? 'You flip a fair coin repeatedly.' : variant === 'coinOnK' ? `A biased coin lands heads with probability ${p}. You flip it repeatedly.` : 'You throw a fair die repeatedly.';
      if (variant === 'moreThanK') {
        const value = qpow(m, k);
        o = {
          value,
          text: `${setup} What is the probability that you need more than ${k} throws to see the first six?`,
          distractors: [
            { value: qpow(m, k - 1), misconception: `Off by one: "more than ${k} throws" means the first ${k} throws all miss, not ${k - 1}.` },
            { value: q(1).sub(value), misconception: `Answered the complement: P(a six within the first ${k} throws).` },
            { value: q(1).sub(q(k, 6)), misconception: `Subtracted 1/6 per throw as if "six on throw i" were disjoint events.` },
            { value: p.mul(value), misconception: `Computed P(first six exactly on throw ${k + 1}); the question allows any later throw.` },
          ],
          steps: [
            { say: `"More than ${k} throws needed" is the same event as "no six in the first ${k} throws".`, why: 'Translate the waiting-time event into a statement about a fixed block of throws.' },
            { say: `P = (5/6)^${k} = ${value} ≈ ${value.toNumber().toFixed(3)}.`, why: 'Independent misses multiply.' },
          ],
          hints: [`What must happen on the first ${k} throws?`, `All ${k} throws miss.`, `(5/6)^${k}.`],
          picture: pic('tree', { root: waitTree(k, p, m, 'six', 'no six', 'none'), total: value.toString() }, `Throw until the first six, but look only at the first ${k} throws. The marked path, ${k} misses in a row, is the event: (5/6)^${k}.`),
          fast: `No six in ${k} throws: (5/6)^${k} = ${value}.`,
          check: `This and P(a six within ${k} throws) = ${q(1).sub(value)} must add to 1, and it must sit below (5/6)^${k - 1} = ${qpow(m, k - 1)}, the "more than ${k - 1}" answer.`,
          data: { variant, a, c, k },
        };
      } else {
        const value = qpow(m, k - 1).mul(p);
        o = {
          value,
          text: `${setup} What is the probability that the first ${what} appears on the ${ord(k)} ${coin ? 'flip' : 'throw'}?`,
          distractors: [
            { value: p, misconception: `Used P(${what}) on that one trial and ignored that the ${k - 1} earlier trials must all miss.` },
            { value: qpow(m, k - 1), misconception: `Forgot the final factor ${p} for the ${what} itself on trial ${k}.` },
            { value: qpow(m, k).mul(p), misconception: `Off by one: used ${k} misses before the ${what} instead of ${k - 1}.` },
            { value: q(1).sub(qpow(m, k)), misconception: `Computed P(a ${what} somewhere in the first ${k} trials), not P(first one exactly on trial ${k}).` },
            { value: qpow(p, k), misconception: `Multiplied the success probability ${k} times, as if every trial had to succeed.` },
          ],
          steps: [
            { say: `The only path: miss on trials 1..${k - 1}, then ${what} on trial ${k}.`, why: '"First" means nothing earlier succeeded, so the earlier trials are forced misses.' },
            { say: `P = (${m})^${k - 1} × ${p} = ${value} ≈ ${value.toNumber().toFixed(4)}.`, why: 'Independent trials multiply along the single path.' },
          ],
          hints: [`What must the first ${k - 1} trials show?`, `${k - 1} misses, then one success.`, `(${m})^${k - 1} × ${p}.`],
          picture: pic('tree', { root: waitTree(k, p, m, what, `no ${what}`, 'hitK'), total: value.toString() }, `Stop at the first ${what}. The one marked leaf is the path of ${k - 1} misses and then a ${what}, so it is the only way to have the first ${what} on trial ${k}.`),
          fast: `(${m})^${k - 1} × ${p} = ${value}.`,
          check: `A first ${what} on trial ${k} needs earlier misses, so the answer is below ${p}, the chance on trial 1, and each later trial is smaller again by the factor ${m}.`,
          data: { variant, a, c, k },
        };
      }
    } else {
      // First six on an even-numbered throw, or the starter of an alternating duel wins.
      const value = variant === 'evenThrow' ? q(5, 11) : q(6, 11);
      const text = variant === 'evenThrow'
        ? 'You throw a fair die until the first six. What is the probability that the first six appears on an even-numbered throw?'
        : 'Ann and Bob take turns throwing a fair die, Ann first. The first to throw a six wins. What is the probability that Ann wins?';
      o = {
        value, text,
        distractors: [
          { value: 0.5, misconception: 'Assumed odd and even throws are symmetric. Throw 1 is odd, so the odd side gets the first chance and wins more often.' },
          { value: q(1).sub(value), misconception: variant === 'evenThrow' ? 'Computed the odd-throw probability.' : 'Computed Bob\'s probability.' },
          { value: variant === 'evenThrow' ? q(5, 36) : q(1, 6), misconception: 'Only counted the first round and ignored that the game continues after two misses.' },
          { value: q(1, 6), misconception: 'Used the chance of a six on a single throw.' },
          { value: q(11, 36), misconception: 'Computed P(a six appears somewhere in the first round of two throws), which says nothing about which throw it was on.' },
        ],
        steps: [
          { say: 'Group the throws into rounds of two (odd, even).', why: 'Every round looks the same: it ends with a six on the odd throw, a six on the even throw, or two misses and a fresh round.' },
          { say: 'Per round: P(odd throw is the six) = 1/6, P(even throw is the six) = 5/6 × 1/6 = 5/36.', why: 'The even throw only counts if the odd throw missed.' },
          { say: 'Rounds that end in two misses restart the same situation, so only the ratio 1/6 : 5/36 = 6 : 5 matters.', why: 'Conditioning on the round deciding the game removes the repeats.' },
          { say: `P = ${value} ≈ ${value.toNumber().toFixed(3)}.`, why: variant === 'evenThrow' ? 'Even share = 5/(6 + 5).' : 'Ann has the odd throws: 6/(6 + 5).' },
        ],
        hints: ['Does the game look the same after two misses?', 'Compare 1/6 (odd throw wins) with 5/36 (even throw wins) inside one round.', 'Ratio 6 : 5.'],
        picture: pic('tree', { root: { label: 'round', children: [{ p: '1/6', label: variant === 'evenThrow' ? 'six on the odd throw' : 'Ann throws a six', ...(variant === 'duel' ? { mark: true } : {}) }, { p: '5/6', label: variant === 'evenThrow' ? 'odd throw misses' : 'Ann misses', children: [{ p: '1/6', label: variant === 'evenThrow' ? 'six on the even throw' : 'Bob throws a six', ...(variant === 'evenThrow' ? { mark: true } : {}) }, { p: '5/6', label: 'both miss: start again' }] }] } }, `One round of two throws. It ends at 1/6 for the ${variant === 'evenThrow' ? 'odd' : 'first'} throw or 5/36 for the ${variant === 'evenThrow' ? 'even' : 'second'}; the 25/36 branch replays the same round, so only the ratio 6 : 5 matters.`),
        fast: variant === 'evenThrow' ? 'Odd : even = 1/6 : 5/36 = 6 : 5, so the even share is 5/11.' : 'The first thrower wins with 1/(2 − p) = 1/(2 − 1/6) = 6/11.',
        check: variant === 'evenThrow' ? 'Below 1/2, because the odd throw gets the first chance in every round; odd and even together make 1, so odd is 6/11.' : 'Above 1/2, because Ann gets the first chance in every round; Ann and Bob together make 1, so Bob has 5/11.',
        data: { variant },
      };
    }
    return mcqItem(ID, rng, difficulty, {
      ...o,
      rule: 'First success on k: (1−p)^(k−1)p. After observed failures the independent future is unchanged. The rth success on k requires r−1 successes in k−1 attempts, then success.',
      anchor: 'A single trial succeeds with p. Waiting for the first success = the same trial repeated, with the one change that every earlier trial must fail.',
    });
  },

  // Independent check: sum the series of path probabilities term by term.
  verify(item) {
    const d = item.params;
    if(d.variant==='rth'||d.variant==='memoryless') {
      const p=d.a/d.c;let hit=0,den=0;
      const n=d.variant==='rth'?d.k:d.past+d.m;
      function visit(xs,w){if(xs.length===n){const allowed=d.variant==='rth'||xs.slice(0,d.past).every(x=>!x);if(allowed){den+=w;if(d.variant==='rth'?xs.at(-1)===1&&xs.reduce((a,b)=>a+b,0)===d.r:xs.every(x=>!x))hit+=w;}return;}visit([...xs,0],w*(1-p));visit([...xs,1],w*p);}
      visit([],1);return agree(item,hit/den,1e-10);
    }
    if (d.variant === 'evenThrow' || d.variant === 'duel') {
      const p = 1 / 6;
      let even = 0;
      for (let k = 2; k < 800; k += 2) even += (1 - p) ** (k - 1) * p;
      return agree(item, d.variant === 'evenThrow' ? even : 1 - even, 1e-9);
    }
    const p = d.a / d.c;
    // P(first success on k) = P(T > k-1) - P(T > k); P(T > k) = 1 - sum_{j<=k} (1-p)^(j-1) p.
    const tail = (k) => { let s = 0; for (let j = 1; j <= k; j++) s += (1 - p) ** (j - 1) * p; return 1 - s; };
    const v = d.variant === 'moreThanK' ? tail(d.k) : tail(d.k - 1) - tail(d.k);
    return agree(item, v, 1e-9);
  },

  lesson: {
    purpose: 'Waiting-time questions ("the first six on throw 4", "who throws the first six") reduce to one forced path, so they are fast once the path is written down.',
    anchor: 'One trial: P(success) = p. Waiting for the first success is the same trial repeated, with one change: every trial before the success must be a failure.',
    steps: [
      { say: 'Write the path: F F … F S (k − 1 failures, then success).', why: '"First" forbids any earlier success.' },
      { say: 'Multiply along the path: (1 − p)^(k−1) p.', why: 'Independent trials multiply.' },
      { say: '"More than k trials" = the first k are all failures: (1 − p)^k.', why: 'It says nothing about what happens after trial k.' },
      { say: 'For turn-taking races, compare the two chances inside one round and ignore rounds with no winner.', why: 'A round with two misses returns the game to the same state.' },
      { say: 'Observed failures do not change independent future trials. For the rth success on k, fix the last success and choose r−1 earlier success positions.', why: 'Memorylessness needs a constant success chance; later-success waiting combines a binomial count with a terminal success.' },
    ],
    predict: { question: 'Is the first six more likely on throw 1 or on throw 2?', answer: 'Throw 1: 1/6 against 5/36. Each later throw is less likely to be the first six because it needs the earlier misses.' },
    edge: 'With p = 1, the first success is always on trial 1: (1 − p)^(k−1) p is 1 for k = 1 and 0 afterwards.',
    rule: 'P(first success on k) = (1−p)^(k−1) p; P(T > k) = (1−p)^k; starter of an alternating race wins with 1/(2 − p).',
    contrast: '"First six on throw k" (exact position) against "a six within k throws" (at least one): the second is 1 − (5/6)^k and is much larger.',
  },
};
