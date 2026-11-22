import { q, num, commonDenominator, bayesWork } from '../../sections/bto/lib.js';

const reports={
  first:['The first draw is marked.',(a,b)=>a],
  any:['You learn that at least one of the two draws is marked.',(a,b)=>Number(a||b)],
  display:['A reporter chooses one draw uniformly and tells you only whether it was marked. The report is “marked”.',(a,b)=>(a+b)/2],
  mismatch:['You learn that exactly one of the two draws is marked.',(a,b)=>Number(a!==b)],
  sensor:['A sensor reports positive. Its positive rate is 3/4 when both draws are marked and 1/4 otherwise.',(a,b)=>(a && b) ? .75 : .25],
};
export function probabilityWorld(rng,level){
  const n=rng.int(5,10),m=rng.int(6,12);
  const boxes=[[rng.int(2,Math.floor(n/2)),n],[rng.int(Math.ceil(m/2),m-2),m]];
  const simple=level<=2;
  const prior=simple?.5:rng.pick([.25,.4,.5,.6,.75]);
  const replace=rng.chance(.5);
  const report=rng.pick(simple?['first','any']:level===3?['first','any','display','mismatch']:Object.keys(reports));
  const targets=simple?['source','both','forecast']:['source','both','forecast','pay','report-rate'];
  const target=rng.pick(targets.filter(t=>t!=='both'||report!=='mismatch'));
  const reward=rng.int(3,9);
  return {boxes,prior,replace,report,target,reward};
}
export function probabilityProblem(world){
  const {boxes,prior,replace,report,target,reward}=world;
  // Use the same decimal the prompt shows, including any scientific exponent.
  const [decimal,exponent='0']=String(prior).split('e');
  const [whole,digits='']=decimal.split('.');
  const power=Number(exponent)-digits.length, coefficient=BigInt(whole+digits);
  const priorA=power<0?q(coefficient,10n**BigInt(-power)):q(coefficient*10n**BigInt(power));
  const priorB=q(1).sub(priorA), removed=Number(!replace);
  const detail=boxes.map(([red,n],i)=>{
    let evidence=q(0),numerator=q(0);
    const terms=[];
    for(const a of [0,1]) for(const b of [0,1]){
      const p1=q(a?red:n-red,n), redAfterFirst=red-removed*a, remaining=n-removed;
      const p2=q(b?redAfterFirst:remaining-redAfterFirst,remaining);
      const mass=p1.mul(p2).mul(q(4*reports[report][1](a,b),4));
      const future=q(red-removed*(a+b),n-2*removed);
      const quantity={source:q(Number(i===0)),both:q(a*b),forecast:future,pay:future.mul(reward).sub(1),'report-rate':q(1)}[target];
      evidence=evidence.add(mass);
      numerator=numerator.add(mass.mul(quantity));
      if(!mass.isZero() && !quantity.isZero()) terms.push(quantity.eq(1)?String(mass):`${mass} × (${quantity})`);
    }
    return {evidence,numerator,terms};
  });
  const [A,B]=detail;
  const mix=field=>priorA.mul(A[field]).add(priorB.mul(B[field]));
  const evidence=mix('evidence'), joint=mix('numerator');
  const exact=target==='report-rate'?evidence:joint.div(evidence), answer=exact.toNumber();
  const oldIntro=`Select box A with probability ${prior}, otherwise B. A has ${boxes[0][0]} marked tokens out of ${boxes[0][1]}; B has ${boxes[1][0]} out of ${boxes[1][1]}. All other tokens are plain. Make two draws and use the same box for any further draw. Every draw is uniform among the tokens then present. ${replace?'Return the token after each draw.':'Set aside each drawn token without returning it.'}`;
  const intro=`Choose box A with probability ${prior} and B otherwise. A has ${boxes[0][0]} marked tokens out of ${boxes[0][1]}, and B has ${boxes[1][0]} out of ${boxes[1][1]}. Draw twice uniformly from that box ${replace?'with':'without'} replacement.`;
  const asks={source:'Given this information, what is the probability the chosen box is A?',both:'Given the report, what is the chance both draws were marked?',forecast:'Given the report, what is the probability a third draw is marked?',pay:`After the report you buy one further draw for £1. It pays £${reward} if marked, zero otherwise. What is the conditional expected net gain in pounds?`, 'report-rate':'Before observing the two draws, what is the probability of receiving the following report?'};
  const observation=reports[report][0];
  const oldObservation=report==='display'?'A position chosen uniformly from the two is displayed. Its token is marked.':observation;
  const oldText=target==='report-rate'?[oldIntro,asks[target],oldObservation].join(' '):[oldIntro,oldObservation,asks[target]].join(' ');
  const ask={
    source:'What is the probability you chose A?',
    both:'What is the probability both draws were marked?',
    forecast:'What is the probability a third draw from the same box is marked?',
    pay:`A third draw from the same box costs £1. It pays £${reward} if marked and £0 otherwise. What is your expected net gain in pounds?`,
  };
  const text=target==='report-rate'?[intro,'What is the probability of the following report?',observation].join(' '):[intro,observation,ask[target]].join(' ');
  const reportingRule={
    first:'Keep just the outcomes with a marked first draw.',
    any:'Subtract the probability of two plain tokens from one.',
    display:'Both marked tokens always give the report. Exactly one marked token gives it half the time.',
    mismatch:'Add the two orders with exactly one marked token.',
    sensor:'Weight both-marked paths by 3/4, all other paths by 1/4.',
  }[report];
  const reportCalculation=([red,n])=>{
    const blue=n-red, twoRed=`${red}/${n} × ${red-removed}/${n-removed}`;
    return {
      first:`${red}/${n}`,display:`${red}/${n}`,
      any:`1 − ${blue}/${n} × ${blue-removed}/${n-removed}`,
      mismatch:`2 × ${red}/${n} × ${blue}/${n-removed}`,
      sensor:`1/4 + (3/4 − 1/4) × (${twoRed})`,
    }[report];
  };
  const perBox=boxes.map(([red,n])=>target==='both'?red/n*(red-Number(!replace))/(n-Number(!replace)):target==='pay'?reward*red/n-1:red/n);
  const unchecked=target==='source'?prior:prior*perBox[0]+(1-prior)*perBox[1];
  const method=target==='report-rate'?'Add the report probabilities weighted by the chances of choosing their boxes.':
    target==='pay'?'Divide the weighted net gain by the report probability.':'Divide favourable report weight by total report weight.';
  const wrong=target==='report-rate'?[
    [A.evidence,'Assumed box A was always chosen.'],[B.evidence,'Assumed box B was always chosen.'],
    [priorA.mul(A.evidence),'Counted the report only when box A was chosen.'],[q(1).sub(evidence),'Found the probability of the opposite report.'],
  ]:[
    [unchecked,'Used the probabilities before the report.'],
    [joint,'Kept the weighted numerator without dividing by the report probability.'],
    [A.numerator.add(B.numerator).div(A.evidence.add(B.evidence)),'Treated the two boxes as equally likely before the report.'],
    ...(['both','forecast','pay'].includes(target)?detail.map(({numerator,evidence},i)=>[numerator.div(evidence),`Assumed the chosen box was ${'AB'[i]}.`]):[[1-answer,'Found the chance box B was chosen.']]),
  ];
  const reportSum=`${priorA} × ${A.evidence} + ${priorB} × ${B.evidence}`;
  const {left,right,denominator}=commonDenominator(joint,evidence);
  const numeratorExplanation=target==='both'?'In each box, multiply the probability of two marked draws by the chance that those draws give the report.'
    : target==='pay'?'For each pair of draws, multiply its probability by the report likelihood and by the expected net gain on a third draw.'
    : 'For each pair of draws, multiply its probability by the report likelihood and by the chance the third draw is marked.';
  const steps=[
    {say:reportingRule,why:replace?'Replacement leaves each box’s marked fraction unchanged.':'Without replacement, the first draw changes the second draw’s fractions.',
      math:boxes.map((box,i)=>`P(report | ${'AB'[i]}) = ${reportCalculation(box)} = ${detail[i].evidence}`).join('. ')},
  ];
  if(target==='report-rate'){
    steps.push({say:method,why:'The report can come from either box, and the two paths are disjoint.',math:`P(report) = ${reportSum} = ${exact}`});
  }else if(target==='source'){
    const work=bayesWork(priorA,A.evidence,B.evidence);
    steps.push(
      {say:method,why:'The numerator is the path through A. The denominator includes the paths through both boxes.',math:`P(A | report) = ${work.setup}`},
      {say:`Express both weighted paths over ${work.denominator} and cancel it.`,why:'The resulting integers give the relative likelihood of coming from each box.',math:work.reduced},
    );
  }else{
    steps.push(
      ...detail.map(({terms,numerator},i)=>({
        say:i===0?numeratorExplanation:'Repeat the same calculation within box B.',
        why:`Each weight includes the chance that the first two draws produce the observed report in box ${'AB'[i]}.`,
        math:`${'AB'[i]}: ${terms.join(' + ') || '0'} = ${numerator}`,
      })),
      {say:method,why:'The denominator is the same across all outcomes compatible with the report.',math:`(${priorA} × ${A.numerator} + ${priorB} × ${B.numerator}) / (${reportSum})`},
      {say:`Write the weighted numerator and denominator over ${denominator}, then cancel it.`,why:'This leaves an integer ratio.',math:`(${joint}) / (${evidence}) = ${left}/${right}${exact.toString()===`${left}/${right}`?'':` = ${exact}`}`},
    );
  }
  return {text,oldText,value:answer,exact:exact.toString(),method,mode:'box-experiment',operations:[replace?'replace':'deplete',report,target],params:world,prob:target!=='pay',
    hints:['Find the chance of the report separately for each box.',reportingRule],
    steps,
    distractors:wrong.map(([value,misconception])=>({value:num(value),misconception})),
  };
}
export default (rng,level)=>probabilityProblem(probabilityWorld(rng,level));
