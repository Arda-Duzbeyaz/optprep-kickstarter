import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { validateItem } from '../../src/core/contract.js';
import { compositeItem,sequenceItem } from '../../src/scenarios/index.js';
import { probabilityProblem } from '../../src/scenarios/composite/probability.js';
import { stoppedProcess } from '../../src/scenarios/composite/stopping.js';
import { priceProblem } from '../../src/scenarios/composite/pricing.js';
import { bruteForceBest } from '../../src/sections/ob/solver.js';
import { generateTrials } from '../../src/zapn/theswitch/engine.js';
import { generateRound,editCount } from '../../src/zapn/codecompare/engine.js';
import { createEngine as shape } from '../../src/zapn/shapeshift/engine.js';

const sum=a=>a.reduce((x,y)=>x+y,0);
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),a+' expected '+b);
function urn(w){
  let normal=0,weighted=0;
  for(const [i,[r,n]] of w.boxes.entries()){
    const prior=i===0?w.prior:1-w.prior,den=n*(w.replace?n:n-1)*(w.replace?n:n-2);
    for(let a=0;a<n;a++)for(let b=0;b<n;b++)for(let c=0;c<n;c++){
      if(!w.replace&&(a===b||a===c||b===c))continue;
      const x=a<r,y=b<r,z=c<r;
      const report={first:Number(x),any:Number(x||y),display:(Number(x)+Number(y))/2,
        mismatch:Number(x!==y),sensor:(x && y) ? .75 : .25}[w.report];
      const mass=report*prior/den;normal+=mass;
      weighted+=mass*({source:Number(i===0),both:Number(x&&y),forecast:Number(z),pay:w.reward*Number(z)-1,'report-rate':1}[w.target]);
    }
  }
  return w.target==='report-rate'?normal:weighted/normal;
}
function stop(w){
  let win=0,last=0,time=0,cash=0;
  function visit(progress,previousMiss,attempts,mass){
    if(progress===w.needed||attempts===w.horizon){
      const hit=progress===w.needed;
      win+=mass*hit;last+=mass*Number(hit&&attempts===w.horizon);time+=mass*attempts;
      cash+=mass*((hit?w.reward:0)-attempts*w.cost);return;
    }
    const p=previousMiss?w.afterMiss:w.p;
    visit(progress+1,false,attempts+1,mass*p);visit(w.reset?0:progress,true,attempts+1,mass*(1-p));
  }
  visit(w.start,false,0,1);
  return {win,attempts:time,'last-win':last,conditional:last/win,net:cash}[w.target];
}
function arrangements(w){
  let seen=0,good=0;
  for(let mask=0;mask<2**w.seats;mask++){
    const cells=mask.toString(2).padStart(w.seats,'0');
    if([...cells].filter(x=>x==='1').length!==w.red)continue;
    if(w.report==='first-red'&&cells[0]!=='1'||w.report==='first-plain'&&cells[0]!=='0'||w.report==='ends-differ'&&cells[0]===cells.at(-1))continue;
    seen++;
    const starts=[...cells].filter((x,i)=>x==='1' && (i===0 ? !w.circle||cells.at(-1)==='0':cells[i-1]==='0')).length;
    good+=w.event==='separate'?starts===w.red:starts===1;
  }return w.askCount?good:good/seen;
}
function production(w){
  const a=w.hours,b=w.hoursB==='shared'?a+w.overtime:w.second;
  const output=(h,j,r=w.rate)=>h*r*w.yieldA+j*w.rateB*w.yieldB;
  const total=output(a,b);
  if(w.target==='hours'){
    const matches=[];
    for(let i=0;i<50;i++){const j=w.hoursB==='shared'?i+w.overtime:w.hoursB==='fixed-total'?a+b-i:b;if(j>=0&&output(i,j)===total)matches.push(i);}
    assert.equal(matches.length,1);return matches[0];
  }
  if(w.target==='rate')return (total-output(0,b))/(a*w.yieldA);
  if(w.target==='extra')return output(a,b)+b*w.overtime*w.yieldB-total;
  return {output:total,fraction:100*output(a,0)/total,'combined-rate':total/(a+b)}[w.target];
}
function tariff(w){
  const invoice=q=>{let v=w.fee;for(let i=1;i<=q;i++)v+=(w.policy==='whole-order'?q:i)>w.threshold?w.high:w.low;return v*(100-w.rebate)/100;};
  if(w.task==='quantity'){
    const candidates=Array.from({length:60},(_,i)=>i).filter(i=>Math.abs(invoice(i)-invoice(w.n))<1e-8);
    assert.equal(candidates.length,1);return candidates[0];
  }
  return {bill:invoice(w.n),average:invoice(w.n)/w.n,increment:invoice(w.n+w.extra)-invoice(w.n),split:invoice(w.n)+invoice(w.extra)-invoice(w.n+w.extra)}[w.task];
}
function sequence(w){
  // Recover from the displayed sequence by undoing, or extending, the visible differences.
  const gaps=[w.start];
  for(let i=1;i<w.length;i++)gaps.push((i+w.phase)%2===0?gaps[i-1]*w.factor:gaps[i-1]+w.step);
  return w.path==='levels'?gaps[w.hidden]:w.offset+sum(gaps.slice(0,w.hidden));
}
function policies(w){
  const units=w.rows.flatMap(([hits,misses],group)=>Array.from({length:hits+misses},(_,i)=>({group,hit:i<hits})));
  const groups=[units.filter(x=>x.group===0),units.filter(x=>x.group===1)];
  return w.policies.map(policy=>{
    let total=0,good=0;
    if(['population','inverse','restrict','union','joint','equal-group'].includes(policy)){
      for(const x of units){
        const a=x.group===0, h=x.hit;
        if(policy==='inverse'&&!h||policy==='restrict'&&a)continue;
        const mass=policy==='equal-group'?1/groups[x.group].length:1;
        total+=mass;good+=mass*({population:h,inverse:a,restrict:h,union:a||h,joint:a&&h,'equal-group':h}[policy]);
      }
    }else for(const x of units)for(const y of units){
      let mass=1,hit=x.hit&&y.hit;
      if(policy==='pair' && x===y)continue;
      if(policy==='one-each'){if(x.group!==0||y.group!==1)continue;hit=x.hit!==y.hit;}
      if(['same-group','after-observation'].includes(policy)){
        const n=groups[x.group].length;
        if(x.group!==y.group || (policy==='same-group'?x===y:!x.hit))continue;
        mass=1/(n*(policy==='same-group'?n-1:n));
      }
      total+=mass;good+=mass*hit;
    }return good/total;
  });
}
function spinners(w){
  const wheels=w.weights.map(row=>row.flatMap((n,i)=>Array(n).fill(i+1)));
  return w.selected.map(({pair,report})=>{
    let eligible=0,hits=0;
    for(const a of wheels[Number(pair[0]==='B')])for(const b of wheels[Number(pair[1]==='B')])for(const displayed of [a,b]){
      if(report==='distinct'&&a===b||report==='firstHigh'&&a<2||report==='shownTwo'&&displayed!==2)continue;
      eligible++;hits+=Number({total:a+b>=w.k,match:a===b,above:a>b,adjacent:Math.abs(a-b)===1}[w.target]);
    }return hits/eligible;
  });
}
function meters(w){
  const records=w.groups.flatMap(g=>g.meters);
  const day=sum(records.map(r=>r[0])),night=sum(records.map(r=>r[1]));
  switch(w.rule){
    case 'total':return day+night;
    case 'average':return (day+night)/(2*records.length);
    case 'night-share':return 100*night/(day+night);
    case 'peak':return sum(records.map(r=>Math.max(...r)));
    case 'excess':return sum(records.flat().filter(x=>x>w.cap).map(x=>x-w.cap));
    case 'shift-savings':return day-sum(records.map(([d])=>Math.max(0,d-w.cap)));
  }
}
function checkPlanning(w,truth){
  const basis={residents:59597542,crossing:2467,equator:Math.PI*12756,generation:14000}[w.base];
  const cap=w.team*w.rate*w.efficiency;
  const workload=w.task==='time'?truth*cap:w.task==='rate'?truth*w.team*w.hours*w.efficiency:
    w.task==='unserved'?truth*cap/(1-w.share/100):truth/(w.share/100/cap+(1-w.share/100)/(w.next*w.rate*w.efficiency));
  near(workload*100/w.fraction,basis);
}
function recurrence(w){
  const initial=w.gaps?[w.start,w.start+w.a,w.start+w.a+w.b]:[w.a,w.b];
  const coefficients={sum:[1,1],recent:[1,2],early:[2,1],difference:[-1,2]}[w.law];
  while(initial.length<w.length){
    const x=initial.at(-1),y=initial.at(-2),z=initial.at(-3);
    const delta=w.gaps?(y-z)*coefficients[0]+(x-y)*coefficients[1]:y*coefficients[0]+x*coefficients[1];
    initial.push(w.gaps?x+delta:delta);
  }
  assert.deepEqual(initial.flatMap((v,j)=>v===w.visible[j]?[]:[j]),[w.index]);
  return initial[w.index];
}
const numeric={'sequence-recurrence':recurrence,'box-experiment':urn,'stopped-process':stop,'restricted-arrangements':arrangements,'production-network':production,tariff,'sequence-machine':sequence};
for(const section of ['bto','nl','ll','iv','ob','sequence'])test('independent v2 oracle over 720 draws: '+section,()=>{
  const models=new Set();
  for(let i=0;i<240;i++)for(const level of [1,2,3]){
    const rng=makeRng('independent-v2:'+i+':'+level);
    const q=section==='sequence'?sequenceItem(rng,level):compositeItem(section,rng,level);
    assert.deepEqual(validateItem(q),[]);const name=q.transfer.model;models.add(name);
    if(q.kind==='mcq'){
      const value=numeric[name](q.params);near(q.options[q.answerIndex].value,value);
      const distances=q.options.map(o=>Math.abs(Number(o.label)-value));
      assert.equal(distances.indexOf(Math.min(...distances)),q.answerIndex);
      assert.ok(distances.filter(x=>Math.abs(x-distances[q.answerIndex])<1e-10).length===1);
    }else if(q.kind==='rank'){
      const ps=name==='weighted-experiments'?spinners(q.params):policies(q.params);
      ps.forEach((p,j)=>near(q.statements[j].p,p));assert.equal(new Set(ps).size,3);
    }else if(q.kind==='interval'){
      if(name==='planning-estimate'){checkPlanning(q.params,q.truth);assert.ok(q.reference);}
      else if(name==='population-survey'){
        const {groups,goal,area}=q.params;
        const totals=groups.map(g=>g.size),n=sum(totals);
        near(q.truth,{total:n,unmarked:n-sum(groups.map(g=>g.marked)),density:n/area,share:100*totals[0]/n}[goal]);
        groups.forEach((g,j)=>{const shown=q.prompt.visual.rows[j][2];
          assert.equal(shown,g.samples.map(ids=>{assert.equal(new Set(ids).size,ids.length);assert.ok(ids.every(i=>i>=0&&i<g.size));return ids.filter(i=>i<g.marked).length+' / '+ids.length;}).join('; '));});
      }else near(q.truth,meters(q.params));
    }else{
      const best=bruteForceBest(q.board,6);near(best?.profit??0,q.best?.profit??0);
      if(!best)for(const b of q.board.instruments){const v=sum(b.legs.map((x,j)=>x*q.params.v[j]));assert.ok(b.bid<=v&&v<=b.ask);}
    }
  }
  assert.equal(models.size,{bto:3,nl:2,ll:2,iv:3,ob:1,sequence:2}[section]);
});
test('matched observations, stopping and pricing rules change the mathematical answer',()=>{
  const w={boxes:[[2,6],[6,8]],prior:.5,replace:false,target:'both',reward:4};
  const a=probabilityProblem({...w,report:'any'}),b=probabilityProblem({...w,report:'display'});
  assert.ok(Math.abs(a.value-b.value)>.05);
  for(const q of [a,b])near(q.value,urn(q.params));
  const s={horizon:4,needed:2,start:0,p:.5,afterMiss:.5,cost:1,reward:4,target:'win'};
  assert.ok(stoppedProcess({...s,reset:true}).value<stoppedProcess({...s,reset:false}).value);
  const t={n:12,threshold:10,low:3,high:5,fee:2,rebate:10,task:'bill',extra:3};
  near(priceProblem({...t,policy:'whole-order'}).value-priceProblem({...t,policy:'marginal'}).value,18);
});
test('default game schedules balance conflict and spatial coverage and progress toward closer codes',()=>{
  let early=0,late=0;
  for(let i=0;i<180;i++){
    const rng=makeRng(i),trials=generateTrials(rng,35);
    for(const switched of [true,false]){
      const counts=[0,0,0,0];for(const t of trials.filter(x=>x.switch===switched)){
        counts[Number(t.answer)+2*Number((t.math.value%2===1)!==t.arrows.same)]++;
      }assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
    }
    for(const shapeName of ['circle','square']){
      const cells=[0,0,0,0];for(const t of shape(rng).state.trials.filter(t=>t.shape===shapeName))cells[Number(t.x>=.5)+2*Number(t.y>=.5)]++;
      assert.ok(Math.max(...cells)-Math.min(...cells)<=1);
    }
    for(const j of [0,29]){
      const round=generateRound(rng,j),edits=sum(round.options.map(x=>editCount(x,round.target)));
      if(j===0)early+=edits;else late+=edits;
    }
  }assert.ok(late<early*.85);
});
