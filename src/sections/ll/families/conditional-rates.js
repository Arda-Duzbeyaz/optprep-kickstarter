// Stratification and aggregation: original tables, not reconstructed assessment items.
import { rankItem, retry, agreeRank } from '../lib.js';
import { q } from '../../bto/lib.js';
const ID = 'conditional-rates';
const fam = {
  id: ID, section: 'll', title: 'Conditional rates and changing group mix',
  skill: 'Compare within-group rates, pooled rates and standardised rates without swapping their denominators',
  levels: [2, 3, 4],
  generate(rng, { difficulty = 2 } = {}) {
    const mode = difficulty === 2 ? 'within' : difficulty === 3 ? 'pooled' : rng.pick(['pooled', 'reverse', 'standardised']);
    const wantReversal = difficulty === 4 ? rng.chance(.5) : null;
    return retry(() => {
      // Counts are exact; the displayed table is the complete population.
      const low = rng.int(1, 3), high = rng.int(6, 8), advantage = rng.pick([-1, 1]);
      const sizes = [rng.int(2, 5) * 10, rng.int(8, 14) * 10, rng.int(8, 14) * 10, rng.int(2, 5) * 10];
      if (rng.chance(.5)) [sizes[0], sizes[1], sizes[2], sizes[3]] = [sizes[1], sizes[0], sizes[3], sizes[2]];
      const rates = [low + advantage, high + advantage, low, high];
      if (rates.some(x => x <= 0 || x >= 10)) return null;
      const hits = sizes.map((n, i) => n * rates[i] / 10);
      const A = q(hits[0] + hits[1], sizes[0] + sizes[1]), B = q(hits[2] + hits[3], sizes[2] + sizes[3]);
      const reversal = (A.toNumber() > B.toNumber()) !== (advantage > 0);
      if (wantReversal != null && reversal !== wantReversal) return null;
      const stdA = q(rates[0] + rates[1], 20), stdB = q(rates[2] + rates[3], 20);
      const pool = {
        aLow: { text: 'Choose a method A record uniformly from the low-success group. It succeeded.', p: q(hits[0], sizes[0]), how: `${hits[0]}/${sizes[0]} within A, low-success group.` },
        bLow: { text: 'Choose a method B record uniformly from the low-success group. It succeeded.', p: q(hits[2], sizes[2]), how: `${hits[2]}/${sizes[2]} within B, low-success group.` },
        aHigh: { text: 'Choose a method A record uniformly from the high-success group. It succeeded.', p: q(hits[1], sizes[1]), how: `${hits[1]}/${sizes[1]} within A, high-success group.` },
        aAll: { text: 'Choose one of all method A records uniformly. It succeeded.', p: A, how: `${hits[0] + hits[1]}/${sizes[0] + sizes[1]}; pool counts before dividing.` },
        bAll: { text: 'Choose one of all method B records uniformly. It succeeded.', p: B, how: `${hits[2] + hits[3]}/${sizes[2] + sizes[3]}; B has its own group mix.` },
        stdA: { text: 'For method A, choose low-success or high-success group with equal probability, then a record uniformly in that group. It succeeded.', p: stdA, how: `Equal group selection averages A\'s two rates, not its record counts: ${stdA}.` },
        stdB: { text: 'For method B, choose low-success or high-success group with equal probability, then a record uniformly in that group. It succeeded.', p: stdB, how: `Equal group selection averages B\'s rates: ${stdB}.` },
        aGivenHit: { text: 'Choose uniformly from all successful records in the table. It used method A.', p: q(hits[0] + hits[1], hits.reduce((s,x)=>s+x,0)), how: 'The denominator is successful records from BOTH methods, not all A records.' },
      };
      const keys = rng.shuffle(mode === 'within' ? ['aLow', 'bLow', 'aHigh'] : mode === 'pooled' ? ['aAll', 'bAll', rng.pick(['stdA','stdB'])] : mode === 'reverse' ? ['aAll','aGivenHit','bAll'] : ['stdA','stdB',rng.pick(['aAll','bAll','aGivenHit'])]);
      const item = rankItem(ID, rng, difficulty, {
        text: 'The table contains all records from two methods in two groups. Each statement defines a separate sampling procedure. These are observed frequencies, not a claim that either method causes success. Rank from most to least likely.',
        visual: { type:'table', caption:'Complete record counts', columns:['Method','Group','Records','Succeeded'], rows:sizes.map((n,i)=>[i<2?'A':'B',i%2?'High-success':'Low-success',n,hits[i]]) },
        statements: keys.map(k=>pool[k]),
        intro:[{say:'Name the sample space separately for each statement before taking a ratio.',why:'Pooling, equal-group selection and conditioning on success use different weights.'}],
        compare: `Method ${advantage > 0 ? 'A' : 'B'} has the higher success rate within both groups.${reversal ? ' The overall ranking reverses because the methods have different group mixes.' : ' Here the pooled ranking agrees; a reversal is possible, not compulsory.'}`,
        rule:'Pool by adding counts. Standardise with the stated common weights. Reverse conditioning changes the denominator.',
        anchor:'Weighted averages can change their order when different weights are used.',
        hints:['What exactly is chosen uniformly?','For pooled rates add successes and records before dividing.','Do both methods have the same low/high group mix?'],
        params:{scenario:mode, sizes, hits, statements:keys, reversal},
      });
      if(item) item.transfer={structure:`${mode}:${reversal?'reversal':'agreement'}`,operations:['conditioning','weighted-average','stratification']};
      return item;
    }, 1200);
  },
  verify(item) {
    // Recount the table as individually labelled records, independent of rate formulas.
    const rows=item.prompt.visual.rows;
    const records=rows.flatMap(([method,group,n,h])=>Array.from({length:n},(_,i)=>({method,group,hit:i<h})));
    const prob=(method,group)=>{const scope=records.filter(r=>(!method||r.method===method)&&(!group||r.group===group));return scope.filter(r=>r.hit).length/scope.length;};
    const p={aLow:()=>prob('A','Low-success'),bLow:()=>prob('B','Low-success'),aHigh:()=>prob('A','High-success'),aAll:()=>prob('A'),bAll:()=>prob('B'),stdA:()=>(prob('A','Low-success')+prob('A','High-success'))/2,stdB:()=>(prob('B','Low-success')+prob('B','High-success'))/2,aGivenHit:()=>records.filter(r=>r.hit&&r.method==='A').length/records.filter(r=>r.hit).length};
    return agreeRank(item,item.params.statements.map(k=>p[k]()));
  },
  lesson:{purpose:'A method can win in each group yet lose overall when group mixes differ.',anchor:'Total probability is a weighted average; check whose weights you used.',steps:[{say:'Name the group sampled in each statement.',why:'It determines the denominator.'},{say:'Compare within-group and pooled rates separately.',why:'Different mixes can reverse the ranking.'}],predict:{question:'Must a method that wins in each group also win overall?',answer:'Only when the weighting conditions justify it; unequal mixes can reverse the pooled order.'},rule:'Sum counts before dividing; equal group selection averages rates.'},
};
export default fam;
