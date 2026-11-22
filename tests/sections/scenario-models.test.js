import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/rng.js';
import { validateItem } from '../../src/core/contract.js';
import { checkItem } from '../../src/core/check.js';
import { questionKey } from '../../src/core/questions.js';
import { makeStore,memoryBackend } from '../../src/core/store.js';
import { scenarioItem } from '../../src/scenarios/index.js';
import { buildPaper } from '../../src/scenarios/paper.js';
import { composeEvent } from '../../src/scenarios/compose.js';
import { SECTION_MODULES } from '../../src/sections/index.js';
import { bruteForceBest } from '../../src/sections/ob/solver.js';
import { independent } from '../../src/checks/independent.js';
import { repairEvidence,intervalTrend } from '../../src/core/coach-evidence.js';

const sum=arr=>arr.reduce((a,b)=>a+b,0);
const near=(x,y,msg)=>assert.ok(Math.abs(x-y)<1e-8*Math.max(1,Math.abs(y)),msg+' '+x+' ≠ '+y);
const number=q=>q.options[q.answerIndex].value;
function probabilityOracle(q) {
  const {n,r,m,w}=q.params, mode=q.transfer.structure;
  let num=0,den=0;
  if(['shown','any','exactly'].includes(mode)){
    for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(i!==j){
      if(mode==='exactly'){
        if((i<r)===(j<r))continue;
        for(let l=0;l<n;l++)if(l!==i && l!==j){den++;num+=l<r;}
      }else if(mode==='any'){if(i<r||j<r){den++;num+=i<r && j<r;}}
      else for(const first of [true,false])if((first?i:j)<r){den++;num+=(first?j:i)<r;}
    }
    return num/den;
  }
  if(mode==='predict-after-two'){
    for(const [reds,weight] of [[r,w],[m,1-w]])for(let i=0;i<n;i++)for(let j=0;j<n;j++)for(let k=0;k<n;k++){
      if(i>=reds||j>=reds)continue;
      den+=weight/n**3;
      if(k<reds)num+=weight/n**3;
    }
    return num/den;
  }
  let ex=0,ey=0,exy=0;
  for(const [reds,weight,type] of [[r,w,'A'],[m,1-w,'B']])for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    const mass=weight/n**2, x=i<reds, y=j<reds;
    ex+=mass*x;ey+=mass*y;exy+=mass*x*y;
    if(x){den+=mass;num+=mass*(mode==='posterior'?type==='A':y);}
  }
  return mode==='covariance'?exy-ex*ey:num/den;
}

function numericOracle(q){
  const {a,b,x,y,price,rise,cut,efficiency,baseGap,addGap}=q.params,ans=number(q);
  switch(q.transfer.structure){
    case 'ratio':near(ans/(x*(a+b)),1-a/(a+b),'non-rail proportion');break;
    case 'convert':near(ans*1000/(60*b),x/a,'litres per sec');break;
    case 'change':near(ans/(1-cut/100)-price,price*rise/100,'undo discount');break;
    case 'reverse':near(ans*(100+rise)*(100-cut)/10000,Number(q.prompt.text.match(/£(\d+(?:\.\d+)?)/)[1]),'reproduce final price');break;
    case 'weighted':near(ans*(a+b),sum(q.prompt.visual.rows.map(row=>row[2])),'total jobs');break;
    case 'missing':near(a*x+b*ans,a*x+b*y,'total jobs');break;
    case 'capacity':near(ans/efficiency/a,x+y,'combined output');break;
    case 'target':near((a*10*x+ans*(x+(baseGap+addGap)*b))/(a*10+ans),x+baseGap*b,'concentration');break;
  }
}

