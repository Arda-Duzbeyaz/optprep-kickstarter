const f=x=>String(Number(x.toFixed(4)));
const reports={
  first:['The first draw is marked.',(a,b)=>a],
  any:['You learn that at least one of the two draws is marked.',(a,b)=>Number(a||b)],
  display:['A position chosen uniformly from the two is displayed. Its token is marked.',(a,b)=>(a+b)/2],
  mismatch:['You learn that exactly one of the two draws is marked.',(a,b)=>Number(a!==b)],
  sensor:['A sensor reports positive. Its positive rate is 3/4 when both draws are marked and 1/4 otherwise.',(a,b)=>(a && b) ? .75 : .25],
};
export function probabilityWorld(rng,level){
  const n=rng.int(5,10),m=rng.int(6,12);
  const boxes=[[rng.int(2,Math.floor(n/2)),n],[rng.int(Math.ceil(m/2),m-2),m]];
  const prior=level===1?.5:rng.pick([.25,.4,.5,.6,.75]);
  const replace=rng.chance(.5);
  const report=rng.pick(level===1?['first','any']:Object.keys(reports));
  const targets=level===1?['source','both','forecast']:['source','both','forecast','pay','report-rate'];
  const target=rng.pick(targets.filter(t=>t!=='both'||report!=='mismatch'));
  const reward=rng.int(3,9);
  return {boxes,prior,replace,report,target,reward};
}
export function probabilityProblem(world){
  const {boxes,prior,replace,report,target,reward}=world;
  const detail=boxes.map(([red,n],i)=>{
    let evidence=0,numerator=0;
    for(const a of [0,1]) for(const b of [0,1]){
      const p1=red/n, p2=(red-(replace?0:a))/(n-(replace?0:1));
      const mass=(a?p1:1-p1)*(b?p2:1-p2)*reports[report][1](a,b);
      const future=(red-(replace?0:a+b))/(n-(replace?0:2));
      const quantity={source:Number(i===0),both:a*b,forecast:future,pay:reward*future-1,'report-rate':1}[target];
      evidence+=mass;numerator+=mass*quantity;
    }
    return {evidence,numerator};
  });
  const mix=field=>prior*detail[0][field]+(1-prior)*detail[1][field];
  const evidence=mix('evidence'),answer=target==='report-rate'?evidence:mix('numerator')/evidence;
  const intro=`Select box A with probability ${prior}, otherwise B. A has ${boxes[0][0]} marked tokens out of ${boxes[0][1]}; B has ${boxes[1][0]} out of ${boxes[1][1]}. All other tokens are plain. Make two draws and use the same box for any further draw. Every draw is uniform among the tokens then present. ${replace?'Return the token after each draw.':'Set aside each drawn token without returning it.'}`;
  const asks={source:'Given this information, what is the probability the chosen box is A?',both:'Given the report, what is the chance both draws were marked?',forecast:'Given the report, what is the probability a third draw is marked?',pay:`After the report you buy one further draw for £1. It pays £${reward} if marked, zero otherwise. What is the conditional expected net gain in pounds?`, 'report-rate':'Before observing the two draws, what is the probability of receiving the following report?'};
  const observation=reports[report][0];
  const text=target==='report-rate'?[intro,asks[target],observation].join(' '):[intro,observation,asks[target]].join(' ');
  const working=`P(report | A) ≈ ${f(detail[0].evidence)}, P(report | B) ≈ ${f(detail[1].evidence)}. Weighting the two gives P(report) ≈ ${f(evidence)}.`;
  const method=target==='report-rate'?'Sum the paths that produce the stated observation across both boxes.':
    `Within each box weight every outcome by its chance of yielding the report and its requested value. The combined weighted numerator is ${f(mix('numerator'))}. Divide by the report probability.`;
  return {text,value:answer,working,method,mode:'box-experiment',operations:[replace?'replace':'deplete',report,target],params:world,prob:target!=='pay',
    rivals:[prior,evidence,detail[0].numerator/detail[0].evidence,detail[1].numerator/detail[1].evidence,1-answer]};
}
export default (rng,level)=>probabilityProblem(probabilityWorld(rng,level));
