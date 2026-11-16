import { question,task,q,sum,wrong,table,steps,simpleLesson } from '../curriculum/common.js';
import { verifySums } from '../curriculum/verify.js';
const ID='discrete-sums';
export const SUM_TASKS={2:['exact'],3:['tail','comparison','random-total'],4:['conditional','reuse']};
function convolve(a,b) {
  const out=new Map();for(const [x,p] of a)for(const [y,r] of b)out.set(x+y,(out.get(x+y)||q(0)).add(p.mul(r)));return [...out];
}
const distribution=(values,weights)=>{const N=weights.reduce((a,b)=>a+b,0);return values.map((x,i)=>[x,q(weights[i],N)]);};
const describe=(name,values,weights)=>`${name} is ${values.map((x,i)=>`${x} with probability ${q(weights[i],weights.reduce((a,b)=>a+b,0))}`).join(', ')}`;
const family={id:ID,section:'bto',title:'Combining discrete random quantities',
  skill:'Combine weighted distributions, distinguish independent copies from reuse, and condition on an observed total',levels:[2,3,4],
  generate(rng,{difficulty=2,variant}={}) {
    const kind=task(rng,difficulty,SUM_TASKS,variant),xs=[0,rng.int(1,3),rng.int(4,6)],ys=[0,rng.int(1,3),rng.int(4,6)];
    const wx=Array.from({length:3},()=>difficulty===2?1:rng.int(1,4)),wy=Array.from({length:3},()=>difficulty===2?1:rng.int(1,4));
    const X=distribution(xs,wx),Y=distribution(ys,wy),dist=convolve(X,Y),t=rng.pick(dist.map(([s])=>s)),bound=xs[1];
    let value,text,work,data={kind,xs,ys,wx,wy,t,bound},operations;
    if(kind==='random-total') {
      const counts=rng.pick([[1,2],[1,3],[2,3]]),nw=rng.int(1,3),countWeights=[nw,4-nw],limit=rng.int(xs[1],xs[2]*Math.max(...counts));
      const probability=counts.map(n=>{let d=[[0,q(1)]];for(let i=0;i<n;i++)d=convolve(d,X);return sum(d.filter(([s])=>s>=limit).map(([,p])=>p));});
      value=sum(probability.map((p,i)=>p.mul(q(countWeights[i],4))));data={...data,counts,countWeights,limit};
      text=`One draw has the distribution: ${describe('X',xs,wx)}. Independently choose the number of draws N: ${counts[0]} with probability ${countWeights[0]}/4 or ${counts[1]} with probability ${countWeights[1]}/4. Then make N independent draws with that same distribution. What is the probability their sum is at least ${limit}?`;
      work=steps([`Condition on N. The two sum-tail probabilities are ${probability.join(', ')}.`,'A random number of terms is a mixture of distinct sum distributions.'],[`Weight these by ${countWeights.map(w=>q(w,4)).join(', ')}: P = ${value}.`,'Total probability averages the events within each possible horizon.']);operations=['convolution','random-horizon','total-probability'];
    } else if(kind==='reuse') {
      const independent=rng.chance(.5);data.independent=independent;
      value=independent?sum(dist.filter(([s])=>s>=t).map(([,p])=>p)):sum(X.filter(([x])=>2*x>=t).map(([,p])=>p));
      text=independent?`${describe('X',xs,wx)}; ${describe('Y',ys,wy)}. X and Y are independent. What is P(X + Y ≥ ${t})?`:`${describe('X',xs,wx)}. The same realised X is used twice, so the total is X + X. What is the probability this total is at least ${t}?`;
      work=steps([independent?'List independent pairs and multiply the two weights.':'The total is 2X, not a sum of independent draws.','Identify the shared randomness before constructing the sample space.'],[`Add the qualifying probabilities: P = ${value}.`,'A repeated symbol represents the same value unless a new draw is explicitly stated.']);operations=[independent?'independence':'shared-randomness','sum-event'];
    } else if(kind==='conditional') {
      const den=sum(dist.filter(([s])=>s>=t).map(([,p])=>p));let num=q(0);
      for(const [x,p]of X)for(const [y,r]of Y)if(x+y>=t&&x>=bound)num=num.add(p.mul(r));
      value=num.div(den);
      text=`${describe('X',xs,wx)}; ${describe('Y',ys,wy)}. X and Y are independent. Given that X + Y is at least ${t}, what is the probability that X is at least ${bound}?`;
      work=steps([`Restrict to pairs with X+Y ≥ ${t}; their total probability is ${den}.`,'Information about the sum couples the components.'],[`Within that set, also require X ≥ ${bound}: joint mass ${num}.`,'Multiply original independent weights for each pair, then sum qualifying pairs.'],[`Conditional probability = ${num}/${den} = ${value}.`,'Renormalise; the original marginal of X is not generally the answer.']);operations=['convolution','conditioning','conditional-dependence'];
    } else {
      value=kind==='comparison'?sum(X.flatMap(([x,p])=>Y.filter(([y])=>x>y).map(([,r])=>p.mul(r)))):sum(dist.filter(([s])=>kind==='exact'?s===t:s>=t).map(([,p])=>p));
      text=`${describe('X',xs,wx)}; ${describe('Y',ys,wy)}. X and Y are independent. ${kind==='comparison'?'What is the probability that X is strictly greater than Y?':`What is the probability that X + Y is ${kind==='exact'?'exactly':'at least'} ${t}?`}`;
      work=steps(['Pair each X outcome with each Y outcome; its probability is the product of the two weights.','The possible sums are not automatically equally likely.'],[`Add the weights of the pairs meeting the stated ${kind==='comparison'?'strict comparison':'sum condition'}: P = ${value}.`,'Several different pairs can produce the same total; ties do not satisfy a strict comparison.']);operations=['joint-distribution',kind==='comparison'?'strict-comparison':'convolution'];
    }
    return question(ID,rng,difficulty,{value,text,data,steps:work,structure:`${kind}:${data.independent===undefined?'':data.independent?'independent':'same-draw'}`,operations,
      distractors:[wrong(q(1,dist.length),'Treated the distinct possible totals as equally likely.'),wrong(q(1).sub(value),'Answered the complement.'),wrong(value.div(q(2)),'Omitted qualifying pairs.'),wrong(value.mul(q(2)),'Double counted qualifying pairs.'),wrong(q(1,2),'Assumed a symmetric answer without checking the distributions or ties.'),wrong(q(wx[1]+wx[2],wx.reduce((a,b)=>a+b,0)),'Used an unconditioned marginal rather than the event about the combined variables.')],
      picture:table(['X outcome','Probability'],X.map(([x,p])=>[x,p]),'A distribution supplies weights; a Cartesian product or a conditional subset supplies the combined model.'),
      hints:['Are these independent draws, repeated use of one draw, or a random number of draws?','List weighted outcomes, then restrict to the requested event.'],
      rule:'For independent variables, P(X+Y=s)=sum_x P(X=x)P(Y=s−x). Condition on totals or random horizons before averaging.',
      anchor:'The triangular distribution of two dice is one convolution; the method works for unequal and nonuniform distributions too.',
      fast:`Choose the correct joint sample space and add qualifying weights: ${value}.`,
      check:'All sum masses must add to 1. A conditional probability uses only the observed subset. Reusing X makes 2X; independence cannot be inserted by relabelling it.'});
  },verify:verifySums,
  lesson:simpleLesson('Combine distributions without assuming totals are uniform.','A sum of dice is a weighted distribution, not a uniform list of total values.','Multiply independent atom weights, add disjoint qualifying pairs, then renormalise if conditioned.',[
    ['Write the joint outcomes and their weights.','Independence gives a product of weights, not equal probabilities for every possible total.'],
    ['Group pairs by their total, or sum directly over the event.','This is convolution and works beyond dice.'],
    ['Condition on a random horizon or an observed sum.','Averages over horizons and conditioning on totals change which cases remain.']
  ],['Is X+X distributed like X+Y for an independent copy Y?','Generally no. X+X is 2X and has no independent second draw.'])};
export default family;
