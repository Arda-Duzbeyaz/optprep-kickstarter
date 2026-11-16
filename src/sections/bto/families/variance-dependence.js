import { question,task,q,qpow,sum,weightedMean,weightedVariance,wrong,table,steps,simpleLesson } from '../curriculum/common.js';
import { verifyVariance } from '../curriculum/verify.js';
const ID='variance-dependence';
export const VARIANCE_TASKS={2:['single','affine'],3:['sum','reuse','covariance','sample'],4:['mixture','conditional-variance']};
const family={id:ID,section:'bto',title:'Variance, covariance and shared risk',
  skill:'Measure spread; distinguish scaling, independent sums, reused randomness and a shared hidden source',levels:[2,3,4],
  generate(rng,{difficulty=2,variant}={}) {
    const kind=task(rng,difficulty,VARIANCE_TASKS,variant);
    let value,text,work,data,picture,distractors,operations;
    if(kind==='covariance') {
      let cells=Array.from({length:4},()=>rng.int(1,5));
      if(rng.chance(.3)){const a=rng.int(1,3),b=rng.int(1,3),c=rng.int(1,3),d=rng.int(1,3);cells=[a*c,a*d,b*c,b*d];}
      const [w00,w01,w10,w11]=cells,N=cells.reduce((a,b)=>a+b,0),x=q(w10+w11,N),y=q(w01+w11,N),xy=q(w11,N);
      value=xy.sub(x.mul(y));data={kind,cells};
      text=`Choose one of ${N} equally likely records. Their (X,Y) values have counts (0,0): ${w00}, (0,1): ${w01}, (1,0): ${w10}, (1,1): ${w11}. What is Cov(X,Y)?`;
      work=steps([`E[X] = ${x}, E[Y] = ${y}, E[XY] = ${xy}.`,'For binary variables, the product is 1 only when both are 1.'],[`Cov(X,Y) = E[XY] − E[X]E[Y] = ${value}.`,'Covariance records whether the joint mass exceeds or falls below the product of the marginals.']);
      picture=table(['X','Y','Count'],[[0,0,w00],[0,1,w01],[1,0,w10],[1,1,w11]],'The complete joint distribution is given; independence must be checked.');
      distractors=[wrong(xy,'Used E[XY] without subtracting the product of the means.'),wrong(x.mul(y),'Assumed independence and returned the product of the means.'),wrong(value.neg(),'Reversed the subtraction.'),wrong(q(1,10),'Guessed a small positive covariance.'),wrong(q(-1,10),'Guessed a small negative covariance.'),wrong(q(1,5),'Guessed without using the joint mass.'),wrong(q(-1,5),'Guessed without using the joint mass.')];operations=['joint-distribution','covariance','independence'];
    } else if(kind==='sample') {
      const N=rng.int(4,8),n=rng.chance(.2)?N:rng.int(2,Math.min(4,N-1)),v=q(N*N-1,12);
      value=q(n).mul(v).mul(q(N-n,N-1));data={kind,N,n};
      text=`Cards numbered 1 through ${N} are shuffled. Draw ${n} without replacement and add their values. What is the variance of the total? Use the population variance of one uniform card, (${N}²−1)/12.`;
      work=steps([`One card has variance ${v}. Two distinct draw values have covariance −${v}/(${N}−1).`,'Without replacement, a high draw removes a high value from what remains.'],[`Var(total) = ${n}×${v} + ${n}×${n-1}×(−${v}/${N-1}) = ${value}.`,'There are n variances and n(n−1) ordered cross terms.']);
      picture=table(['Quantity','Value'],[['Population size',N],['Sample size',n],['One-card variance',v],['Finite-population factor',q(N-n,N-1)]],'Drawing the entire deck produces a fixed sum and zero variance.');
      distractors=[wrong(q(n).mul(v),'Added variances as if the draws were independent.'),wrong(q(n*n).mul(v),'Treated all draws as repeated uses of the same random value.'),wrong(q(n).mul(v).mul(q(N-n,N)),'Used N rather than N−1 in the finite-population factor.'),wrong(v,'Only counted one draw.'),wrong(value.add(q(1)),'Changed the variance by an unsupported unit.'),wrong(q(2),'Guessed the spread without the covariance correction.')];operations=['without-replacement','covariance','variance-of-sum'];
    } else if(kind==='mixture'||kind==='conditional-variance') {
      const n=rng.int(2,5),prior=rng.int(1,3),rates=[rng.int(1,2),rng.int(3,4)],lights=[rng.int(1,3),rng.int(1,3)];
      const shared=kind==='conditional-variance'||rng.chance(.5),original=[q(prior,4),q(4-prior,4)];
      const unnormalised=original.map((w,i)=>w.mul(kind==='conditional-variance'?q(lights[i],4):q(1))),den=sum(unnormalised),weights=unnormalised.map(w=>w.div(den));
      const meanP=sum(weights.map((w,i)=>w.mul(q(rates[i],5))));
      const within=sum(weights.map((w,i)=>w.mul(q(n).mul(q(rates[i],5)).mul(q(5-rates[i],5)))));
      const between=sum(weights.map((w,i)=>w.mul(qpow(q(n*rates[i],5).sub(q(n).mul(meanP)),2))));
      value=shared?within.add(between):q(n).mul(meanP).mul(q(1).sub(meanP));data={kind,n,prior,rates,lights,shared};
      const setup=`Source A is selected with probability ${prior}/4, otherwise B. A trial succeeds with probability ${rates[0]}/5 from A and ${rates[1]}/5 from B. ${shared?'One source is selected once and supplies all trials. Conditional on that source, trials are independent.':'A fresh independent source choice is made for each trial, and trials are independent.'}`;
      text=`${setup} ${kind==='conditional-variance'?`A source A light is green with chance ${lights[0]}/4, a source B light with chance ${lights[1]}/4; given the source the light is independent of all trials. You see green. `:''}Let X count successes in ${n} trials. What is Var(X)?`;
      work=steps([kind==='conditional-variance'?`Update source weights using the light: ${weights.join(', ')}.`:`The per-trial marginal success chance is ${meanP}.`,kind==='conditional-variance'?'Use prior times the light likelihood, then normalise.':'A shared source creates dependence even though trials are independent conditional on it.'],[shared?`Within-source variance averaged over sources = ${within}; variance of the conditional means = ${between}.`:`Fresh independent choices give a binomial count with variance ${n}×${meanP}×(1−${meanP}).`,shared?'The law of total variance includes both parts.':'There is no single shared source linking different trials.'],[`Var(X) = ${value}.`,'Use the dependence structure in the stated experiment.']);
      picture=table(['Source','Weight after information','Trial success chance'],[['A',weights[0],q(rates[0],5)],['B',weights[1],q(rates[1],5)]],'Uncertainty about a fixed source adds a between-source term.');
      distractors=[wrong(within,'Dropped the variance of the conditional means.'),wrong(between,'Dropped the average conditional variance.'),wrong(q(n).mul(meanP).mul(q(1).sub(meanP)),'Used independent marginal trials despite a shared source.'),wrong(qpow(q(n).mul(meanP),2),'Squared the mean instead of computing variance.'),wrong(value.div(q(2)),'Halved the total spread without a model change.'),wrong(value.add(q(1)),'Added an unsupported unit.')];operations=['total-variance',shared?'shared-source-dependence':'independent-mixture',...(kind==='conditional-variance'?['bayes']:[])];
    } else {
      const values=[-rng.int(1,4),0,rng.int(2,6)],weights=Array.from({length:3},()=>rng.int(1,4)),N=weights.reduce((a,b)=>a+b,0);
      const a=kind==='single'?1:rng.pick([-3,-2,2,3]),b=rng.pick([-2,-1,1,2]),shift=rng.int(-4,5),mean=weightedMean(values,weights),variance=weightedVariance(values,weights);
      value=kind==='sum'?variance.mul(q(a*a+b*b)):kind==='reuse'?variance.mul(q((a+b)**2)):variance.mul(q(a*a));data={kind,values,weights,a,b,shift};
      const setup=`X takes ${values.map((v,i)=>`${v} with probability ${weights[i]}/${N}`).join(', ')}.`;
      text=`${setup} ${kind==='single'?'What is Var(X)?':kind==='affine'?`What is Var(${a}X + (${shift}))?`:kind==='sum'?`Y is an independent copy of X. What is Var(${a}X + (${b})Y)?`:`The same observed value X is used twice. What is Var(${a}X + (${b})X)?`}`;
      work=steps([`E[X] = ${mean}; E[X²] = ${weightedMean(values.map(x=>x*x),weights)}; Var(X) = ${variance}.`,'Variance is E[X²] − E[X]², not the square of the mean.'],[kind==='affine'?`A fixed shift does not change spread; scaling by ${a} multiplies variance by ${a*a}.`:kind==='sum'?`Independence makes covariance zero, so add ${a*a}Var(X) + ${b*b}Var(Y).`:kind==='reuse'?`Collect the same random variable first: (${a}+${b})X; square the combined coefficient.`:'Equivalently average the squared deviations from the mean.','Scaling, independent copies and reused randomness are different models.'],[`Requested variance = ${value}.`,'Variance is nonnegative and measured in squared units.']);
      picture=table(['X','Probability','X²'],values.map((x,i)=>[x,q(weights[i],N),x*x]),'The first and second moments use the same probability weights.');
      distractors=[wrong(qpow(mean,2),'Used the square of the mean.'),wrong(weightedMean(values.map(x=>x*x),weights),'Used the second moment without subtracting the squared mean.'),wrong(variance.mul(q(Math.abs(a))),'Scaled variance linearly rather than quadratically.'),wrong(variance.mul(q(a*a+b*b)),'Assumed independence even when the same X is reused.'),wrong(variance.mul(q((a+b)**2)),'Combined independent copies as though they were the same X.'),wrong(value.add(q(1)),'Added a fixed shift to a variance.'),wrong(variance.div(q(2)),'Halved spread without justification.')];operations=['variance',kind==='sum'?'independent-sum':kind==='reuse'?'shared-randomness':kind==='affine'?'affine-scaling':'moments'];
    }
    return question(ID,rng,difficulty,{ev:true,value,text,data,steps:work,picture,distractors,structure:`${kind}:${data.shared===undefined?'':data.shared?'shared':'fresh'}`,operations,
      hints:['Is the question asking for a mean, a second moment or a variance?','Check whether two terms are independent copies or share the same randomness.'],
      rule:'Var(aX+b) = a²Var(X); Var(X+Y) = Var(X)+Var(Y)+2Cov(X,Y). Total variance = mean conditional variance + variance of conditional mean.',
      anchor:'A mean locates a distribution; variance measures the average squared distance from that mean.',
      fast:`Identify the relevant covariance and scaling, then compute: ${value}.`,
      check:'A variance is nonnegative; covariance can be negative. A constant has zero variance. Independence implies zero covariance, while zero covariance alone does not generally imply independence.'});
  },verify:verifyVariance,
  lesson:simpleLesson('Understand risk rather than memorise one uniform-die variance.','Two distributions can have equal means and very different spread.','Variance squares scale; independent variances add; dependence adds covariance.',[
    ['Compute E[X²] − E[X]², or average squared deviations.','The second moment and squared mean are different quantities.'],
    ['Retain covariance when terms share a draw or a source.','A shared hidden cause creates unconditional dependence.'],
    ['Average within-source variance and add the variance of source means.','The law of total variance captures both sources of uncertainty.']
  ],['Do X+X and X+Y have the same variance when Y is an independent copy?','No. Their variances are 4Var(X) and 2Var(X), respectively.'])};
export default family;
