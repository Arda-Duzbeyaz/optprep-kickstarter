import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeRng} from '../../src/core/rng.js';
import {PRACTICE_MODULES} from '../../src/practice/index.js';
import {validateItem} from '../../src/core/contract.js';
import {presentation} from '../../src/core/presentation.js';
import {checkItem,positionOutcome} from '../../src/core/check.js';
import {UNCERTAINTY_TASKS} from '../../src/sections/iv/families/uncertainty-models.js';
import {bestInterval,expectedScore} from '../../src/sections/iv/optimal.js';
const fam=(s,id)=>PRACTICE_MODULES[s].families.find(f=>f.id===id);
for(const [s,id]of [['ll','conditional-rates'],['iv','uncertainty-models']]){
 const f=fam(s,id);
 test(`battery/${s}/${id}: contract, independent verification and reproducibility at every level`,()=>{
  for(const difficulty of f.levels)for(let n=0;n<160;n++){
   const seed=`battery-new:${s}:${difficulty}:${n}`,it=f.generate(makeRng(seed),{difficulty});
   assert.deepEqual(validateItem(it),[],seed);assert.ok(f.verify(it).ok,seed);
   assert.deepEqual(it,f.generate(makeRng(seed),{difficulty}),seed);
  }
 });
}
test('battery/ll: unequal-width heights must be multiplied by width',()=>{
 const f=fam('ll','histogram-bins');let oppositeOrder=false;
 for(let n=0;n<200;n++){
  const it=f.generate(makeRng(`density:${n}`),{difficulty:4}),v=it.prompt.visual;
  assert.equal(v.density,true);assert.ok(new Set(v.bins.map(b=>b.to-b.from)).size>1);
  assert.ok(v.bins.every(b=>Number.isInteger(b.count/(b.to-b.from))));
  for(const a of v.bins)for(const b of v.bins)if((a.count-b.count)*(a.count/(a.to-a.from)-b.count/(b.to-b.from))<0)oppositeOrder=true;
  assert.ok(f.verify(it).ok);assert.deepEqual(validateItem(it),[]);
 }
 assert.ok(oppositeOrder,'real generated bars include height and count rankings that disagree');
});
test('battery/ll: pooled comparisons include reversals and agreements, both method advantages, all order positions',()=>{
 const f=fam('ll','conditional-rates'),modes=new Set(),reversals=new Set(),orders=new Set(),advantages=new Set();
 for(let n=0;n<450;n++){
  const it=f.generate(makeRng(`stratified:${n}`),{difficulty:4});
  modes.add(it.params.scenario);reversals.add(it.params.reversal);orders.add(it.answerOrder.join());
  const r=it.prompt.visual.rows;advantages.add(Math.sign(r[0][3]/r[0][2]-r[2][3]/r[2][2]));
 }
 assert.equal(modes.size,3);assert.equal(reversals.size,2);assert.equal(advantages.size,2);assert.equal(orders.size,6);
});
test('battery/ll: scatter circles are distinct and separated in displayed coordinates',()=>{
 const f=fam('ll','scatter-regions');
 for(const difficulty of f.levels)for(let seed=0;seed<100;seed++){
  const it=f.generate(makeRng(`scatter-spacing:${difficulty}:${seed}`),{difficulty}),pts=it.prompt.visual.points;
  for(let i=0;i<pts.length;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1])>=.55-1e-10);
  assert.ok(f.verify(it).ok);
 }
});
test('battery/iv: every uncertainty branch, both endpoint directions and nonzero positive targets',()=>{
 const f=fam('iv','uncertainty-models');
 for(const [d,tasks]of Object.entries(UNCERTAINTY_TASKS))for(const variant of tasks){
  const ends=new Set();
  for(let n=0;n<40;n++){const it=f.generate(makeRng(`uncertainty:${d}:${variant}:${n}`),{difficulty:+d,variant});assert.ok(f.verify(it).ok);assert.ok(it.truth>0);assert.equal(checkItem(it,{lower:it.truth,upper:it.truth}).score,1);ends.add(it.params.upper);}
  if(variant.endsWith('-bound'))assert.equal(ends.size,2);
 }
});
test('battery/iv: bounds and SD counterexamples are verified by actual finite possibilities',()=>{
 const f=fam('iv','uncertainty-models');
 for(let n=0;n<120;n++)for(const variant of UNCERTAINTY_TASKS[4]){
  const it=f.generate(makeRng(`sd:${variant}:${n}`),{difficulty:4,variant});
  const {c,d}=it.params;
  assert.ok(Math.abs(it.truth-(variant==='independent-sum-sd'?Math.sqrt(c*c+d*d):variant==='shared-sum-sd'?c+d:Math.abs(c-d)))<1e-12);
  const explanation=JSON.stringify(it.solution);
  if(variant==='independent-sum-sd'){
   const possible=[c+d,c-d,-c+d,-c-d],maxMagnitude=Math.max(...possible.map(Math.abs));
   assert.ok(maxMagnitude>it.truth);assert.ok(explanation.includes(`largest possible absolute sum is ${maxMagnitude}`));
  }else assert.ok(explanation.includes(`magnitude happens to equal its standard deviation`));
 }
});
test('battery/nl: hard answer-producing strands are quadratic and Fibonacci, with four shown terms',()=>{
 const f=fam('nl','interleaved');
 for(const difficulty of [4,5])for(let n=0;n<120;n++){
  const it=f.generate(makeRng(`hard-strand:${difficulty}:${n}`),{difficulty}),p=it.params.coeffs;
  assert.equal(p.strands[p.show%2].k,difficulty===4?'quad':'fib');assert.ok(p.show>=8);assert.ok(f.verify(it).ok);
 }
});
test('battery/nl: square and geometric residuals occur alongside all retained combination variants',()=>{
 const f=fam('nl','mixed-combo'),variants=new Set(),positions=new Set();
 for(let n=0;n<600;n++){
  const it=f.generate(makeRng(`nl-residual:${n}`),{difficulty:5});variants.add(it.params.coeffs.v);
  const shuffled=presentation(it,makeRng(`shuffle:${n}`));positions.add(shuffled.answerIndex);assert.ok(f.verify(shuffled).ok);assert.deepEqual(validateItem(shuffled),[]);
 }
 assert.deepEqual([...variants].sort(),['altConst','indexMul','minusIndex','plusGeometric','plusIndex','plusSquare'].sort());assert.equal(positions.size,5);
});
test('battery/ob: signed weighted baskets close every product with executable bid/ask cash',()=>{
 const f=fam('ob','weighted'),shapes=new Set(),sides=new Set();let signed=0;
 for(const difficulty of f.levels)for(let n=0;n<160;n++){
  const it=f.generate(makeRng(`signed-basket:${difficulty}:${n}`),{difficulty});
  assert.deepEqual(validateItem(it),[]);assert.ok(f.verify(it).ok);
  const result=positionOutcome(it.board,it.best.trades);assert.equal(result.flat,true);assert.ok(result.profit>0);assert.equal(checkItem(it,{trades:it.best.trades}).correct,true);
  const target=it.board.instruments.find(i=>i.legs.some(q=>Math.abs(q)>1));
  if(target?.legs.some(q=>q<0)){signed++;shapes.add(target.legs.join());sides.add(it.best.trades.find(t=>t.id===target.id).side);}
 }
 assert.ok(signed>50);assert.ok(shapes.size>=5);assert.equal(sides.size,2);
});
test('battery/iv: proposed optimum beats nearby alternatives under its assumed model',()=>{
 // Independent numerical integration, not the generator normal-CDF implementation.
 const density=(x,m,s)=>Math.exp(-.5*((x-m)/s)**2)/(s*Math.sqrt(2*Math.PI));
 const integrate=(lo,hi,m,s)=>{const n=10000,h=(hi-lo)/n;let sum=0;for(let k=0;k<n;k++)sum+=density(lo+(k+.5)*h,m,s);return sum*h*lo/hi;};
 for(const sd of [1,3,10,20]){
  const o=bestInterval({kind:'normal',sd},100),v=integrate(o.lower,o.upper,100,sd);
  assert.ok(Math.abs(v-expectedScore({kind:'normal',sd},100,o.lower,o.upper))<1e-6);
  for(const dl of [-sd*.1,0,sd*.1])for(const du of [-sd*.1,0,sd*.1])assert.ok(v+1e-5>=integrate(o.lower+dl,o.upper+du,100,sd));
 }
});