function rankOracle(q){
  const {n,r}=q.params,rows=q.prompt.visual?.rows;
  const solve=label=>{
    switch(q.transfer.model){
      case 'experiments':{
        if(label.startsWith('Hidden'))return (r-1)/(n-1);
        if(label.startsWith('Two reds'))return r*(r-1)/(n*(n-1));
        if(label.startsWith('One red draw'))return r*q.params.ratio/(n*6);
        if(label.startsWith('Both of')){let hits=0;for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)hits+=a>q.params.ratio && b>q.params.ratio;return hits/36;}
        let hits=0;for(let a=0;a<n;a++)for(let b=0;b<n;b++)hits+=label.startsWith('Exactly')?((a<r)!==(b<r)):(a<r || b<r);return hits/n**2;
      }
      case 'draws':return label.includes('non-red')?r/(n-1):label.startsWith('Replace')?r/n:(r-1)/(n-1);
      case 'observed':{
        let numerator=0,denominator=0;
        for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(i!==j){
          const weight=label.startsWith('A uniformly')?(Number(i<r)+Number(j<r))/2:
            label.startsWith('At least')?Number(i<r || j<r):1;
          denominator+=weight;numerator+=weight*Number(i<r && j<r);
        }return numerator/denominator;
      }
      case 'pool':return label.includes('line uniformly')?sum(rows.map(v=>v[2]/v[1]))/2:label.includes('West')?rows[0][2]/rows[0][1]:sum(rows.map(v=>v[2]))/sum(rows.map(v=>v[1]));
      case 'close':{const row=rows.find(v=>v[0]===label);return row[1]/row[2];}
      case 'density':{const masses=rows.map(([s,d])=>{const [lo,hi]=s.match(/\d+/g).map(Number);return (hi-lo)*d;});return masses[rows.findIndex(v=>v[0]===label)]/sum(masses);}
    }
  };
  q.statements.forEach(s=>near(s.p,solve(s.text),'statement probability'));
}
function intervalOracle(q){
  const {k,days,speed,populationLog}=q.params;
  if(populationLog){assert.equal(q.truth,sum(populationLog.flat()));return;}
  const checks={population:()=>q.truth*1e6/k,production:()=>q.truth*1e6/(k*days),
    surface:()=>Math.sqrt(q.truth*1e6*100/k/(4*Math.PI)),journey:()=>q.truth*speed*100/k/Math.PI,
    orbital:()=>q.truth*speed*1000*60/k,bridge:()=>q.truth*speed/3.6-k*10,hydropower:()=>q.truth/(days*24)*100/speed};
  const facts={population:59597542,production:59597542,surface:3390,journey:12756,orbital:150e6,bridge:2467,hydropower:14};
  near(checks[q.transfer.structure](),facts[q.transfer.structure],q.reference);
  assert.match(q.reference,/^https:\/\//);
}
for(const id of ['bto','nl','ll','iv','ob'])test(id+' scenario mathematics and choice integrity at all three levels',()=>{
  const types=new Set();
  for(let seed=0;seed<160;seed++)for(let level=1;level<=3;level++){
    const q=scenarioItem(id,makeRng(seed+':'+level),level);
    assert.deepEqual(validateItem(q),[]);types.add(q.transfer.model);
    if(q.kind==='mcq'){
      assert.equal(new Set(q.options.map(o=>Number(o.label))).size,5);
      assert.equal(q.options.filter(o=>o.misconception===null).length,1);
    }
    if(id==='bto')near(number(q),probabilityOracle(q),q.transfer.structure);
    if(id==='nl')numericOracle(q);
    if(id==='ll')rankOracle(q);
    if(id==='iv')intervalOracle(q);
    if(id==='ob'){
      const verified=bruteForceBest(q.board,6);
      assert.equal(verified?.profit??null,q.best?.profit??null);
      assert.equal(checkItem(q,{pass:true}).correct,!verified);
      if(verified) assert.equal(checkItem(q,{trades:q.best.trades}).score,1);
      if(q.params.direction==='none')assert.equal(verified,null);else assert.ok(verified);
    }
  }
  assert.equal(types.size,{bto:7,nl:8,ll:6,iv:9,ob:12}[id]);
});

test('composed questions preserve original evidence and agree with a branch-outcome oracle',()=>{
  const store=makeStore(memoryBackend()),modes=new Set(),f=SECTION_MODULES.bto.families.find(f=>f.id==='conditional-dice');
  for(let i=0;i<200;i++){
    const rng=makeRng(i),base=f.generate(rng,{difficulty:2}),q=composeEvent(base,rng);
    if(!q.composition)continue;
    const {p,n,mode,prize,sensitivity:s,falseAlarm:a}=q.composition;
    modes.add(mode);
    const weights=[(1-p)*(1-a),(1-p)*a,p*(1-s),p*s];
    const hit=Array.from({length:2**n},(_,mask)=>{
      const bits=mask.toString(2).padStart(n,'0'),successes=bits.replaceAll('0','').length;
      return {mask,prob:p**successes*(1-p)**(n-successes)};
    });
    const expected=mode==='signal'?weights[1]+weights[3]:mode==='posterior'?weights[3]/(weights[1]+weights[3]):
      mode==='first-hit'?hit[1].prob:sum(hit.map(h=>h.prob*(h.mask?prize-1:-1)));
    near(number(q),expected,mode);store.rememberQuestion(q);
    assert.ok(store.recentQuestionKeys('bto').has(questionKey(base)));
  }
  assert.equal(modes.size,4);
});

test('timed NumberLogic applies configured shares and excludes previous exposures',()=>{
  for(const [mix,count] of [['sequences',0],['balanced',9],['broad',17]]){
    const history=new Set();
    for(let i=0;i<6;i++){
      const paper=buildPaper(SECTION_MODULES.nl,{count:26,ramp:true,excludeKeys:history},'exam'+i,mix);
      assert.equal(paper.filter(q=>['numerical-data','production-network','tariff'].includes(q.family)).length,count);
      for(const q of paper){const key=questionKey(q);assert.ok(!history.has(key));history.add(key);}
    }
  }
});

test('third reserved form independent keys and board certificates',()=>{
  assert.deepEqual(independent.bto.map(q=>q.answer),[.5,6/10,15/8,2/6,1/5]);
  assert.deepEqual(independent.nl.map(q=>q.answer),[(600-60*8)/(12-8),88*3/8-5,1/(1/6-1/10),6.25,7+5-2].map(v=>Number(v.toFixed(8))));
  const orders=[[2,0,1],[1,0,2],[1,0,2],[1,0,2],[1,2,0]];
  assert.deepEqual(independent.ll.map(q=>q.answerOrder),orders);
  for(const q of independent.ob)assert.equal(bruteForceBest(q.board,6)?.profit??null,q.best?.profit??null);
  for(const q of independent.iv)assert.equal(q.truth,sum(q.explanation.split('record is ')[1].match(/\d+/g).map(Number)));
});

test('coach needs supporting evidence and records the direction and width of timed misses',()=>{
  const state={runs:[],settings:{}},now=Date.UTC(2026,10,20),skill='x',section='nl',exam={finishedAt:now,timing:{count:10,totalSeconds:300},items:[]};
  const diag=()=>repairEvidence(state,section,skill,exam,now)?.kind;
  assert.equal(diag(),undefined);
  const run=(family,correct)=>({section,mode:'practice',finishedAt:now,family,items:Array.from({length:4},()=>({family:skill,correct}))});
  state.runs=[run(skill,true),run(null,false)];assert.equal(diag(),'recognition');
  state.runs=[run(skill,false)];assert.equal(diag(),'knowledge');
  state.runs=[];exam.items=[1,2].map(()=>({family:skill,outcome:'right',ms:31000}));assert.equal(diag(),'speed');
  state.settings.executionSlips={'nl:x':now};assert.equal(diag(),'accuracy');
  const rows=intervalTrend([{section:'iv',mode:'exam',finishedAt:now,items:[{widthRatio:2,outcome:'wide'},{widthRatio:6,outcome:'above'}]}]);
  assert.deepEqual(rows[0],{at:now,n:2,inside:1,low:1,high:0,median:4});
});
