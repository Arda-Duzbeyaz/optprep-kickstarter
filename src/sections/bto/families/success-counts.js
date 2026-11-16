import { question,task,q,binomial,hyper,choose,sum,wrong,table,steps,simpleLesson } from '../curriculum/common.js';
import { verifyCounts } from '../curriculum/verify.js';
const ID='success-counts';
export const COUNT_TASKS={1:['exact'],2:['tail','band','replacement'],3:['conditional','split','unequal']};
function experiment(rng,n,allowNoReplace=false) {
  const context=rng.pick(['coin','die','urn','cards']);let good,total,setup;
  const replacement=!allowNoReplace||!['urn','cards'].includes(context)||rng.chance(.5);
  if(context==='coin') {const [a,b]=rng.pick([[1,2],[1,3],[2,3],[2,5],[3,4]]);good=a;total=b;setup=`A coin lands heads with probability ${a}/${b}. Flip it independently ${n} times; a head is a success.`;}
  if(context==='die') {good=rng.int(1,4);total=6;setup=`Roll a fair six-sided die independently ${n} times; a face from 1 through ${good} is a success.`;}
  if(context==='urn') {good=rng.int(3,6);total=good+rng.int(Math.max(3,n-good),6);setup=`A bag contains ${good} red and ${total-good} blue tokens. Draw ${n} uniformly ${replacement?'with replacement, returning and mixing each token before the next draw':'without replacement'}; red is a success.`;}
  if(context==='cards') {const group=rng.pick([['aces',4],['hearts',13],['red cards',26]]);good=group[1];total=52;setup=`Draw ${n} cards uniformly from a standard shuffled 52-card deck ${replacement?'with replacement, reshuffling after each draw':'without replacement'}; ${group[0]} count as successes.`;}
  return {context,good,total,replacement,setup};
}
const mass=(e,n,k)=>e.replacement?binomial(n,k,q(e.good,e.total)):hyper(e.good,e.total-e.good,n,k);
function massText(e,n,k) {
  const rest=typeof k==='number'?n-k:`(${n}−${k})`;
  return e.replacement?`C(${n},${k})(${q(e.good,e.total)})^${k}(1−${q(e.good,e.total)})^${rest}`:`C(${e.good},${k})C(${e.total-e.good},${rest})/C(${e.total},${n})`;
}
const family={id:ID,section:'bto',title:'Success counts: recognise the sampling model',
  skill:'Choose binomial, without-replacement or unequal-trial counting from the assumptions, across coins, dice, cards and urns',levels:[1,2,3],
  generate(rng,{difficulty=1,variant}={}) {
    const kind=task(rng,difficulty,COUNT_TASKS,variant),n=rng.int(3,difficulty===1?5:7);
    let e=experiment(rng,n,kind==='replacement'),k=rng.int(kind==='conditional'?1:0,n),lo=k,hi=k,condition=null;
    let text,value,work,data,operations,wrongModel;
    if(kind==='unequal') {
      const ps=Array.from({length:rng.int(3,5)},()=>rng.pick([[1,4],[1,2],[3,4],[1,3],[2,3]]));
      k=rng.int(1,ps.length-1);let dist=[q(1)];
      for(const pair of ps) {const p=q(...pair),next=Array.from({length:dist.length+1},()=>q(0));dist.forEach((w,j)=>{next[j]=next[j].add(w.mul(q(1).sub(p)));next[j+1]=next[j+1].add(w.mul(p));});dist=next;}
      value=dist[k];data={kind,ps,k};
      text=`${ps.length} components fail independently. Their failure probabilities, respectively, are ${ps.map(p=>q(...p)).join(', ')}. What is the probability that exactly ${k} fail?`;
      work=steps(['The component probabilities differ, so there is no single common-p binomial model.','Independence permits multiplying a specified success/failure pattern, not replacing all probabilities by their mean.'],[`Accumulate counts one component at a time: next[j] = old[j](1−p) + old[j−1]p.`,'The two disjoint routes are current component does not fail, or it does.'],[`The mass at ${k} failures is ${value}.`,'Sum all qualifying patterns.']);
      const avg=sum(ps.map(p=>q(...p))).div(q(ps.length));wrongModel=binomial(ps.length,k,avg);operations=['independence','unequal-bernoulli','distribution-recursion'];
    } else if(kind==='split') {
      const a=rng.int(2,4),b=rng.int(2,3),N=a+b,K=rng.int(1,N-1),j=rng.int(0,Math.min(a,K));
      e=experiment(rng,N);value=choose(a,j).mul(choose(b,K-j)).div(choose(N,K));data={kind,e:{...e,setup:undefined},a,b,K,j};
      delete data.e.setup;
      text=`${e.setup} Given that exactly ${K} successes occurred overall, what is the probability that exactly ${j} were in the first ${a} trials?`;
      work=steps([`Given ${K} successes, all C(${N},${K}) choices of their positions have the same weight p^${K}(1−p)^${N-K}.`,'The common trial probability cancels after conditioning.'],[`Choose ${j} success positions from the first ${a}, and ${K-j} from the final ${b}: C(${a},${j})C(${b},${K-j}).`,'Conditioning on a total couples the two block counts.'],[`P = ${value}.`,'Divide the favourable position sets by all allowed position sets.']);
      wrongModel=binomial(a,j,q(e.good,e.total));operations=['conditioning','position-counting','binomial-hypergeometric-transfer'];
    } else {
      if(kind==='tail') {lo=rng.int(1,n);hi=n;}
      if(kind==='band') {lo=rng.int(0,n-1);hi=rng.int(lo+1,n);}
      if(kind==='conditional') {condition=rng.int(1,Math.min(k,2));}
      const numerator=sum(Array.from({length:hi-lo+1},(_,i)=>mass(e,n,lo+i)));
      const denominator=condition===null?q(1):sum(Array.from({length:n-condition+1},(_,i)=>mass(e,n,condition+i)));
      value=numerator.div(denominator);data={kind,e:{context:e.context,good:e.good,total:e.total,replacement:e.replacement},n,lo,hi,condition};
      const event=lo===hi?`exactly ${lo} successes`:hi===n?`at least ${lo} successes`:`between ${lo} and ${hi} successes, inclusive`;
      text=`${e.setup} ${condition!==null?`Given that at least ${condition} successes occurred, what is the probability of ${event}?`:`What is the probability of ${event}?`}`;
      work=steps([e.replacement?`The trials are independent with constant p = ${q(e.good,e.total)}.`:`The composition changes after each draw; use a hypergeometric model.`,'The physical context does not determine the model; replacement and independence do.'],[`For j successes use ${massText(e,n,'j')}.`,'Count arrangements of successes or unordered samples, as appropriate.'],[`Add masses for j = ${lo} through ${hi}${condition!==null?`, then divide by P(count ≥ ${condition}) = ${denominator}`:''}: ${value}.`,'Translate exactly, at least, the band and the conditioning event separately.']);
      wrongModel=e.replacement?binomial(n,lo,q(1,2)):binomial(n,lo,q(e.good,e.total));
      operations=[e.replacement?'binomial':'hypergeometric',...(lo!==hi?['tail-sum']:[]),...(condition!==null?['conditioning']:[])];
    }
    return question(ID,rng,difficulty,{value,text,data,steps:work,structure:`${kind}:${data.e?.replacement===false?'without-replacement':'independent'}`,operations,
      distractors:[wrong(wrongModel,'Used the wrong common trial probability, replacement model or unconditioned count.'),wrong(q(1).sub(value),'Answered the complement.'),wrong(value.mul(q(2)),'Counted each qualifying arrangement twice.'),wrong(value.div(q(2)),'Omitted qualifying arrangements.'),wrong(q(k,n),'Confused a fraction of successes with the probability of that count.')],
      picture:table(['Question to ask','Model consequence'],[['Independent, same p?','Binomial'],['Without replacement?','Changing composition'],['Different p values?','Sum weighted patterns'],['A total is given?','Restrict and renormalise']],'Name assumptions, not the object in the story.'),
      rule:'C(n,k)p^k(1−p)^(n−k) needs independent equal-p trials. Without replacement and unequal probabilities require different counts.',
      anchor:'Exactly k heads is one instance of a success-count model, not a coin-only formula.',
      hints:['Is the success probability unchanged and are trials independent?','Count the successful positions, then account for the stated condition.'],
      fast:`Choose the model from the assumptions; the requested mass or conditional mass is ${value}.`,
      check:'Exactly 0 through n successes partition all outcomes. A conditional denominator must be positive. Counts incompatible with a stated block total have probability zero.'});
  },verify:verifyCounts,
  lesson:simpleLesson('Transfer success-count reasoning to unfamiliar experiments.','A success is any specified event on one trial.','Check independence, fixed p, replacement and the event before using a distribution.',[
    ['For independent equal-p trials, choose the k successful positions.','Every such pattern has weight p^k(1−p)^(n−k).'],
    ['Without replacement, count sample subsets instead.','The draws have changing conditional probabilities.'],
    ['Unequal p values need weighted patterns; conditioning needs a new denominator.','Averaging probabilities before taking powers generally changes the answer.']
  ],['Do repeated card draws always use a hypergeometric model?','No. Returning and reshuffling each card makes independent trials, so success counts are binomial.'])};
export default family;
