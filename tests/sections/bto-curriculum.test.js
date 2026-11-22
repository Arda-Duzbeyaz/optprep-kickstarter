import { test } from 'node:test';
import assert from 'node:assert/strict';
import events,{EVENT_TASKS} from '../../src/sections/bto/families/event-algebra.js';
import counts,{COUNT_TASKS} from '../../src/sections/bto/families/success-counts.js';
import payout,{PAYOUT_TASKS} from '../../src/sections/bto/families/payout-models.js';
import counting,{COUNTING_TASKS} from '../../src/sections/bto/families/restricted-counting.js';
import variance,{VARIANCE_TASKS} from '../../src/sections/bto/families/variance-dependence.js';
import sums,{SUM_TASKS} from '../../src/sections/bto/families/discrete-sums.js';
import first from '../../src/sections/bto/families/first-success.js';
import urn from '../../src/sections/bto/families/urn-draws.js';
import monty from '../../src/sections/bto/families/monty-hall.js';
import { makeRng } from '../../src/core/rng.js';
import { validateItem } from '../../src/core/contract.js';
import { finiteVariants } from '../../src/practice/finite-variants.js';
import { questionKey } from '../../src/core/questions.js';
import { structureKey } from '../../src/transfer/profile.js';
import { presentation } from '../../src/core/presentation.js';
const models=[[events,EVENT_TASKS],[counts,COUNT_TASKS],[payout,PAYOUT_TASKS],[counting,COUNTING_TASKS],[variance,VARIANCE_TASKS],[sums,SUM_TASKS]];
export { models };
const almost=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
for(const [family,tasks] of models)for(const [level,kinds]of Object.entries(tasks))for(const variant of kinds) {
  test(`curriculum ${family.id}/${level}/${variant}: 128 reproducible outcome checks, choices and explanation contracts`,()=>{
    for(let seed=0;seed<128;seed++) {
      const label=`curriculum-regression:${family.id}:${level}:${variant}:${seed}`;
      const item=family.generate(makeRng(label),{difficulty:+level,variant});
      assert.deepEqual(item,family.generate(makeRng(label),{difficulty:+level,variant}));
      assert.deepEqual(validateItem(item),[],label);
      assert.ok(family.verify(item).ok,label);
      assert.equal(item.options.filter(o=>Math.abs(o.value-item.answer.value)<1e-12).length,1,label);
      if(item.curriculum.domain==='probability')assert.ok(item.options.every(o=>o.value>=0&&o.value<=1));
      if(item.curriculum.domain==='count')assert.ok(item.options.every(o=>Number.isSafeInteger(o.value)&&o.value>=0));
      assert.doesNotMatch(JSON.stringify(item.solution),/NaN|undefined|Infinity/);
      assert.ok(item.transfer.operations.length>0);
      if(seed===0){const corrupt=structuredClone(item);corrupt.answer.value+=.03125;corrupt.options[corrupt.answerIndex].value=corrupt.answer.value;assert.equal(family.verify(corrupt).ok,false,'checker must reject a wrong answer even when its key agrees');}
    }
  });
}
test('curriculum: model contrasts include genuine dependence changes across all four contexts',()=>{
  const seen=new Set();
  for(let seed=0;seed<256;seed++){
    const item=counts.generate(makeRng(`replacement-coverage:${seed}`),{difficulty:2,variant:'replacement'}),e=item.params.e;
    seen.add(`${e.context}:${e.replacement}`);assert.ok(counts.verify(item).ok);
  }
  for(const key of ['coin:true','die:true','cards:true','cards:false','urn:true','urn:false'])assert.ok(seen.has(key),key);
});
test('curriculum: conditioning on a binomial total cancels p, and incompatible blocks have zero mass',()=>{
  const byConfig=new Map();let zero=false;
  for(let seed=0;seed<300;seed++){
    const item=counts.generate(makeRng(`split-invariance:${seed}`),{difficulty:3,variant:'split'}),{a,b,K,j}=item.params,key=[a,b,K,j].join(':');
    if(byConfig.has(key))almost(item.answer.value,byConfig.get(key));byConfig.set(key,item.answer.value);
    if(j>K||K-j>b){assert.equal(item.answer.value,0);zero=true;}
  }
  assert.ok(zero);
});
test('curriculum: variance distinguishes reuse, independence, signs and complete sampling',()=>{
  let full=false,cancel=false,negative=false,zeroCov=false;
  for(let seed=0;seed<256;seed++) {
    for(const variant of ['sample','reuse','sum','covariance']){
      const difficulty = ['sum', 'reuse'].includes(variant) ? 2 : 3;
      const item=variance.generate(makeRng(`variance-edge:${variant}:${seed}`),{difficulty,variant}),p=item.params;
      assert.ok(variance.verify(item).ok);
      if(variant==='sample'&&p.n===p.N){full=true;assert.equal(item.answer.value,0);}
      if(variant==='reuse'&&p.a+p.b===0){cancel=true;assert.equal(item.answer.value,0);}
      if(variant==='covariance'){negative||=item.answer.value<0;zeroCov||=item.answer.value===0;}
      else assert.ok(item.answer.value>=0);
    }
  }
  assert.ok(full&&cancel&&negative&&zeroCov);
});
test('curriculum: gap impossibility is retained and repeated strings are integer counts',()=>{
  let impossible=false;
  for(let seed=0;seed<128;seed++) {
    const it=counting.generate(makeRng(`gap-edges:${seed}`),{difficulty:3,variant:'gaps'}),{r,b}=it.params;
    if(r>b+1){impossible=true;assert.equal(it.answer.value,0);}assert.ok(counting.verify(it).ok);
    const count=counting.generate(makeRng(`string-edges:${seed}`),{difficulty:3,variant:'repeated'});assert.ok(Number.isInteger(count.answer.value));
  }
  assert.ok(impossible);
});
test('curriculum: all 175 later-success/memoryless finite inputs verify and remain independently selectable',()=>{
  const pool=finiteVariants(first,2);assert.equal(pool.length,197);
  const extra=pool.filter(i=>['memoryless','rth'].includes(i.params.variant));assert.equal(extra.length,175);
  assert.equal(new Set(pool.map(questionKey)).size,pool.length);
  for(const item of extra){assert.deepEqual(validateItem(item),[]);assert.ok(first.verify(item).ok);const p=item.params;if(p.variant==='rth'&&p.k===p.r)almost(item.answer.value,(p.a/p.c)**p.r);}
  const grouped=new Map();for(const it of extra.filter(i=>i.params.variant==='memoryless')){const {a,c,m}=it.params,key=[a,c,m].join(':');if(grouped.has(key))almost(it.answer.value,grouped.get(key));grouped.set(key,it.answer.value);}
});
test('curriculum: answer position is shuffled and structural labels distinguish actual model choices',()=>{
  for(const [family,tasks]of models){const positions=new Set(),structures=new Set();for(const level of Object.keys(tasks))for(let seed=0;seed<128;seed++){
    const raw=family.generate(makeRng(`curriculum-layout:${family.id}:${level}:${seed}`),{difficulty:+level});
    const item=presentation(raw,makeRng(`curriculum-position:${seed}`));positions.add(item.answerIndex);structures.add(structureKey(item));assert.equal(item.options[item.answerIndex].value,raw.answer.value);
  }assert.equal(positions.size,5);assert.ok(structures.size>=3);}
});
test('curriculum: without-replacement answers may equal their replacement comparison',()=>{
  let found=false;for(let seed=0;seed<2000&&!found;seed++){
    const item=urn.generate(makeRng(`urn-coincidence:${seed}`),{difficulty:3}),p=item.params;
    if(p.r===p.b&&p.k===3&&p.j===2&&p.atLeast){found=true;assert.equal(item.answer.value,.5);assert.match(item.solution.check,/can coincide/);assert.ok(urn.verify(item).ok);}
  }assert.ok(found);
});
test('curriculum: knowing-host random-switch rate survives biased reveal policies; labelled posteriors need not match',()=>{
  // Four doors, one reveal. Deterministically reveal the lowest eligible goat.
  let switched=0,stay=0,observed=0,carAt2=0,carAt3=0;
  for(let car=0;car<4;car++){
    const opened=[1,2,3].find(d=>d!==car),closed=[1,2,3].filter(d=>d!==opened);
    stay+=Number(car===0)/4;switched+=closed.filter(d=>d===car).length/closed.length/4;
    if(opened===1){observed+=1/4;carAt2+=Number(car===2)/4;carAt3+=Number(car===3)/4;}
  }
  almost(stay,.25);almost(switched,3/8);almost(carAt2/observed,1/3);almost(carAt3/observed,1/3);
  assert.notEqual(carAt2/observed,3/8);
  for(let seed=0;seed<80;seed++){const it=monty.generate(makeRng(`host-feedback:${seed}`),{difficulty:3});assert.ok(monty.verify(it).ok);if(it.params.variant==='switch')assert.match(JSON.stringify(it.solution),/Labelled doors need not/);}
});
