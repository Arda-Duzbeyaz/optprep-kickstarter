import { question,task,q,sum,weightedMean,wrong,table,steps,simpleLesson } from '../curriculum/common.js';
import { verifyPayout } from '../curriculum/verify.js';
const ID='payout-models';
export const PAYOUT_TASKS={1:['mean','profit'],2:['fair-win','cap','bonus'],3:['conditional','mixture','information']};
const family={id:ID,section:'bto',title:'Weighted payoffs and conditional expectation',
  skill:'Average payoffs with their probabilities, account for costs, and update weights before pricing new information',levels:[1,2,3],
  generate(rng,{difficulty=1,variant}={}) {
    const kind=task(rng,difficulty,PAYOUT_TASKS,variant);
    let value,text,work,data,picture,distractors,operations,ev=true;
    if(kind==='fair-win') {
      const win=rng.int(2,12),loss=rng.int(1,8);value=q(loss,win+loss);data={kind,win,loss};ev=false;
      text=`A game makes a net profit of ${win} points when it wins and loses ${loss} points otherwise. There is no other fee. What win probability makes its expected net profit exactly zero?`;
      work=steps([`Expected profit = ${win}p − ${loss}(1−p).`,'Weight both the gain and the loss; do not confuse gross return with net profit.'],[`Set it to zero: (${win}+${loss})p = ${loss}, so p = ${value}.`,'Solve the break-even equation.']);
      picture=table(['Outcome','Net profit'],[['Win',win],['Lose',-loss]],'The two payoffs are already net of the stake.');
      distractors=[wrong(q(win,win+loss),'Reversed the win and loss in the break-even fraction.'),wrong(q(loss,win),'Ignored the loss term’s dependence on 1−p.'),wrong(q(1,2),'Assumed every two-outcome game breaks even at 50%.'),wrong(q(1,win+loss),'Ignored the size of the loss.')];operations=['expected-value','break-even'];
    } else if(kind==='mixture'||kind==='information') {
      const priors=Array.from({length:3},()=>rng.int(1,3)),pays=Array.from({length:3},()=>rng.int(2,8));
      const hit=Array.from({length:3},()=>rng.int(1,3)),lights=Array.from({length:3},()=>rng.int(1,3)),N=priors.reduce((a,b)=>a+b,0);
      const weights=priors.map((w,i)=>q(w,N).mul(kind==='information'?q(lights[i],4):q(1)));
      const normaliser=sum(weights),means=pays.map((p,i)=>q(p*hit[i],4));
      value=sum(weights.map((w,i)=>w.mul(means[i]))).div(normaliser);data={kind,priors,pays,hit,lights};
      const rows=priors.map((w,i)=>`${'ABC'[i]}: selection ${w}/${N}, pays ${pays[i]} with chance ${hit[i]}/4 and 0 otherwise${kind==='information'?`, green light chance ${lights[i]}/4`:''}`);
      text=`One machine is selected secretly once. ${rows.join('; ')}. ${kind==='information'?'Given the machine, its light and payout are independent. You see a green light. ':''}What is the expected payout?`;
      work=steps([`The conditional mean payouts of A, B and C are ${means.join(', ')}.`,'First price each source on its own.'],[kind==='information'?`Green evidence weights the sources by prior × likelihood: ${weights.join(', ')}; their sum is ${normaliser}.`:`Use source probabilities ${priors.map(w=>q(w,N)).join(', ')}.` ,kind==='information'?'Normalise these new weights; observing a light is not the same as observing the payout.':'The sources are not chosen equally unless their stated weights are equal.'],[`Weighted expected payout = ${value}.`,'Total expectation averages conditional means using the appropriate prior or posterior weights.']);
      picture=table(['Machine','Prior','Mean payout',...(kind==='information'?['P(green)']:[])],priors.map((w,i)=>['ABC'[i],q(w,N),means[i],...(kind==='information'?[q(lights[i],4)]:[])]),'Averaging within each source and then over sources preserves the model.');
      const priorMean=sum(means.map((m,i)=>m.mul(q(priors[i],N))));
      distractors=[wrong(sum(means).div(q(3)),'Averaged the sources equally rather than using their probabilities.'),wrong(kind==='information'?priorMean:sum(pays.map((p,i)=>q(p*priors[i],N))),'Ignored the observation or treated the nonzero payout as certain.'),wrong(sum(weights.map((w,i)=>w.mul(means[i]))),'Used a joint weighted sum without normalising the conditional weights.'),wrong(value.mul(q(2)),'Doubled the expected payout without a second play.'),wrong(value.div(q(2)),'Halved the payout instead of averaging source-specific means.')];
      operations=kind==='information'?['bayes','conditional-expectation','total-expectation']:['total-expectation','mixture'];
    } else {
      const values=[-rng.int(1,5),rng.int(0,2),rng.int(4,10)],weights=Array.from({length:3},()=>rng.int(1,5)),N=weights.reduce((a,b)=>a+b,0);
      const fee=kind==='profit'?rng.int(1,4):0,cap=rng.int(2,values[2]-1),bonus=rng.int(1,6),threshold=values[2];
      const mean=weightedMean(values,weights);
      let outcomes=values.map(x=>x-fee),normaliser=N;
      if(kind==='cap')outcomes=values.map(x=>Math.min(x,cap));
      if(kind==='bonus')outcomes=values.map(x=>x+(x>=threshold?bonus:0));
      if(kind==='conditional')normaliser=weights[1]+weights[2];
      value=kind==='conditional'?q(values[1]*weights[1]+values[2]*weights[2],normaliser):weightedMean(outcomes,weights);
      data={kind,values,weights,fee,cap,bonus,threshold};
      const setup=`A random payoff X is ${values.map((x,i)=>`${x} points with probability ${weights[i]}/${N}`).join(', ')}.`;
      text=`${setup} ${kind==='mean'?'What is its expected payoff?':kind==='profit'?`You pay ${fee} points to play. What is your expected net profit?`:kind==='cap'?`Your final payoff is min(X, ${cap}). What is its expectation?`:kind==='bonus'?`You receive an extra ${bonus} points if X is at least ${threshold}. What is your expected final payoff?`:'You learn that X is nonnegative. What is its conditional expected value?'}`;
      work=steps([kind==='conditional'?`Remove the negative payoff and renormalise the remaining mass, ${normaliser}/${N}.`:`${kind==='cap'?`Transform every payoff using min(X,${cap})`:kind==='bonus'?`Add the ${bonus}-point bonus only on qualifying outcomes`:kind==='profit'?`Subtract the ${fee}-point fee from every outcome`:'Use the given weights, not an unweighted mean'}.`,'Translate what is paid before averaging.'],[`Expected value = ${kind==='conditional'?`${values[1]}×${weights[1]}/${normaliser} + ${values[2]}×${weights[2]}/${normaliser}`:outcomes.map((x,i)=>`(${x})×${weights[i]}/${N}`).join(' + ')} = ${value}.`,'Expectation is a probability-weighted mean.']);
      picture=table(['X','Probability','Final payoff'],values.map((x,i)=>[x,q(weights[i],N),kind==='conditional'?(x<0?'excluded':x):outcomes[i]]),'Apply the payoff rule on outcomes; then average.');
      distractors=[wrong(q(values.reduce((a,b)=>a+b,0),3),'Treated the three payoff labels as equally likely.'),wrong(mean,'Ignored the fee, transformation or conditioning.'),wrong(q(Math.min(...outcomes)+Math.max(...outcomes),2),'Used the midpoint of extremes instead of the distribution weights.'),wrong(value.neg(),'Reversed gains and losses.'),wrong(value.add(q(1)),'Changed the expectation by an unsupported unit.'),wrong(value.div(q(2)),'Arbitrarily halved the weighted mean.')];
      operations=['expected-value',...(kind==='conditional'?['conditioning']:kind==='cap'||kind==='bonus'?['payoff-transformation']:kind==='profit'?['net-versus-gross']:[])];
    }
    return question(ID,rng,difficulty,{ev,value,text,data,steps:work,picture,distractors,structure:kind,operations,
      hints:['Write what is actually paid on each possible outcome.','Use the stated probabilities; update and normalise them if information is given.'],
      rule:'E[f(X)] = sum f(x)P(X=x); net profit includes costs. E[X|information] uses the conditional probabilities.',
      anchor:'The mean die face is an equally weighted special case of an expected payoff.',
      fast:`Price the actual payoff using the correct weights: ${value}.`,
      check:kind==='fair-win'?'Substitute p into win×p − loss×(1−p); it must give zero.':'A weighted mean lies between the smallest and largest allowed final payoffs. A fixed fee lowers the mean by exactly that fee.'});
  },verify:verifyPayout,
  lesson:simpleLesson('Price uncertain outcomes and use information correctly.','Expectation is a weighted mean, not the most likely outcome.','Transform outcomes first; average with prior or posterior weights as appropriate.',[
    ['Write each net payoff and its probability.','Fees and losses count even when they are less visible than a prize.'],
    ['Apply nonlinear payoff rules before averaging.','E[f(X)] need not equal f(E[X]).'],
    ['Condition within each source, then average its mean with the updated source weights.','The law of total expectation is valid without pretending the hidden source is known.']
  ],['A game pays 10 with probability 1/10 and 0 otherwise. Is a price of 2 favourable?','No. Its mean payout is 1, so the expected net profit after paying 2 is −1.'])};
export default family;
