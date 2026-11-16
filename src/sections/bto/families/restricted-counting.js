import { question,task,q,choose,wrong,table,steps,simpleLesson } from '../curriculum/common.js';
import { verifyCounting } from '../curriculum/verify.js';
const ID='restricted-counting';
export const COUNTING_TASKS={2:['roles','group','adjacent'],3:['gaps','repeated','conditioned']};
const factorial=n=>Array.from({length:n},(_,i)=>i+1).reduce((a,b)=>a*b,1);
function compositions(counts,k,predicate) {
  let favourable=q(0);
  for(let a=0;a<=counts[0];a++)for(let b=0;b<=counts[1];b++){
    const c=k-a-b;if(c<0||c>counts[2]||!predicate(a,b,c))continue;
    favourable=favourable.add(choose(counts[0],a).mul(choose(counts[1],b)).mul(choose(counts[2],c)));
  }
  return favourable;
}
const family={id:ID,section:'bto',title:'Restricted counting: roles, groups and arrangements',
  skill:'Choose ordered or unordered sample spaces and count constrained arrangements without double counting',levels:[2,3],
  generate(rng,{difficulty=2,variant}={}) {
    const kind=task(rng,difficulty,COUNTING_TASKS,variant);
    let value,text,data,work,picture,distractors,operations,ev=false,extras={};
    if(kind==='roles') {
      const a=rng.int(2,6),b=rng.int(2,6),N=a+b;value=q(a*b,N*(N-1));data={kind,a,b};
      text=`A team has ${a} analysts and ${b} engineers, all distinct. A chair and a different deputy are selected uniformly from all ordered choices. What is the probability the chair is an analyst and the deputy is an engineer?`;
      work=steps([`There are ${N}×${N-1} ordered role assignments, and ${a}×${b} favourable assignments.`,'Chair and deputy are different roles; reversing two people is a different outcome.'],[`P = ${value}.`,'Equivalently multiply P(analyst first) by P(engineer next | analyst first).']);
      picture=table(['Role','Available choices'],[['Chair',N],['Deputy after chair',N-1],['Favourable pair',`${a} × ${b}`]],'Choosing people for labelled roles is ordered sampling.');
      distractors=[wrong(q(2*a*b,N*(N-1)),'Counted either order, although the roles were specified.'),wrong(q(a*b,N*N),'Allowed the same person in both roles.'),wrong(q(a,N),'Ignored the deputy’s role.'),wrong(q(b,N-1),'Ignored the first selection.')];operations=['ordered-counting','conditional-product'];
    } else if(kind==='group'||kind==='conditioned') {
      const counts=Array.from({length:3},()=>rng.int(2,4)),N=counts.reduce((a,b)=>a+b,0),k=rng.int(3,4);
      let target=null,num,den;
      if(kind==='group') {
        const a=rng.int(0,Math.min(k,counts[0])),b=rng.int(Math.max(0,k-a-counts[2]),Math.min(counts[1],k-a)),c=k-a-b;
        target=[a,b,c];num=choose(counts[0],a).mul(choose(counts[1],b)).mul(choose(counts[2],c));den=choose(N,k);
        text=`A bag contains ${counts[0]} red, ${counts[1]} blue and ${counts[2]} green tokens. Each token is distinct. A uniform sample of ${k} is taken without replacement. What is the probability it contains exactly ${a} red, ${b} blue and ${c} green tokens?`;
        work=steps([`All C(${N},${k}) unordered samples are equally likely.`,'Order does not matter for this composition event.'],[`Choose within each colour: C(${counts[0]},${a})C(${counts[1]},${b})C(${counts[2]},${c}).`,'Each set of red choices pairs with each blue and green choice.'],[`Divide by all samples: P = ${num.div(den)}.`,'The three colour counts must add to the sample size.']);
      } else {
        den=compositions(counts,k,(a)=>a>=1);num=compositions(counts,k,(a,b,c)=>a>=1&&b>=1&&c>=1);
        text=`A bag contains ${counts[0]} red, ${counts[1]} blue and ${counts[2]} green distinct tokens. Draw ${k} uniformly without replacement. Given that the sample contains at least one red token, what is the probability that all three colours are represented?`;
        work=steps([`The condition keeps ${den} samples with at least one red token.`,'Count labelled token subsets, not colour labels as equally likely outcomes.'],[`Among them ${num} contain all three colours. Sum C(R,a)C(B,b)C(G,c) over positive a,b,c with a+b+c=${k}.`,'All-three is a subset of the condition.'],[`Conditional probability = ${num}/${den} = ${num.div(den)}.`,'The common all-samples denominator cancels.']);
      }
      value=num.div(den);data={kind,counts,k,target};picture=table(['Colour','Available tokens'],[['Red',counts[0]],['Blue',counts[1]],['Green',counts[2]]],'Without replacement: count subsets that meet every restriction.');
      distractors=[wrong(q(1,3),'Treated the three colour names as equally likely sample compositions.'),wrong(q(1).sub(value),'Answered the complement.'),wrong(value.mul(q(2)),'Double counted qualifying samples.'),wrong(value.div(q(2)),'Discarded valid samples.'),wrong(q(k,N),'Confused the sampling fraction with the probability of a composition.')];operations=['multivariate-hypergeometric',...(kind==='conditioned'?['conditioning','restricted-counting']:['unordered-counting'])];
    } else if(kind==='adjacent'||kind==='gaps') {
      if(kind==='adjacent') {
        const n=rng.int(4,8),apart=rng.chance(.5);value=apart?q(n-2,n):q(2,n);data={kind,n,apart};
        text=`${n} distinct people stand in a uniformly random line. Two specified people ${apart?'must not stand next to one another':'are to stand next to one another'}. What is the probability this requirement is satisfied?`;
        work=steps([`Treat the specified pair as a block: 2×(${n}-1)! adjacent orders out of ${n}! total orders.`,'The block has two internal orders.'],[`P(adjacent) = 2/${n}${apart?`; take its complement for separation = ${value}`:` = ${value}`}.`,'A block counts all positions of the neighbouring pair once.']);
        picture=table(['Case','Count'],[['All lines',`${n}!`],['Pair adjacent',`2 × ${n-1}!`]],'The same pair can appear in either internal order.');
        distractors=[wrong(apart?q(2,n):q(n-2,n),'Answered the opposite adjacency event.'),wrong(q(1,n),'Forgot the two internal orders of the pair.'),wrong(q(1,n-1),'Treated possible pair locations as equally likely pair choices.'),wrong(q(2,n-1),'Used the wrong total count.')];operations=['permutation','block-method','complement'];
      } else {
        const r=rng.int(2,4),b=rng.int(2,4),n=r+b;value=choose(b+1,r).div(choose(n,r));data={kind,r,b};
        text=`A uniformly random line contains ${r} red and ${b} blue distinct tokens. What is the probability that no two red tokens are adjacent?`;
        work=steps([`The C(${n},${r}) red-position sets are equally likely.`,'Distinct token identities contribute the same r!b! factor to every colour pattern.'],[`There are ${b+1} gaps around the blue tokens; select ${r} distinct gaps: C(${b+1},${r}).`,'At most one red token per gap prevents adjacent reds. If there are too few gaps, the count is zero.'],[`P = ${value}.`,'Divide valid red-position sets by all such sets.']);
        picture=table(['Quantity','Count'],[['Available gaps',b+1],['Red tokens',r],['All red-position sets',choose(n,r)]],'One red per chosen gap enforces the restriction.');
        distractors=[wrong(choose(b,r).div(choose(n,r)),'Forgot an end gap.'),wrong(q(1).sub(value),'Answered at least one adjacent pair.'),wrong(q(b,n),'Used a one-token colour probability.'),wrong(value.div(q(2)),'Removed valid gap choices.')];operations=['gap-method','combination','impossibility'];
      }
    } else {
      const counts=[rng.int(2,3),rng.int(1,3),rng.int(1,2)],n=counts.reduce((a,b)=>a+b,0),total=factorial(n),divisor=counts.map(factorial).reduce((a,b)=>a*b,1);
      value=q(total,divisor);data={kind,counts};ev=true;
      text=`A code uses exactly ${counts[0]} copies of A, ${counts[1]} copies of B and ${counts[2]} copies of C. Copies of the same letter are indistinguishable. How many different strings can be formed?`;
      work=steps([`Labelling every copy temporarily would give ${n}! arrangements.`,'These labels are not part of a final code.'],[`Each string was counted ${counts.map(c=>`${c}!`).join('×')} times, from permutations within each repeated letter.`,'Remove exactly this overcounting factor.'],[`Distinct strings = ${n}!/(${counts.map(c=>`${c}!`).join('×')}) = ${value}.`,'This is a count, not a probability.']);
      picture=table(['Letter','Copies'],counts.map((c,i)=>['ABC'[i],c]),'Repeated copies do not create different strings.');
      distractors=[wrong(q(total),'Treated identical copies as distinct.'),wrong(q(total,counts[0]*counts[1]*counts[2]),'Divided by counts rather than factorials.'),wrong(q(n),'Counted positions rather than arrangements.'),wrong(value.mul(q(2)),'Retained an extra symmetry factor.')];operations=['multiset-permutation','overcounting'];
      const gap=Math.max(1,Math.ceil(value.toNumber()*.15));
      extras={domain:'count',format:v=>String(v),fillers:[1,2,3,4,5,6,7,8].map(i=>wrong(value.toNumber()+i*gap,'An integer guess that does not remove the repeated-copy overcount.'))};
    }
    return question(ID,rng,difficulty,{...extras,ev,value,text,data,steps:work,picture,distractors,structure:kind,operations,
      hints:['Does changing the order create a different elementary outcome?','Count all equally likely outcomes and then impose the restriction.'],
      rule:'Choose the sample space first. Labelled roles use ordered counts; subsets use combinations; identical copies require dividing out their internal permutations.',
      anchor:'A formula is useful only after the numerator and denominator count the same kind of object.',fast:`Count consistent objects and apply the stated restriction: ${value}.`,
      check:'A probability lies in [0,1]; a count is a nonnegative integer. Check whether the restrictions are possible and whether reversing a selection creates a new outcome.'});
  },verify:verifyCounting,
  lesson:simpleLesson('Build flexible counting models before calculating probabilities.','Ordered role assignments, unordered samples and repeated-letter strings are different sample spaces.','Use combinations for subsets, blocks or gaps for restrictions, and divide out indistinguishable permutations.',[
    ['Describe one elementary outcome in words.','This determines whether order and identities matter.'],
    ['Impose restrictions without counting the same outcome twice.','Blocks enforce adjacency; gaps prevent it.'],
    ['Condition by counting only allowed outcomes.','A condition changes the denominator as well as the favourable count.']
  ],['Is choosing a chair and deputy the same as choosing a two-person committee?','No. Each pair of people has two role assignments but only one unordered committee.'])};
export default family;
